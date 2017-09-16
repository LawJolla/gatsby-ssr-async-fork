"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var startServer = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(program) {
    var _this = this;

    var directory, directoryPath, createIndexHtml, compilerConfig, devConfig, compiler, app, proxy, prefix, url, server, io, listener, watchGlobs;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            directory = program.directory;
            directoryPath = withBasePath(directory);

            createIndexHtml = function createIndexHtml() {
              return developHtml(program).catch(function (err) {
                if (err.name !== `WebpackError`) {
                  report.panic(err);
                  return;
                }
                report.panic(report.stripIndent`
          There was an error compiling the html.js component for the development server.

          See our docs page on debugging HTML builds for help https://goo.gl/yL9lND
        `, err);
              });
            };

            // Start bootstrap process.


            _context2.next = 5;
            return bootstrap(program);

          case 5:
            _context2.next = 7;
            return createIndexHtml();

          case 7:
            _context2.next = 9;
            return webpackConfig(program, directory, `develop`, program.port);

          case 9:
            compilerConfig = _context2.sent;
            devConfig = compilerConfig.resolve();
            compiler = webpack(devConfig);

            /**
             * Set up the express app.
             **/

            app = express();

            app.use(require(`webpack-hot-middleware`)(compiler, {
              log: function log() {},
              path: `/__webpack_hmr`,
              heartbeat: 10 * 1000
            }));
            app.use(`/___graphql`, graphqlHTTP({
              schema: store.getState().schema,
              graphiql: true
            }));

            app.use(express.static(__dirname + `/public`));

            app.use(require(`webpack-dev-middleware`)(compiler, {
              noInfo: true,
              quiet: true,
              publicPath: devConfig.output.publicPath
            }));

            // Set up API proxy.
            proxy = store.getState().config.proxy;

            if (proxy) {
              prefix = proxy.prefix, url = proxy.url;

              app.use(`${prefix}/*`, function (req, res) {
                var proxiedUrl = url + req.originalUrl;
                req.pipe(request(proxiedUrl)).pipe(res);
              });
            }

            // Check if the file exists in the public folder.
            app.get(`*`, function (req, res, next) {
              // Load file but ignore errors.
              res.sendFile(directoryPath(`/public/${req.url}`), function (err) {
                // No err so a file was sent successfully.
                if (!err || !err.path) {
                  next();
                } else if (err) {
                  // There was an error. Let's check if the error was because it
                  // couldn't find an HTML file. We ignore these as we want to serve
                  // all HTML from our single empty SSR html file.
                  var parsedPath = parsePath(err.path);
                  if (parsedPath.extname === `` || parsedPath.extname.startsWith(`.html`)) {
                    next();
                  } else {
                    res.status(404).end();
                  }
                }
              });
            });

            // Render an HTML page and serve it.
            app.use(function (req, res, next) {
              var parsedPath = parsePath(req.originalUrl);
              if (parsedPath.extname === `` || parsedPath.extname.startsWith(`.html`)) {
                res.sendFile(directoryPath(`public/index.html`), function (err) {
                  if (err) {
                    res.status(500).end();
                  }
                });
              } else {
                next();
              }
            });

            /**
             * Set up the HTTP server and socket.io.
             **/

            server = require(`http`).Server(app);
            io = require(`socket.io`)(server);


            io.on(`connection`, function (socket) {
              socket.join(`clients`);
            });

            listener = server.listen(program.port, program.host, function (err) {
              if (err) {
                if (err.code === `EADDRINUSE`) {
                  // eslint-disable-next-line max-len
                  report.panic(`Unable to start Gatsby on port ${program.port} as there's already a process listing on that port.`);
                  return;
                }

                report.panic(`There was a problem starting the development server`, err);
              }

              if (program.open) {
                var host = listener.address().address === `127.0.0.1` ? `localhost` : listener.address().address;
                require(`opn`)(`http://${host}:${listener.address().port}`);
              }
            });

            // Register watcher that rebuilds index.html every time html.js changes.

            watchGlobs = [`src/html.js`, `plugins/**/gatsby-ssr.js`].map(directoryPath);

            chokidar.watch(watchGlobs).on(`change`, (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
              return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _context.next = 2;
                      return createIndexHtml();

                    case 2:
                      io.to(`clients`).emit(`reload`);

                    case 3:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, _this);
            })));

          case 27:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function startServer(_x) {
    return _ref.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var express = require(`express`);
var graphqlHTTP = require(`express-graphql`);
var request = require(`request`);
var bootstrap = require(`../bootstrap`);
var chokidar = require(`chokidar`);
var webpack = require(`webpack`);
var webpackConfig = require(`./webpack.config`);
var rl = require(`readline`);
var parsePath = require(`parse-filepath`);

var _require = require(`../redux`),
    store = _require.store;

var copyStaticDirectory = require(`./copy-static-directory`);
var developHtml = require(`./develop-html`);

var _require2 = require(`./path`),
    withBasePath = _require2.withBasePath;

var report = require(`../reporter`);

// Watch the static directory and copy files to public as they're added or
// changed. Wait 10 seconds so copying doesn't interfer with the regular
// bootstrap.
setTimeout(function () {
  copyStaticDirectory();
}, 10000);

var rlInterface = rl.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Quit immediately on hearing ctrl-c
rlInterface.on(`SIGINT`, function () {
  process.exit();
});

module.exports = function (program) {
  var detect = require(`detect-port`);
  var port = typeof program.port === `string` ? parseInt(program.port, 10) : program.port;

  detect(port, function (err, _port) {
    if (err) {
      report.panic(err);
    }

    if (port !== _port) {
      // eslint-disable-next-line max-len
      var question = `Something is already running at port ${port} \nWould you like to run the app at another port instead? [Y/n] `;

      return rlInterface.question(question, function (answer) {
        if (answer.length === 0 || answer.match(/^yes|y$/i)) {
          program.port = _port; // eslint-disable-line no-param-reassign
        }

        return startServer(program);
      });
    }

    return startServer(program);
  });
};
//# sourceMappingURL=develop.js.map