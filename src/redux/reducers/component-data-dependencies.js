const _ = require(`lodash`)

module.exports = (state = { nodes: {}, connections: {} }, action) => {
  switch (action.type) {
    case `DELETE_CACHE`:
      return { nodes: {}, connections: {} }
    case `CREATE_COMPONENT_DEPENDENCY`:
      if (action.payload.path === ``) {
        return state
      }

      // If this nodeId not set yet.
      if (action.payload.nodeId) {
        let existingPaths = []
        if (state.nodes[action.payload.nodeId]) {
          existingPaths = state.nodes[action.payload.nodeId]
        }
        const newPaths = _.uniq(
          existingPaths.concat(action.payload.path || action.payload.id)
        )
        state.nodes[action.payload.nodeId] = newPaths
      }

      // If this connection not set yet.
      if (action.payload.connection) {
        let existingPaths = []
        if (state.connections[action.payload.connection]) {
          existingPaths = state.connections[action.payload.connection]
        }
        const newPaths = _.uniq(
          existingPaths.concat(action.payload.path || action.payload.id)
        )
        state.connections[action.payload.connection] = newPaths
      }

      return state
    case `DELETE_COMPONENTS_DEPENDENCIES`:
      state.nodes = _.mapValues(state.nodes, paths =>
        _.difference(paths, action.payload.paths)
      )
      state.connections = _.mapValues(state.connections, paths =>
        _.difference(paths, action.payload.paths)
      )

      return state
    case `DELETE_NODE`:
      delete state.nodes[action.payload]
      return state
    case `DELETE_NODES`:
      action.payload.forEach(n => delete state.nodes[n])
      return state
    default:
      return state
  }
}
