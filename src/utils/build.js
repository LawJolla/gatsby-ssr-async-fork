/* @flow */

const buildCSS = require(`./build-css`)
const buildHTML = require(`./build-html`)
const buildProductionBundle = require(`./build-javascript`)
const bootstrap = require(`../bootstrap`)
const report = require(`../reporter`)
const apiRunnerNode = require(`./api-runner-node`)
const copyStaticDirectory = require(`./copy-static-directory`)

function reportFailure(msg, err: Error) {
  report.log(``)
  report.panic(msg, err)
}

async function html(program: any) {
  const { graphqlRunner } = await bootstrap(program)
  // Copy files from the static directory to
  // an equivalent static directory within public.
  copyStaticDirectory()

  let activity = report.activityTimer(`Building CSS`)
  activity.start()
  await buildCSS(program).catch(err => {
    reportFailure(`Generating CSS failed`, err)
  })
  activity.end()

  activity = report.activityTimer(`Building production JavaScript bundles`)
  activity.start()
  await buildProductionBundle(program).catch(err => {
    reportFailure(`Generating JavaScript bundles failed`, err)
  })
  activity.end()

  activity = report.activityTimer(`Building static HTML for pages`)
  activity.start()
  await buildHTML(program).catch(err => {
    reportFailure(
      report.stripIndent`
        Building static HTML for pages failed

        See our docs page on debugging HTML builds for help https://goo.gl/yL9lND
      `,
      err
    )
  })
  activity.end()

  await apiRunnerNode(`onPostBuild`, { graphql: graphqlRunner })
}

module.exports = html
