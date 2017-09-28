"use strict";

var _webpack = require("webpack");

var _webpack2 = _interopRequireDefault(_webpack);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _webpack3 = require("./webpack.config");

var _webpack4 = _interopRequireDefault(_webpack3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { store } = require(`../redux`);
const { createErrorFromString } = require(`../reporter/errors`);

const debug = require(`debug`)(`gatsby:html`);

module.exports = async program => {
  const { directory } = program;

  debug(`generating static HTML`);
  // Reduce pages objects to an array of paths.
  const pages = store.getState().pages.map(page => page.path);

  // Static site generation.
  const compilerConfig = await (0, _webpack4.default)(program, directory, `build-html`, null, pages);

  return new _bluebird2.default((resolve, reject) => {
    (0, _webpack2.default)(compilerConfig.resolve()).run((e, stats) => {
      if (e) {
        return reject(e);
      }
      const outputFile = `${directory}/public/render-page.js`;
      if (stats.hasErrors()) {
        let webpackErrors = stats.toJson().errors;
        return reject(createErrorFromString(webpackErrors[0], `${outputFile}.map`));
      }

      // Remove the temp JS bundle file built for the static-site-generator-plugin
      try {
        _fs2.default.unlinkSync(outputFile);
      } catch (e) {
        // This function will fail on Windows with no further consequences.
      }
      return resolve(null, stats);
    });
  });
};
//# sourceMappingURL=build-html.js.map