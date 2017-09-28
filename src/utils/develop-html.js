/* @flow */
const webpack = require(`webpack`)
const Promise = require(`bluebird`)
const fs = require(`fs`)
const webpackConfig = require(`./webpack.config`)
const { createErrorFromString } = require(`../reporter/errors`)
const debug = require(`debug`)(`gatsby:html`)

module.exports = async (program: any) => {
  const { directory } = program

  debug(`generating static HTML`)

  // Static site generation.
  const compilerConfig = await webpackConfig(
    program,
    directory,
    `develop-html`,
    null,
    [`/`]
  )

  return new Promise((resolve, reject) => {
    webpack(compilerConfig.resolve()).run((e, stats) => {
      if (e) {
        return reject(e)
      }
      const outputFile = `${directory}/public/render-page.js`
      if (stats.hasErrors()) {
        let webpackErrors = stats.toJson().errors
        return reject(
          createErrorFromString(webpackErrors[0], `${outputFile}.map`)
        )
      }

      // Remove the temp JS bundle file built for the static-site-generator-plugin
      try {
        fs.unlinkSync(outputFile)
      } catch (e) {
        // This function will fail on Windows with no further consequences.
      }

      return resolve(null, stats)
    })
  })
}
