// @ts-check
const { defineConfig } = require('cypress')

/** @type { import("./src/types").NotificationConfiguration } */
const notificationConfiguration = {
  // if this spec fails, post a message to the channel
  'spec-a.cy.js': '#cypress-slack-notify',
  // if this spec fails, post a message and notify Gleb
  'spec-b.cy.js': '#cypress-slack-notify @gleb.bahmutov',
  // if this spec fails, just post a message
  'spec-c.cy.js': '#cypress-slack-notify',
  // use minimatch with spec paths
  // https://github.com/isaacs/minimatch
  // In this case, any failed specs directly in the "sub" folder
  // will post notification to '#cypress-slack-notify-minimatch'
  // https://github.com/isaacs/minimatch
  '**/sub/*.cy.js': '#cypress-slack-notify-minimatch',
}

/** @type { import("./src/types").NotifyConditions } */
const notifyWhen = {
  whenRecordingOnDashboard: true,
  whenRecordingDashboardTag: ['notify'],
}

const registerCypressSlackNotify = require('.')

module.exports = defineConfig({
  projectId: 'avzi1n',
  video: false,
  e2e: {
    // baseUrl, etc
    supportFile: false,
    fixturesFolder: false,
    setupNodeEvents(on, config) {
      registerCypressSlackNotify(on, notificationConfiguration, notifyWhen)
    },
  },
})
