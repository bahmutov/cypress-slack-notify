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
