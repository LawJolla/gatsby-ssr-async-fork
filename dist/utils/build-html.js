"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webpack = require("webpack");

var _webpack2 = _interopRequireDefault(_webpack);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _webpack3 = require("./webpack.config");

var _webpack4 = _interopRequireDefault(_webpack3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require(`../redux`),
    store = _require.store;

var _require2 = require(`../reporter/errors`),
    createErrorFromString = _require2.createErrorFromString;

var debug = require(`debug`)(`gatsby:html`);

module.exports = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(program) {
    var directory, pages, compilerConfig;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = program.directory;


            debug(`generating static HTML`);
            // Reduce pages objects to an array of paths.
            pages = store.getState().pages.map(function (page) {
              return page.path;
            });

            // Static site generation.

            _context.next = 5;
            return (0, _webpack4.default)(program, directory, `build-html`, null, pages);

          case 5:
            compilerConfig = _context.sent;
            return _context.abrupt("return", new _bluebird2.default(function (resolve, reject) {
              (0, _webpack2.default)(compilerConfig.resolve()).run(function (e, stats) {
                if (e) {
                  return reject(e);
                }
                var outputFile = `${directory}/public/render-page.js`;
                if (stats.hasErrors()) {
                  var webpackErrors = stats.toJson().errors;
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
            }));

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();
//# sourceMappingURL=build-html.js.map