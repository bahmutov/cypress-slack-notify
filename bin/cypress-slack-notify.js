#!/usr/bin/env node

// @ts-check

const debug = require('debug')('cypress-slack-notify')
const arg = require('arg')
const { findSlackUsers, findSlackUser } = require('../src/users')

const args = arg({
  // pass one or multiple usernames
  '--find-user': String,
  // fetches information about a single user by its Slack ID
  '--find-user-by-slack-id': String,
  // posts a test message to the given channel
  '--test-channel': String,
})
debug('args %o', args)

if (args['--find-user']) {
  const usernames = args['--find-user'].split(',')
  if (Array.isArray(usernames) && usernames.length) {
    console.log('finding %d user(s) %s', usernames.length, usernames.join(', '))
    findSlackUsers(usernames)
  }
} else if (args['--find-user-by-slack-id']) {
  findSlackUser(args['--find-user-by-slack-id'])
} else if (args['--test-channel']) {
  console.log(
    'posting a test message to the channel "%s"',
    args['--test-channel'],
  )
} else {
  console.error('hmm, not sure what to do, exiting...')
}
