/// <reference types="cypress" />
// @ts-check

const debug = require('debug')('cypress-slack-notify')
const { WebClient } = require('@slack/web-api')

function findChannelToNotify(
  notificationConfiguration,
  failedSpecRelativeFilename,
) {
  const spec = Object.keys(notificationConfiguration).find((ch) => {
    return failedSpecRelativeFilename.endsWith(ch)
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

const getTestPluralForm = (n) => (n === 1 ? 'test' : 'tests')

// looking up user ids from user aliases
let usersStore

/**
 * Posts a Slack message to the specific channels if notification
 * for the failed spec tests is configured.
 * @param { import("./types").NotificationConfiguration } notificationConfiguration
 * @param {Cypress.Spec} spec The current spec file object
 * @param {number} failedN Number of failed tests
 */
async function postCypressSlackResult(
  notificationConfiguration,
  spec,
  failedN,
  runInfo,
) {
  if (!process.env.SLACK_TOKEN) {
    debug('no SLACK_TOKEN')
    return
  }

  if (!failedN) {
    debug('no tests failed in spec %s', spec.relative)
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
  if (!notify) {
    debug('no notify for failed spec %s', spec.relative)
    return
  }

  const { channel, people } = getChannelAndPeople(notify)
  if (channel) {
    console.error('cypress-slack-notify: need to notify channel "%s"', channel)
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
          if (userResult.members) {
            userResult.members.forEach((u) => {
              if (u.name) {
                usersStore[u.name] = u.id
              }
            })
          }
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

    debug('posting Slack message to %s for spec %s', channel, spec.relative)
    const result = await web.chat.postMessage({
      text,
      channel,
    })
    if (result.ok) {
      console.log(
        'cypress-slack-notify posted spec %s message to channel "%s"',
        spec.relative,
        channel,
      )
    } else {
      console.error('could not post the test results to "%s"', channel)
      console.error(result)
    }
  } else {
    console.error('no need to notify')
  }
}

/** @type { import("./types").NotifyConditions } */
const defaultNotifyConditions = {
  whenRecordedOnDashboard: true,
}

/**
 * Registers the cypres-slack-notify plugin. The plugin will send Slack messages
 * for each failed spec file based on the notification configuration object.
 * @param {Cypress.PluginEvents} on Pass the "on" argument to let the plugin listen to Cypress events
 * @param { import("./types").NotificationConfiguration } notificationConfiguration
 * @param { import("./types").NotifyConditions } notifyConditions
 */
function registerCypressSlackNotify(
  on,
  notificationConfiguration,
  notifyConditions,
) {
  if (!notificationConfiguration) {
    throw new Error('Missing cypress-slack-notify notification configuration')
  }

  if (!notifyConditions) {
    // default notification conditions
    notifyConditions = defaultNotifyConditions
    debug('using default notify conditions %o', notifyConditions)
  }

  // remember the Cypress dashboard run URL and tags if any
  let runDashboardTags
  let runDashboardUrl
  let recordingOnDashboard = false

  on('before:run', (runDetails) => {
    runDashboardUrl = runDetails.runUrl
    runDashboardTags = runDetails.tag
    recordingOnDashboard = Boolean(runDashboardUrl)
    debug('before run %o', {
      recordingOnDashboard,
      runDashboardUrl,
      runDashboardTags,
    })
  })

  on('after:spec', async (spec, results) => {
    try {
      // error - unexpected crash, the tests could not run
      if (results.error || results.stats.failures) {
        debug('Test failures in %s', spec.relative)
        // TODO handle both an unexpected error
        // and the specific number of failed tests

        if (typeof notifyConditions.whenRecordedOnDashboard === 'boolean') {
          debug(
            'notifyConditions.whenRecordedOnDashboard',
            notifyConditions.whenRecordedOnDashboard,
          )

          if (notifyConditions.whenRecordedOnDashboard === true) {
            if (!recordingOnDashboard) {
              debug(
                'not recording on Cypress Dashboard, skip Slack notifications',
              )
              return
            }

            if (
              typeof notifyConditions.whenRecordingDashboardTag === 'string'
            ) {
              notifyConditions.whenRecordingDashboardTag = [
                notifyConditions.whenRecordingDashboardTag,
              ]
            }

            if (
              Array.isArray(notifyConditions.whenRecordingDashboardTag) &&
              notifyConditions.whenRecordingDashboardTag.length
            ) {
              if (!runDashboardTags || !runDashboardTags.length) {
                debug(
                  'run does not have any tags, need %o to report',
                  notifyConditions.whenRecordingDashboardTag,
                )
                return
              }

              debug('recorded run tags %o', runDashboardTags)
              const hasMatchingTag =
                notifyConditions.whenRecordingDashboardTag.some((tag) =>
                  runDashboardTags.includes(tag),
                )
              if (!hasMatchingTag) {
                debug(
                  'user does not need to Slack notify about tags %o, only %o',
                  runDashboardTags,
                  notifyConditions.whenRecordingDashboardTag,
                )
                return
              }
            }
          }

          if (
            notifyConditions.whenRecordedOnDashboard === false &&
            recordingOnDashboard
          ) {
            debug(
              'recording on Cypress Dashboard, but the user wants to skip Slack notifications',
            )
            return
          }
        }

        await postCypressSlackResult(
          notificationConfiguration,
          spec,
          results.stats.failures,
          {
            runDashboardUrl,
            runDashboardTags,
          },
        )
        debug('after postCypressSlackResult')
      }
    } catch (e) {
      console.error('problem after spec')
      console.error(e)
    }
  })
}

// module.exports = { registerCypressSlackNotify, postCypressSlackResult }
module.exports = registerCypressSlackNotify
