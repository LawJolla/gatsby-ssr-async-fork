"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promise = require(`bluebird`);

var glob = require(`glob`);
var _ = require(`lodash`);
var slash = require(`slash`);
var fs = require(`fs-extra`);
var md5File = require(`md5-file/promise`);
var crypto = require(`crypto`);
var del = require(`del`);

var apiRunnerNode = require(`../utils/api-runner-node`);
var testRequireError = require(`../utils/test-require-error`);

var _require = require(`graphql`),
    graphql = _require.graphql;

var _require2 = require(`../redux`),
    store = _require2.store,
    emitter = _require2.emitter;

var loadPlugins = require(`./load-plugins`);

var _require3 = require(`../utils/cache`),
    initCache = _require3.initCache;

var report = require(`../reporter`);

// Show stack trace on unhandled promises.
process.on(`unhandledRejection`, function (reason, p) {
  report.panic(reason);
});

var _require4 = require(`../internal-plugins/query-runner/query-watcher`),
    extractQueries = _require4.extractQueries;

var _require5 = require(`../internal-plugins/query-runner/page-query-runner`),
    runQueries = _require5.runQueries;

var _require6 = require(`../internal-plugins/query-runner/pages-writer`),
    writePages = _require6.writePages;

var _require7 = require(`../internal-plugins/query-runner/redirects-writer`),
    writeRedirects = _require7.writeRedirects;

// Override console.log to add the source file + line number.
// Useful for debugging if you lose a console.log somewhere.
// Otherwise leave commented out.
// require(`./log-line-function`)

var preferDefault = function preferDefault(m) {
  return m && m.default || m;
};

