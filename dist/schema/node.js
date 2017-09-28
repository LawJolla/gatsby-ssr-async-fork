"use strict";

var _graphqlRelay = require("graphql-relay");

// const { nodeInterface, nodeField } = nodeDefinitions(
module.exports = (0, _graphqlRelay.nodeDefinitions)(globalId => {
  const { type, id } = fromGlobalId(globalId);
  return null;
}, obj => obj.ships ? factionType : shipType);
//# sourceMappingURL=node.js.map