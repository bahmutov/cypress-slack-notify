// @ts-check
const { defineConfig } = require('cypress')

const registerSlackNotify = require('./src')

module.exports = defineConfig({
  projectId: 'avzi1n',
  video: false,
  e2e: {
    // baseUrl, etc
    supportFile: false,
    fixturesFolder: false,
    setupNodeEvents(on, config) {
      // any recorded run tagged "effective" should post a message
      // based on the effective test tag
      registerSlackNotify(
        on,
        {
          testTags: {
            '@auth': '#cypress-slack-notify-effective-tags @gleb.bahmutov',
          },
        },
        {
          whenRecordingDashboardTag: ['effective'],
        },
        {
          writeJson: true,
        },
      )
    },
  },
})
