"use strict";

var _detectPort = require("detect-port");

var _detectPort2 = _interopRequireDefault(_detectPort);

var _hapi = require("hapi");

var _hapi2 = _interopRequireDefault(_hapi);

var _opn = require("opn");

var _opn2 = _interopRequireDefault(_opn);

var _readline = require("readline");

var _readline2 = _interopRequireDefault(_readline);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*  weak */
var rlInterface = _readline2.default.createInterface({
  input: process.stdin,
  output: process.stdout
});

var debug = require(`debug`)(`gatsby:application`);

function startServer(program, launchPort) {
  var directory = program.directory;
  var serverPort = launchPort || program.port;

  debug(`Serving /public`);
  var server = new _hapi2.default.Server();

  server.connection({
    host: program.host,
    port: serverPort
  });

  server.route({
    method: `GET`,
    path: `/{path*}`,
    handler: {
      directory: {
        path: `${directory}/public`,
        listing: false,
        index: true
      }
    }
  });

  server.start(function (e) {
    if (e) {
      if (e.code === `EADDRINUSE`) {
        // eslint-disable-next-line max-len
        console.log(`Unable to start Gatsby on port ${serverPort} as there's already a process listing on that port.`);
      } else {
        console.log(e);
      }

      process.exit();
    } else {
      if (program.open) {
        (0, _opn2.default)(server.info.uri);
      }
      console.log(`Listening at:`, server.info.uri);
    }
  });
}

module.exports = function (program) {
  var port = typeof program.port === `string` ? parseInt(program.port, 10) : program.port;

  (0, _detectPort2.default)(port, function (err, _port) {
    if (err) {
      console.error(err);
      process.exit();
    }

    if (port !== _port) {
      // eslint-disable-next-line max-len
      var question = `Something is already running at port ${port} \nWould you like to run the app at another port instead? [Y/n] `;

      return rlInterface.question(question, function (answer) {
        if (answer.length === 0 || answer.match(/^yes|y$/i)) {
          program.port = _port;
        }

        return startServer(program, program.port);
      });
    }

    return startServer(program);
  });
};
//# sourceMappingURL=serve.js.map