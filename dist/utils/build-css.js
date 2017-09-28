"use strict";

var _webpack = require("webpack");

var _webpack2 = _interopRequireDefault(_webpack);

var _fsExtra = require("fs-extra");

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _webpack3 = require("./webpack.config");

var _webpack4 = _interopRequireDefault(_webpack3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = async program => {
  const { directory } = program;

  const compilerConfig = await (0, _webpack4.default)(program, directory, `build-css`);

  return new _bluebird2.default((resolve, reject) => {
    (0, _webpack2.default)(compilerConfig.resolve()).run(err => {
      if (err) {
        reject(err);
      }

      // We don't want any javascript produced by this step in the process.
      try {
        _fsExtra2.default.unlinkSync(`${directory}/public/bundle-for-css.js`);
      } catch (e) {}
      // ignore.


      // Ensure there's a styles.css file in public so tools that expect it
      // can find it.
      _fsExtra2.default.ensureFile(`${directory}/public/styles.css`, err => {
        resolve(err);
      });
    });
  });
};
//# sourceMappingURL=build-css.js.map