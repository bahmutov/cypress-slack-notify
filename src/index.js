/// <reference types="cypress" />
// @ts-check

const debug = require('debug')('cypress-slack-notify')
const { WebClient } = require('@slack/web-api')
const {
  findChannelToNotify,
  getChannelAndPeople,
  shouldNotify,
} = require('./utils')
const { fetchSlackUsers } = require('./users')
const { writeFileSync } = require('fs')

const getTestPluralForm = (n) => (n === 1 ? 'test' : 'tests')

const JSON_LOG_FILENAME = './cypress-slack-notified.json'
let jsonLogRecords = []

function startJsonLog() {
  writeFileSync(JSON_LOG_FILENAME, '[]\n', 'utf8')
  jsonLogRecords = []
  debug('started json log file %s', JSON_LOG_FILENAME)
}

function addJsonLog(record) {
  jsonLogRecords.push(record)
  const text = JSON.stringify(jsonLogRecords, null, 2)
  writeFileSync(JSON_LOG_FILENAME, text + '\n', 'utf8')
  debug('added another record to json log %s', JSON_LOG_FILENAME)
}

// looking up user ids from user aliases
let usersStore

/**
 * Posts a Slack message to the specific channels if notification
 * for the failed spec tests is configured.
 * @param { import("./types").NotificationConfiguration } notificationConfiguration
 * @param {Cypress.Spec} spec The current spec file object
 * @param {string[]} failedTestTitles Test titles, each test a single string
 * @param {number} failedN Number of failed tests
 */
async function postCypressSlackResult(
  notificationConfiguration,
  spec,
  failedN,
  failedTestTitles,
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

    // format Slack message using a version of Markdown
    // https://api.slack.com/reference/surfaces/formatting

    let text = `🚨 ${failedN} Cypress ${getTestPluralForm(
      failedN,
    )} failed in spec *${spec.relative}*`

    failedTestTitles.forEach((failedTestTitle) => {
      text += `\n • ${failedTestTitle}`
    })

    if (runInfo.runDashboardUrl) {
      // since we deal with the failed specs
      // point the users to the failures right away
      const overviewFailedUrl =
        runInfo.runDashboardUrl + '/overview?reviewViewBy=FAILED'
      text += `\nCypress Dashboard URL: ${overviewFailedUrl}`
    }
    if (Array.isArray(runInfo.runDashboardTags) && runInfo.runDashboardTags) {
      debug('run info has dashboard tag %o', runInfo.runDashboardTags)
      const s = runInfo.runDashboardTags
        .map((tag) => '*' + tag + '*')
        .join(', ')
      text += `\nRun tags: ${s}`
    } else {
      debug('run info has no dashboard tags')
    }

    const foundSlackUsers = []

    if (people && people.length) {
      if (!usersStore) {
        // only try fetching the Slack users once
        usersStore = await fetchSlackUsers()
        if (!usersStore) {
          debug('could not fetch Slack users')
          usersStore = {}
        }
      }
      // https://api.slack.com/reference/surfaces/formatting#mentioning-users
      const userIds = people
        .map((uname) => {
          // Slack keeps internal names without '@' symbol
          const username = uname.startsWith('@') ? uname.slice(1) : uname
          const userId = usersStore[username]
          if (!userId) {
            console.error('Cannot find Slack user id for user "%s"', username)
          } else {
            foundSlackUsers.push(uname)
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
    debug(text)

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
      if (foundSlackUsers.length) {
        console.log('notifying %s', foundSlackUsers.join(', '))
      }
      return { channel, people, foundSlackUsers, sent: true, ...runInfo }
    } else {
      console.error('could not post the test results to "%s"', channel)
      console.error(result)
      return { channel, people, foundSlackUsers, sent: false, ...runInfo }
    }
  } else {
    console.error('no need to notify')
  }
}

/** @type { import("./types").NotifyConditions } */
const defaultNotifyConditions = {
  whenRecordingOnDashboard: true,
}

const allNotificationConfigurations = []

/**
 * Check if potentially we might notify about a spec failure for this test run.
 */
function mayNotify(recording) {
  return allNotificationConfigurations.some((c) => {
    const { notifyConditions } = c
    const notify = shouldNotify(notifyConditions, recording)
    return notify
  })
}

/**
 * Registers the cypres-slack-notify plugin. The plugin will send Slack messages
 * for each failed spec file based on the notification configuration object.
 * @param {Cypress.PluginEvents} on Pass the "on" argument to let the plugin listen to Cypress events
 * @param { import("./types").NotificationConfiguration } notificationConfiguration
 * @param { import("./types").NotifyConditions } notifyConditions
 * @param { import("./types").NotifyPluginOptions } options
 */
function registerCypressSlackNotify(
  on,
  notificationConfiguration,
  notifyConditions,
  options = {},
) {
  if (!notificationConfiguration) {
    throw new Error('Missing cypress-slack-notify notification configuration')
  }

  if (!notifyConditions) {
    // default notification conditions
    notifyConditions = { ...defaultNotifyConditions }
    debug('using default notify conditions %o', notifyConditions)
  }
  const mergedNotifyConditions = {
    ...defaultNotifyConditions,
    ...notifyConditions,
  }
  debug('merged notify conditions %o', mergedNotifyConditions)
  notifyConditions = mergedNotifyConditions

  // support multiple registrations by storing each condition
  allNotificationConfigurations.push({
    notificationConfiguration,
    notifyConditions,
  })

  if (options.writeJson) {
    startJsonLog()
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

    const notify = mayNotify({ runDashboardUrl, runDashboardTags })
    if (notify) {
      console.log(
        'cypress-slack-notify: if a spec fails, will post a Slack message',
      )
    } else {
      debug('no need to notify about the failure')
    }
  })

  on('after:spec', async (spec, results) => {
    try {
      // error - unexpected crash, the tests could not run
      if (results.error || results.stats.failures) {
        debug('Test failures in %s', spec.relative)
        // TODO handle both an unexpected error
        // and the specific number of failed tests

        const failedTestTitles = results.tests
          .filter((t) => t.state === 'failed')
          .map((t) => t.title.join(' / '))
        debug('failed test titles')
        debug(failedTestTitles)

        // notify each Slack channel (there could be multiple registrations)
        for await (const c of allNotificationConfigurations) {
          const { notificationConfiguration, notifyConditions } = c

          const recording = {
            runDashboardUrl,
            runDashboardTags,
          }
          const notify = shouldNotify(notifyConditions, recording)
          if (notify) {
            debug('should notify about this failure')
            const sentRecord = await postCypressSlackResult(
              notificationConfiguration,
              spec,
              results.stats.failures,
              failedTestTitles,
              recording,
            )
            debug('after postCypressSlackResult')
            if (sentRecord) {
              addJsonLog(sentRecord)
            }
          } else {
            debug('should NOT notify about this failure')
          }
        }
      }
    } catch (e) {
      console.error('problem after spec')
      console.error(e)
    }
  })
}

module.exports = registerCypressSlackNotify
