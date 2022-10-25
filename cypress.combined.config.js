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
      // notify based on effective test tags
      // AND separate test recordings
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

      // any recorded run tagged "sanity" should notify #cypress-slack-notify-multiple-sanity channel
      registerSlackNotify(
        on,
        '#cypress-slack-notify-multiple-sanity @gleb.bahmutov',
        {
          whenRecordingDashboardTag: ['sanity'],
        },
        {
          writeJson: true,
        },
      )

      // any recorded run tagged "user" should notify #cypress-slack-notify-multiple-user channel
      registerSlackNotify(
        on,
        '#cypress-slack-notify-multiple-user',
        {
          whenRecordingDashboardTag: ['user'],
        },
        {
          writeJson: true,
        },
      )
    },
  },
})
