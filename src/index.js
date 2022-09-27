const { WebClient } = require('@slack/web-api')

function findChannelToNotify(
  notificationConfiguration,
  failedSpecRelativeFilename,
) {
  const spec = Object.keys(notificationConfiguration).find((ch) => {
    return failedSpecRelativeFilename.endsWith(ch)
  })
  if (!spec) {
    return
  }
  return notificationConfiguration[spec]
}

// s could be something like "#channel @user1 @user2"
function getChannelAndPeople(s) {
  const parts = s.split(' ')
  const channel = parts.find((s) => s.startsWith('#'))
  const people = parts.filter((s) => s.startsWith('@'))
  return { channel, people }
}

const getTestPluralForm = (n) => (n === 1 ? 'test' : 'tests')

// looking up user ids from user aliases
let usersStore

/**
 * Posts a Slack message to the specific channels if notification
 * for the failed spec tests is configured.
 * @param { import("./types").NotificationConfiguration } notificationConfiguration
 * @param {number} failedN Number of failed tests
 */
async function postCypressSlackResult(
  notificationConfiguration,
  spec,
  failedN,
  runInfo,
) {
  if (!process.env.SLACK_TOKEN) {
    return
  }

  // Read a token from the environment variables
  // To get a token, read https://slack.dev/node-slack-sdk/getting-started
  // added a "bot token scope" "chat:write", "users:read"
  const token = process.env.SLACK_TOKEN

  // Initialize
  const web = new WebClient(token)

  // note: you need to invite the app to each channel
  // before it can post messages to that channel
  const notify = findChannelToNotify(notificationConfiguration, spec.relative)
  const { channel, people } = getChannelAndPeople(notify)
  if (channel) {
    console.error('need to notify channel "%s"', channel)
    let text = `🚨 ${failedN} Cypress ${getTestPluralForm(
      failedN,
    )} failed in spec *${spec.relative}*`
    if (runInfo.runDashboardUrl) {
      // since we deal with the failed specs
      // point the users to the failures right away
      const overviewFailedUrl =
        runInfo.runDashboardUrl + '/overview?reviewViewBy=FAILED'
      text += `\nCypress Dashboard URL: ${overviewFailedUrl}`
    }
    if (runInfo.runDashboardTag) {
      text += `\nRun tags: ${runInfo.runDashboardTag
        .map((s) => '*' + s + '*')
        .join(', ')}`
    }
    if (people && people.length) {
      if (!usersStore) {
        usersStore = {}
        try {
          const userResult = await web.users.list()
          userResult.members.forEach((u) => {
            // console.log(u)
            usersStore[u.name] = u.id
          })
        } catch (e) {
          console.error('Could not fetch the users list')
          console.error(
            'Perhaps the app does not have "users:read" scope permission',
          )
        }
      }
      // https://api.slack.com/reference/surfaces/formatting#mentioning-users
      const userIds = people
        .map((username) => {
          // Slack keeps internal names without '@' symbol
          if (username.startsWith('@')) {
            username = username.substr(1)
          }
          const userId = usersStore[username]
          if (!userId) {
            console.error('Cannot find Slack user id for user "%s"', username)
          }
          return userId
        })
        .filter(Boolean)
        .map((id) => `<@${id}>`)
      if (userIds.length) {
        text += `\nPlease investigate the failures ${userIds.join(', ')}`
      }
    }

    const result = await web.chat.postMessage({
      text,
      channel,
    })
    if (result.ok) {
      console.log('posted message to channel "%s"', channel)
    } else {
      console.error('could not post the test results to "%s"', channel)
      console.error(result)
    }
  } else {
    console.error('no need to notify')
  }
}

/**
 * Registers the cypres-slack-notify plugin. The plugin will send Slack messages
 * for each failed spec file based on the notification configuration object.
 * @param {Cypress.PluginEvents} on Pass the "on" argument to let the plugin listen to Cypress events
 * @param { import("./types").NotificationConfiguration } notificationConfiguration
 */
function registerCypressSlackNotify(on, notificationConfiguration) {
  let runDashboardTag
  let runDashboardUrl

  on('before:run', (runDetails) => {
    runDashboardUrl = runDetails.runUrl
    runDashboardTag = runDetails.tag
  })

  on('after:spec', async (spec, results) => {
    try {
      // error - unexpected crash, the tests could not run
      if (results.error || results.stats.failures) {
        console.error('Test failures in %s', spec.relative)
        // TODO handle both an unexpected error
        // and the specific number of failed tests
        await postCypressSlackResult(
          notificationConfiguration,
          spec,
          results.stats.failures,
          {
            runDashboardUrl,
            runDashboardTag,
          },
        )
        console.log('after postCypressSlackResult')
      }
    } catch (e) {
      console.error('problem after spec')
      console.error(e)
    }
  })
}

module.exports = { registerCypressSlackNotify, postCypressSlackResult }
