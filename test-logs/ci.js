const { expect } = require('chai')
const { readFileSync } = require('fs')
const spok = require('spok').default
const t = spok.adapters.chaiExpect(expect)

const logFilename = 'cypress-slack-notified.json'
const ciJsonLog = readFileSync(logFilename, 'utf-8')
const jsonLog = JSON.parse(ciJsonLog)

const expectedLog = [
  {
    channel: '#cypress-slack-notify',
    people: ['@gleb.bahmutov'],
    sent: true,
  },
  {
    channel: '#cypress-slack-notify',
    people: [],
    sent: true,
  },
  {
    channel: '#cypress-slack-notify-minimatch',
    people: [],
    sent: true,
  },
]
// expect(jsonLog.length, 'number of records').to.equal(expectedLog.length)

// jsonLog.forEach((record, k) => {
//   spok(t, record, expectedLog[k])
// })

jsonLog.forEach((record, k) => {
  expect(record).to.have.property('runDashboardUrl')
  delete record.runDashboardUrl
})

expect(jsonLog).to.deep.equal(expectedLog)
