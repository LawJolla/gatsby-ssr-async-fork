"use strict";

exports.__esModule = true;
exports.joinPath = joinPath;
exports.withBasePath = withBasePath;
var path = require(`path`);
var os = require(`os`);

function joinPath() {
  var joinedPath = path.join.apply(path, arguments);
  if (os.platform() === `win32`) {
    return joinedPath.replace(/\\/g, `\\\\`);
  } else {
    return joinedPath;
  }
}

function withBasePath(basePath) {
  return function (paths) {
    return joinPath(basePath, paths);
  };
}
//# sourceMappingURL=path.js.map