module.exports = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(program) {
    var activity, config, flattenedPlugins, pluginVersions, hashes, pluginsHash, state, oldPluginsHash, srcDir, siteDir, tryRequire, hasAPIFile, ssrPlugins, browserPlugins, browserAPIRunner, browserPluginsRequires, sSRAPIRunner, ssrPluginsRequires, extensions, apiResults, graphqlRunner, checkJobsDone;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // Fix program directory path for windows env.
            program.directory = slash(program.directory);

            store.dispatch({
              type: `SET_PROGRAM`,
              payload: program
            });

            // Delete html files from the public directory as we don't want deleted
            // pages from previous builds to stick around.
            activity = report.activityTimer(`delete html files from previous builds`);

            activity.start();
            _context.next = 6;
            return del([`public/*.html`, `public/**/*.html`]);

          case 6:
            activity.end();

            // Try opening the site's gatsby-config.js file.
            activity = report.activityTimer(`open and validate gatsby-config.js`);
            activity.start();
            config = void 0;

            try {
              // $FlowFixMe
              config = preferDefault(require(`${program.directory}/gatsby-config`));
            } catch (err) {
              if (!testRequireError(`${program.directory}/gatsby-config`, err)) {
                report.error(`Could not load gatsby-config`, err);
                process.exit(1);
              }
            }

            store.dispatch({
              type: `SET_SITE_CONFIG`,
              payload: config
            });

            activity.end();

            _context.next = 15;
            return loadPlugins(config);

          case 15:
            flattenedPlugins = _context.sent;


            // Check if any plugins have been updated since our last run. If so
            // we delete the cache is there's likely been changes
            // since the previous run.
            //
            // We do this by creating a hash of all the version numbers of installed
            // plugins, the site's package.json, gatsby-config.js, and gatsby-node.js.
            // The last, gatsby-node.js, is important as many gatsby sites put important
            // logic in there e.g. generating slugs for custom pages.
            pluginVersions = flattenedPlugins.map(function (p) {
              return p.version;
            });
            _context.next = 19;
            return Promise.all([md5File(`package.json`), Promise.resolve(md5File(`${program.directory}/gatsby-config.js`).catch(function () {})), // ignore as this file isn't required),
            Promise.resolve(md5File(`${program.directory}/gatsby-node.js`).catch(function () {}))] // ignore as this file isn't required),
            );

          case 19:
            hashes = _context.sent;
            pluginsHash = crypto.createHash(`md5`).update(JSON.stringify(pluginVersions.concat(hashes))).digest(`hex`);
            state = store.getState();
            oldPluginsHash = state && state.status ? state.status.PLUGINS_HASH : ``;

            // Check if anything has changed. If it has, delete the site's .cache
            // directory and tell reducers to empty themselves.
            //
            // Also if the hash isn't there, then delete things just in case something
            // is weird.

            if (oldPluginsHash && pluginsHash !== oldPluginsHash) {
              report.info(report.stripIndent`
      One or more of your plugins have changed since the last time you ran Gatsby. As
      a precaution, we're deleting your site's cache to ensure there's not any stale
      data
    `);
            }

            if (!(!oldPluginsHash || pluginsHash !== oldPluginsHash)) {
              _context.next = 34;
              break;
            }

            _context.prev = 25;
            _context.next = 28;
            return fs.remove(`${program.directory}/.cache`);

          case 28:
            _context.next = 33;
            break;

          case 30:
            _context.prev = 30;
            _context.t0 = _context["catch"](25);

            report.error(`Failed to remove .cache files.`, _context.t0);

          case 33:
            // Tell reducers to delete their data (the store will already have
            // been loaded from the file system cache).
            store.dispatch({
              type: `DELETE_CACHE`
            });

          case 34:

            // Update the store with the new plugins hash.
            store.dispatch({
              type: `UPDATE_PLUGINS_HASH`,
              payload: pluginsHash
            });

            // Now that we know the .cache directory is safe, initialize the cache
            // directory.
            initCache();

            // Ensure the public/static directory is created.
            _context.next = 38;
            return fs.ensureDirSync(`${program.directory}/public/static`);

          case 38:

            // Copy our site files to the root of the site.
            activity = report.activityTimer(`copy gatsby files`);
            activity.start();
            srcDir = `${__dirname}/../../cache-dir`;
            siteDir = `${program.directory}/.cache`;
            tryRequire = `${__dirname}/../utils/test-require-error.js`;
            _context.prev = 43;
            _context.next = 46;
            return fs.copy(srcDir, siteDir, { clobber: true });

          case 46:
            _context.next = 48;
            return fs.copy(tryRequire, `${siteDir}/test-require-error.js`, {
              clobber: true
            });

          case 48:
            _context.next = 50;
            return fs.ensureDirSync(`${program.directory}/.cache/json`);

          case 50:
            _context.next = 52;
            return fs.ensureDirSync(`${program.directory}/.cache/layouts`);

          case 52:
            _context.next = 57;
            break;

          case 54:
            _context.prev = 54;
            _context.t1 = _context["catch"](43);

            report.panic(`Unable to copy site files to .cache`, _context.t1);

          case 57:

            // Find plugins which implement gatsby-browser and gatsby-ssr and write
            // out api-runners for them.
            hasAPIFile = function hasAPIFile(env, plugin) {
              return (
                // TODO make this async...
                glob.sync(`${plugin.resolve}/gatsby-${env}*`)[0]
              );
            };

            ssrPlugins = _.filter(flattenedPlugins.map(function (plugin) {
              return {
                resolve: hasAPIFile(`ssr`, plugin),
                options: plugin.pluginOptions
              };
            }), function (plugin) {
              return plugin.resolve;
            });
            browserPlugins = _.filter(flattenedPlugins.map(function (plugin) {
              return {
                resolve: hasAPIFile(`browser`, plugin),
                options: plugin.pluginOptions
              };
            }), function (plugin) {
              return plugin.resolve;
            });
            browserAPIRunner = ``;


            try {
              browserAPIRunner = fs.readFileSync(`${siteDir}/api-runner-browser.js`, `utf-8`);
            } catch (err) {
              report.panic(`Failed to read ${siteDir}/api-runner-browser.js`, err);
            }

            browserPluginsRequires = browserPlugins.map(function (plugin) {
              return `{
      plugin: require('${plugin.resolve}'),
      options: ${JSON.stringify(plugin.options)},
    }`;
            }).join(`,`);


            browserAPIRunner = `var plugins = [${browserPluginsRequires}]\n${browserAPIRunner}`;

            sSRAPIRunner = ``;


            try {
              sSRAPIRunner = fs.readFileSync(`${siteDir}/api-runner-ssr.js`, `utf-8`);
            } catch (err) {
              report.panic(`Failed to read ${siteDir}/api-runner-ssr.js`, err);
            }

            ssrPluginsRequires = ssrPlugins.map(function (plugin) {
              return `{
      plugin: require('${plugin.resolve}'),
      options: ${JSON.stringify(plugin.options)},
    }`;
            }).join(`,`);

            sSRAPIRunner = `var plugins = [${ssrPluginsRequires}]\n${sSRAPIRunner}`;

            fs.writeFileSync(`${siteDir}/api-runner-browser.js`, browserAPIRunner, `utf-8`);
            fs.writeFileSync(`${siteDir}/api-runner-ssr.js`, sSRAPIRunner, `utf-8`);

            activity.end();
            /**
             * Start the main bootstrap processes.
             */

            // onPreBootstrap
            activity = report.activityTimer(`onPreBootstrap`);
            activity.start();
            _context.next = 75;
            return apiRunnerNode(`onPreBootstrap`);

          case 75:
            activity.end();

            // Source nodes
            activity = report.activityTimer(`source and transform nodes`);
            activity.start();
            _context.next = 80;
            return require(`../utils/source-nodes`)();

          case 80:
            activity.end();

            // Create Schema.
            activity = report.activityTimer(`building schema`);
            activity.start();
            _context.next = 85;
            return require(`../schema`)();

          case 85:
            activity.end();

            // Collect resolvable extensions and attach to program.
            extensions = [`.js`, `.jsx`];
            // Change to this being an action and plugins implement `onPreBootstrap`
            // for adding extensions.

            _context.next = 89;
            return apiRunnerNode(`resolvableExtensions`, {
              traceId: `initial-resolvableExtensions`
            });

          case 89:
            apiResults = _context.sent;


            store.dispatch({
              type: `SET_PROGRAM_EXTENSIONS`,
              payload: _.flattenDeep([extensions, apiResults])
            });

            graphqlRunner = function graphqlRunner(query) {
              var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

              var schema = store.getState().schema;
              return graphql(schema, query, context, context, context);
            };

            // Collect layouts.


            activity = report.activityTimer(`createLayouts`);
            activity.start();
            _context.next = 96;
            return apiRunnerNode(`createLayouts`, {
              graphql: graphqlRunner,
              traceId: `initial-createLayouts`,
              waitForCascadingActions: true
            });

          case 96:
            activity.end();

            // Collect pages.
            activity = report.activityTimer(`createPages`);
            activity.start();
            _context.next = 101;
            return apiRunnerNode(`createPages`, {
              graphql: graphqlRunner,
              traceId: `initial-createPages`,
              waitForCascadingActions: true
            });

          case 101:
            activity.end();

            // A variant on createPages for plugins that want to
            // have full control over adding/removing pages. The normal
            // "createPages" API is called every time (during development)
            // that data changes.
            activity = report.activityTimer(`createPagesStatefully`);
            activity.start();
            _context.next = 106;
            return apiRunnerNode(`createPagesStatefully`, {
              graphql: graphqlRunner,
              traceId: `initial-createPagesStatefully`,
              waitForCascadingActions: true
            });

          case 106:
            activity.end();
            // Extract queries
            activity = report.activityTimer(`extract queries from components`);
            activity.start();
            _context.next = 111;
            return extractQueries();

          case 111:
            activity.end();

            // Start the createPages hot reloader.
            if (process.env.NODE_ENV !== `production`) {
              require(`./page-hot-reloader`)(graphqlRunner);
            }

            // Run queries
            activity = report.activityTimer(`run graphql queries`);
            activity.start();
            _context.next = 117;
            return runQueries();

          case 117:
            activity.end();

            // Write out files.
            activity = report.activityTimer(`write out page data`);
            activity.start();
            _context.next = 122;
            return writePages();

          case 122:
            activity.end();

            // Write out redirects.
            activity = report.activityTimer(`write out redirect data`);
            activity.start();
            _context.next = 127;
            return writeRedirects();

          case 127:
            activity.end();

            // Update Schema for SitePage.
            activity = report.activityTimer(`update schema`);
            activity.start();
            _context.next = 132;
            return require(`../schema`)();

          case 132:
            activity.end();

            checkJobsDone = _.debounce(function (resolve) {
              var state = store.getState();
              if (state.jobs.active.length === 0) {
                report.log(``);
                report.info(`bootstrap finished - ${process.uptime()} s`);
                report.log(``);
                resolve({ graphqlRunner });
              }
            }, 100);

            if (!(store.getState().jobs.active.length === 0)) {
              _context.next = 146;
              break;
            }

            // onPostBootstrap
            activity = report.activityTimer(`onPostBootstrap`);
            activity.start();
            _context.next = 139;
            return apiRunnerNode(`onPostBootstrap`);

          case 139:
            activity.end();

            report.log(``);
            report.info(`bootstrap finished - ${process.uptime()} s`);
            report.log(``);
            return _context.abrupt("return", { graphqlRunner });

          case 146:
            return _context.abrupt("return", new Promise(function (resolve) {
              // Wait until all side effect jobs are finished.
              emitter.on(`END_JOB`, function () {
                return checkJobsDone(resolve);
              });
            }));

          case 147:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined, [[25, 30], [43, 54]]);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();
//# sourceMappingURL=index.js.map