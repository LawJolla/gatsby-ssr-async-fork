"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require(`lodash`);

var apiRunner = require(`./api-runner-node`);

var _require = require(`../redux`),
    store = _require.store,
    getNode = _require.getNode;

var _require2 = require(`../redux/actions`),
    boundActionCreators = _require2.boundActionCreators;

var deleteNodes = boundActionCreators.deleteNodes;


module.exports = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
  var state, touchedNodes, staleNodes;
  return _regenerator2.default.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return apiRunner(`sourceNodes`, {
            traceId: `initial-sourceNodes`,
            waitForCascadingActions: true
          });

        case 2:
          state = store.getState();

          // Garbage collect stale data nodes

          touchedNodes = Object.keys(state.nodesTouched);
          staleNodes = _.values(state.nodes).filter(function (node) {
            // Find the root node.
            var rootNode = node;
            var whileCount = 0;
            while (rootNode.parent && getNode(rootNode.parent) !== undefined && whileCount < 101) {
              rootNode = getNode(rootNode.parent);
              whileCount += 1;
              if (whileCount > 100) {
                console.log(`It looks like you have a node that's set its parent as itself`, rootNode);
              }
            }

            return !_.includes(touchedNodes, rootNode.id);
          });


          if (staleNodes.length > 0) {
            deleteNodes(staleNodes.map(function (n) {
              return n.id;
            }));
          }

        case 6:
        case "end":
          return _context.stop();
      }
    }
  }, _callee, undefined);
}));
//# sourceMappingURL=source-nodes.js.map