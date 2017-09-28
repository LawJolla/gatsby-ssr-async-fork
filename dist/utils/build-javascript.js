"use strict";

var _webpack = require("webpack");

var _webpack2 = _interopRequireDefault(_webpack);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _webpack3 = require("./webpack.config");

var _webpack4 = _interopRequireDefault(_webpack3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = async program => {
  const { directory } = program;

  const compilerConfig = await (0, _webpack4.default)(program, directory, `build-javascript`);

  return new _bluebird2.default(resolve => {
    (0, _webpack2.default)(compilerConfig.resolve()).run(() => resolve());
  });
};
//# sourceMappingURL=build-javascript.js.map