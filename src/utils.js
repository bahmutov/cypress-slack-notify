// @ts-check

const debug = require('debug')('cypress-slack-notify')
const minimatch = require('minimatch')

function findChannelToNotify(
  notificationConfiguration,
  failedSpecRelativeFilename,
) {
  const spec = Object.keys(notificationConfiguration).find((ch) => {
    return (
      failedSpecRelativeFilename.endsWith(ch) ||
      minimatch(failedSpecRelativeFilename, ch)
    )
  })
  if (!spec) {
    debug('no notification for spec %s', failedSpecRelativeFilename)
    return
  }
  return notificationConfiguration[spec]
}

// s could be something like "#channel @user1 @user2"
function getChannelAndPeople(s) {
  if (typeof s !== 'string') {
    throw new Error(`expected a string, got "${s}"`)
  }
  const parts = s.split(' ')
  const channel = parts.find((s) => s.startsWith('#'))
  const people = parts.filter((s) => s.startsWith('@'))
  return { channel, people }
}

module.exports = { findChannelToNotify, getChannelAndPeople }
