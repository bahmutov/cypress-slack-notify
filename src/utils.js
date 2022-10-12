// @ts-check

const debug = require('debug')('cypress-slack-notify')
const minimatch = require('minimatch')

/**
 * @param { import("./types").NotificationConfiguration } notificationConfiguration
 */
function findChannelToNotify(
  notificationConfiguration,
  failedSpecRelativeFilename,
) {
  if (typeof notificationConfiguration === 'string') {
    debug(
      'notification config is the single target "%s"',
      notificationConfiguration,
    )
    return notificationConfiguration
  }

  if (
    typeof notificationConfiguration === 'object' &&
    'testTags' in notificationConfiguration
  ) {
    debug(
      'finding notification by effective test tags %o',
      notificationConfiguration.testTags,
    )
    // TODO: implement
    return
  }

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
  const parts = s
    .split(/\s(?=@)/g)
    .map((s) => s.trim())
    .filter(Boolean)
  const channel = parts.find((s) => s.startsWith('#'))
  const people = parts.filter((s) => s.startsWith('@'))
  return { channel, people }
}

/**
 * Returns true if this plugin should post a message for the given
 * conditions and test run.
 * @param { import("./types").NotifyConditions } notifyConditions
 * @param { import("./types").RunInfo } recordingOptions
 */
function shouldNotify(notifyConditions, recordingOptions = {}) {
  const { runDashboardUrl, runDashboardTags } = recordingOptions
  const recordingOnDashboard = Boolean(runDashboardUrl)

  if (typeof notifyConditions.whenISaySo === 'function') {
    debug('using whenISaySo predicate function')
    if (
      !notifyConditions.whenISaySo({
        runDashboardUrl,
        runDashboardTags,
      })
    ) {
      debug('whenISaySo returned false, skip notifications')
      return false
    }
    return true
  }

  if (typeof notifyConditions.whenRecordingOnDashboard === 'boolean') {
    debug(
      'notifyConditions.whenRecordingOnDashboard',
      notifyConditions.whenRecordingOnDashboard,
    )

    if (notifyConditions.whenRecordingOnDashboard === true) {
      if (!recordingOnDashboard) {
        debug('not recording on Cypress Dashboard, skip Slack notifications')
        return false
      }

      if (typeof notifyConditions.whenRecordingDashboardTag === 'string') {
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
          return false
        }

        debug('recorded run tags %o', runDashboardTags)
        const hasMatchingTag = notifyConditions.whenRecordingDashboardTag.some(
          (tag) => runDashboardTags.includes(tag),
        )
        if (!hasMatchingTag) {
          debug(
            'user does not need to Slack notify about tags %o, only %o',
            runDashboardTags,
            notifyConditions.whenRecordingDashboardTag,
          )
          return false
        }
      }
    }

    if (
      notifyConditions.whenRecordingOnDashboard === false &&
      recordingOnDashboard
    ) {
      debug(
        'recording on Cypress Dashboard, but the user wants to skip Slack notifications',
      )
      return false
    }

    return true
  }
}

module.exports = { findChannelToNotify, getChannelAndPeople, shouldNotify }
