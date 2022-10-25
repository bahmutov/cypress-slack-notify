const { expect } = require('chai')
const { readFileSync } = require('fs')

const logFilename = 'cypress-slack-notified.json'
const ciJsonLog = readFileSync(logFilename, 'utf-8')
const jsonLog = JSON.parse(ciJsonLog)

const expectedLog = [
  {
    channel: '#cypress-slack-notify-effective-tags',
    people: ['@gleb.bahmutov'],
    foundSlackUsers: ['@gleb.bahmutov'],
    sent: true,
    runDashboardTags: ['effective', 'sanity'],
  },
]

jsonLog.forEach((record, k) => {
  expect(record).to.have.property('runDashboardUrl')
  delete record.runDashboardUrl
})
console.log('✅ each record has dashboard url')

expect(jsonLog).to.deep.equal(expectedLog)
console.log('✅ entire log')
