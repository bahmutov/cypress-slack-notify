const { defineConfig } = require('cypress')

/** @type { import("./src/types").NotificationConfiguration } */
const notificationConfiguration = {
  // if this spec fails, post a message to the channel
  'spec-a.cy.js': '#cypress-slack-notify',
  // if this spec fails, post a message and notify Gleb
  'spec-b.cy.js': '#cypress-slack-notify @gleb.bahmutov',
}

module.exports = defineConfig({
  projectId: 'avzi1n',
  video: false,
  e2e: {
    // baseUrl, etc
    supportFile: false,
    fixturesFolder: false,
    setupNodeEvents(on, config) {
      require('./src/index')(on, notificationConfiguration)
    },
  },
})
