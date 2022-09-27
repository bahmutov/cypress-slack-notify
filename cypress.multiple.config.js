// @ts-check
const { defineConfig } = require('cypress')

const registerSlackNotify = require('.')

module.exports = defineConfig({
  projectId: 'avzi1n',
  video: false,
  e2e: {
    // baseUrl, etc
    supportFile: false,
    fixturesFolder: false,
    setupNodeEvents(on, config) {
      // any recorded run tagged "sanity" should notify #cypress-slack-notify-multiple-sanity channel
      registerSlackNotify(on, '#cypress-slack-notify-multiple-sanity', {
        whenRecordingDashboardTag: ['sanity'],
      })

      // any recorded run tagged "user" should notify #cypress-slack-notify-multiple-user channel
      registerSlackNotify(on, '#cypress-slack-notify-multiple-user', {
        whenRecordingDashboardTag: ['user'],
      })
    },
  },
})
