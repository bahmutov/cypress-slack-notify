// @ts-check

const debug = require('debug')('cypress-slack-notify')
const { WebClient } = require('@slack/web-api')

async function fetchSlackUsers() {
  if (!process.env.SLACK_TOKEN) {
    debug('no SLACK_TOKEN')
    return
  }

  // Read a token from the environment variables
  // To get a token, read https://slack.dev/node-slack-sdk/getting-started
  // added a "bot token scope" "chat:write", "users:read"
  const token = process.env.SLACK_TOKEN

  // Initialize
  const web = new WebClient(token)

  const usersStore = {}
  try {
    // we iterate through the users list page by page
    // returned by the Slack API
    let cursor
    while (true) {
      // https://api.slack.com/methods/users.list
      const userResult = await web.users.list({ cursor })
      if (userResult.members) {
        debug('user list has %d members', userResult.members.length)
        userResult.members.forEach((u) => {
          if (u.name) {
            usersStore[u.name] = u.id
          }
          if (u.profile && u.profile.display_name) {
            usersStore[u.profile.display_name] = u.id
          }
        })
        // see if there is a next page with users
        if (
          userResult.response_metadata &&
          userResult.response_metadata.next_cursor
        ) {
          cursor = userResult.response_metadata.next_cursor
        } else {
          // otherwise stop fetching users, we are done
          break
        }
      } else {
        console.error('Slack user list has no members')
      }
    }
    debug(
      'finished fetching all Slack users, got %d usernames',
      Object.keys(usersStore).length,
    )
  } catch (e) {
    console.error('Could not fetch the users list')
    console.error('Perhaps the app does not have "users:read" scope permission')
  }

  return usersStore
}

async function findSlackUsers(username) {
  if (!username) {
    throw new Error('Missing Slack username')
  }

  const users = await fetchSlackUsers()
  if (!users) {
    debug('not users fetched')
    return
  }

  // the username should not include "@"
  if (username.startsWith('@')) {
    username = username.slice(1)
  }

  const id = users[username]
  debug('Slack user "%s" id %s', username, id)
  return id
}

module.exports = { fetchSlackUsers, findSlackUsers }
