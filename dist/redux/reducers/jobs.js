"use strict";

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const _ = require(`lodash`);
const moment = require(`moment`);

module.exports = (state = { active: [], done: [] }, action) => {
  switch (action.type) {
    case `CREATE_JOB`:
    case `SET_JOB`:
      if (!action.payload.id) {
        throw new Error(`An ID must be provided when creating or setting job`);
      }
      const index = _.findIndex(state.active, j => j.id === action.payload.id);
      const mergedJob = _.merge(state.active[index], (0, _extends3.default)({}, action.payload, {
        createdAt: Date.now(),
        plugin: action.plugin
      }));
      if (index !== -1) {
        return {
          done: state.done,
          active: [...state.active.slice(0, index).concat([mergedJob]).concat(state.active.slice(index + 1))]
        };
      } else {
        return {
          done: state.done,
          active: state.active.concat([(0, _extends3.default)({}, action.payload, {
            createdAt: Date.now(),
            plugin: action.plugin
          })])
        };
      }

    case `END_JOB`:
      if (!action.payload.id) {
        throw new Error(`An ID must be provided when ending a job`);
      }
      const completedAt = Date.now();
      const job = state.active.find(j => j.id === action.payload.id);
      if (!job) {
        throw new Error(`The plugin "${action.plugin.name}" tried to end a job with the id "${action.payload.id}" that either hasn't yet been created or has already been ended`);
      }

      return {
        done: state.done.concat([(0, _extends3.default)({}, job, {
          completedAt,
          runTime: moment(completedAt).diff(moment(job.createdAt))
        })]),
        active: state.active.filter(j => j.id !== action.payload.id)
      };
  }

  return state;
};
//# sourceMappingURL=jobs.js.map