/// <reference types="cypress" />
const { findChannelToNotify } = require('../../../src/utils')

/** @type { import("../../../src/types").NotificationConfiguration } */
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

it('finds the right channel by the filename end', () => {
  const channel = findChannelToNotify(
    notificationConfiguration,
    'cypress/e2e/spec-b.cy.js',
  )
  expect(channel).to.equal('#cypress-slack-notify @gleb.bahmutov')
})

it('finds the right channel by minimatch', () => {
  const channel = findChannelToNotify(
    notificationConfiguration,
    'cypress/e2e/sub/spec.cy.js',
  )
  expect(channel).to.equal('#cypress-slack-notify-minimatch')
})
