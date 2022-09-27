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
 */
export type NotificationConfiguration = {
  [string]: SlackNotificationTarget
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
  whenRecordedOnDashboard: boolean
}
