const { defineConfig } = require('cypress')

/** @type { import("./src/types").NotificationConfiguration } */
const notificationConfiguration = {
  // if this spec fails, post a message to the channel
  'spec-a.js': '#cypress-slack-notify',
}

module.exports = defineConfig({
  e2e: {
    // baseUrl, etc
    supportFile: false,
    fixturesFolder: false,
    setupNodeEvents(on, config) {
      require('./src/index')(on, notificationConfiguration)
    },
  },
})
