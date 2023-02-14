// @ts-check
const debug = require('debug')('cypress-slack-notify')
const { WebClient } = require('@slack/web-api')

/**
 * Sends the message to the channel.
 * @param {string} channel Name of the channel, like "#messages"
 * @param {string} text The full text of the message
 */
async function postSlackMessage(channel, text) {
  if (!process.env.SLACK_TOKEN) {
    debug('no SLACK_TOKEN')
    return {
      ok: false,
      error: new Error('Missing SLACK_TOKEN'),
    }
  }
  const web = new WebClient(process.env.SLACK_TOKEN)
  const result = await web.chat.postMessage({
    text,
    channel,
  })
  debug('post message to %s result %b', channel, result.ok)

  return result
}

module.exports = { postSlackMessage }
