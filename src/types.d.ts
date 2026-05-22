/**
 * Channel name or channel name plus usernames, separated by space
 * @example `#test-results`
 * @example `#test-results @user1 @user2`
 */
type SlackNotificationTarget = string

/**
 * Configuration for when to notify Slack users based on test failures.
 * @example
 *  // post a message in "#test-results" channel
 *  // if a test inside "auth.cy.js" spec fails
 *  { 'auth.cy.js': '#test-results' }
 * Shortcut: use a single notification channel to notify
 * on every failing spec
 * @example '#test-results'
 */
export type NotificationConfiguration =
  | {
      [testTag: string]: SlackNotificationTarget
    }
  | SlackNotificationTarget
  | {
      testTags: {
        // effective test tag: channel target
        [testTag: string]: SlackNotificationTarget
      }
    }

export type RunInfo = {
  runDashboardUrl?: string
  runDashboardTags?: string[]
}

export type NotifyPluginOptions = {
  /**
   * The plugin will save a JSON file with all notifications sent
   */
  writeJson?: boolean,
  /**
   * Add a custom message to the created slack message
   */
  customMessage?: string
}

/**
 * Describes when the plugin should send the Slack notifications.
 * For example, the user might want to only notify when there is a Dashboard run,
 * or a specific dashboard tag(s).
 */
export type NotifyConditions = {
  /**
   * Only send Slack notifications if the run is being recorded
   * on Cypress Dashboard. True by default.
   */
  whenRecordingOnDashboard?: boolean
  /**
   * If recording on Cypress Dashboard, send notifications only if the recording
   * has this tag(s)
   */
  whenRecordingDashboardTag?: string | string[]
  /**
   * A predicate you can use to implement custom logic to decide
   * if the current Cypress run should send Slack notifications for failed specs.
   */
  whenISaySo?: (runInfo: RunInfo) => boolean
}
