"use strict";

var _graphqlRelay = require("graphql-relay");

// const { nodeInterface, nodeField } = nodeDefinitions(
module.exports = (0, _graphqlRelay.nodeDefinitions)(function (globalId) {
  var _fromGlobalId = fromGlobalId(globalId),
      type = _fromGlobalId.type,
      id = _fromGlobalId.id;

  return null;
}, function (obj) {
  return obj.ships ? factionType : shipType;
});
//# sourceMappingURL=node.js.map