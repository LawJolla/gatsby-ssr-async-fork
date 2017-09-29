#!/usr/bin/env node
"use strict";

var path = require("path");
var fs = require("fs");
var _ = require("lodash");

var report = require("./reporter");

var version = process.version;
var verDigit = Number(version.match(/\d+/)[0]);

if (verDigit < 4) {
  report.panic("Gatsby 1.0+ requires node.js v4 or higher (you have " + version + "). \n" + "Upgrade node to the latest stable release.");
}

/*
  Get the locally installed version of gatsby/lib/bin/cli.js from the place
  where this program was executed.
*/
var cliFile = "dist/bin/cli.js";
var localPath = path.resolve("node_modules/gatsby", cliFile);

var useGlobalGatsby = function useGlobalGatsby() {
  // Never use global install *except* for new and help commands
  if (!_.includes(["new", "--help"], process.argv[2])) {
    report.panic("A local install of Gatsby was not found. \n" + "You should save Gatsby as a site dependency e.g. npm install --save gatsby");
  }

  require("./bin/cli");
};

if (fs.existsSync(localPath)) {
  try {
    require(localPath);
  } catch (error) {
    report.error("A local install of Gatsby exists but failed to load.", error);
  }
} else {
  useGlobalGatsby();
}
