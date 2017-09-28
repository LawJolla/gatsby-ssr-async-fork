"use strict";

var _resolve = require("babel-core/lib/helpers/resolve");

var _resolve2 = _interopRequireDefault(_resolve);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _json = require("json5");

var _json2 = _interopRequireDefault(_json);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _objectAssign = require("object-assign");

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _apiRunnerNode = require("./api-runner-node");

var _apiRunnerNode2 = _interopRequireDefault(_apiRunnerNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO update this to store Babelrc config in Redux store.

/**
 * Uses babel-core helpers to resolve the plugin given it's name. It
 * resolves plugins in the following order:
 *
 * 1. Adding babel-type prefix and checking user's local modules
 * 2. Adding babel-type prefix and checking Gatsby's modules
 * 3. Checking users's modules without prefix
 * 4. Checking Gatsby's modules without prefix
 *
 */
function resolvePlugin(pluginName, directory, type) {
  // When a plugin is specified with options in babelrc, the pluginName contains
  // the array with [name, options]. In that case we extract the name.
  pluginName = Array.isArray(pluginName) ? pluginName[0] : pluginName;

  const gatsbyPath = _path2.default.resolve(__dirname, `..`, `..`);
  const plugin = (0, _resolve2.default)(`babel-${type}-${pluginName}`, directory) || (0, _resolve2.default)(`babel-${type}-${pluginName}`, gatsbyPath) || (0, _resolve2.default)(pluginName, directory) || (0, _resolve2.default)(pluginName, gatsbyPath);

  const name = _lodash2.default.startsWith(pluginName, `babel`) ? pluginName : `babel-${type}-${pluginName}`;
  const pluginInvariantMessage = `
  You are trying to use a Babel plugin or preset which Gatsby cannot find: ${pluginName}

  You can install it using "npm install --save ${name}".

  You can use any of the Gatsby provided plugins without installing them:
    - babel-plugin-add-module-exports
    - babel-plugin-transform-object-assign
    - babel-preset-es2015
    - babel-preset-react
    - babel-preset-stage-0
  `;

  (0, _invariant2.default)(plugin !== null, pluginInvariantMessage);
  return plugin;
}

/**
 * Normalizes a Babel config object to include only absolute paths.
 * This way babel-loader will correctly resolve Babel plugins
 * regardless of where they are located.
 */
function normalizeConfig(config, directory) {
  const normalizedConfig = {
    presets: [],
    plugins: []
  };

  const presets = config.presets || [];
  const plugins = config.plugins || [];

  const normalize = (value, name) => {
    let normalized;

    if (_lodash2.default.isArray(value)) {
      normalized = [resolvePlugin(value[0], directory, name), value[1]];
    } else {
      normalized = resolvePlugin(value, directory, name);
    }

    return normalized;
  };

  presets.forEach(preset => normalizedConfig.presets.push(normalize(preset, `preset`)));
  plugins.forEach(plugin => normalizedConfig.plugins.push(normalize(plugin, `plugin`)));

  return (0, _objectAssign2.default)({}, config, normalizedConfig);
}

/**
 * Locates a .babelrc in the Gatsby site root directory. Parses it using
 * json5 (what Babel uses). It throws an error if the users's .babelrc is
 * not parseable.
 */
function findBabelrc(directory) {
  try {
    const babelrc = _fs2.default.readFileSync(_path2.default.join(directory, `.babelrc`), `utf-8`);
    return _json2.default.parse(babelrc);
  } catch (error) {
    if (error.code === `ENOENT`) {
      return null;
    } else {
      throw error;
    }
  }
}

/**
 * Reads the user's package.json and returns the "babel" section. It will
 * return undefined when the "babel" section does not exist.
 */
function findBabelPackage(directory) {
  try {
    // $FlowIssue - https://github.com/facebook/flow/issues/1975
    const packageJson = require(_path2.default.join(directory, `package.json`));
    return packageJson.babel;
  } catch (error) {
    if (error.code === `MODULE_NOT_FOUND`) {
      return null;
    } else {
      throw error;
    }
  }
}

/**
 * Returns a normalized Babel config to use with babel-loader. All of
 * the paths will be absolute so that Babel behaves as expected.
 */
module.exports = async function babelConfig(program, stage) {
  const { directory } = program;

  let babelrc = findBabelrc(directory) || findBabelPackage(directory);

  // If user doesn't have a custom babelrc, add defaults.
  if (!babelrc) {
    babelrc = {};
  }
  if (!babelrc.plugins) {
    babelrc.plugins = [];
  }
  if (!babelrc.presets) {
    babelrc.presets = [];
  }

  // Add default plugins and presets.
  ;[[require.resolve(`babel-preset-env`), {
    loose: true,
    uglify: true,
    modules: `commonjs`,
    targets: {
      browsers: program.browserslist
    },
    exclude: [`transform-regenerator`, `transform-es2015-typeof-symbol`]
  }], `stage-0`, `react`].forEach(preset => {
    babelrc.presets.push(preset);
  });[`add-module-exports`, `transform-object-assign`].forEach(plugin => {
    babelrc.plugins.push(plugin);
  });

  if (stage === `develop`) {
    babelrc.plugins.unshift(`transform-react-jsx-source`);
    babelrc.plugins.unshift(`react-hot-loader/babel`);
  }

  babelrc.plugins.unshift(require.resolve(`./babel-plugin-extract-graphql`));

  if (!babelrc.hasOwnProperty(`cacheDirectory`)) {
    babelrc.cacheDirectory = true;
  }

  const normalizedConfig = normalizeConfig(babelrc, directory);
  let modifiedConfig = await (0, _apiRunnerNode2.default)(`modifyBabelrc`, {
    babelrc: normalizedConfig
  });
  if (modifiedConfig.length > 0) {
    modifiedConfig = _lodash2.default.merge({}, ...modifiedConfig);
    // Otherwise this means no plugin changed the babel config.
  } else {
    modifiedConfig = {};
  }

  // Merge all together.
  const merged = _lodash2.default.defaultsDeep(modifiedConfig, normalizedConfig);
  return merged;
};
//# sourceMappingURL=babel-config.js.map