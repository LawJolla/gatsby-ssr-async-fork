"use strict";

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const path = require(`path`);
const { store } = require(`../redux`);

const generatePathChunkName = path => {
  const name = path === `/` ? `index` : _lodash2.default.kebabCase(path);
  return `path---${name}`;
};

const generateComponentChunkName = componentPath => {
  const program = store.getState().program;
  let directory = `/`;
  if (program && program.directory) {
    directory = program.directory;
  }
  const name = path.relative(directory, componentPath);
  return `component---${_lodash2.default.kebabCase(name)}`;
};

exports.generatePathChunkName = generatePathChunkName;
exports.generateComponentChunkName = generateComponentChunkName;
//# sourceMappingURL=js-chunk-names.js.map