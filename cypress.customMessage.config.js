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
            // any recorded run tagged "custom" should notify #cypress-slack-notify channel
            registerSlackNotify(
                on,
                '#cypress-slack-notify',
                {
                    whenRecordingDashboardTag: ['custom'],
                },
                {
                    writeJson: true,
                    customMessage: 'Added a custom message for test purposes'
                },
            )
        },
    },
})
