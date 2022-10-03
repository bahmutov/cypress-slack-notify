#!/usr/bin/env node

// @ts-check

const debug = require('debug')('cypress-slack-notify')
const arg = require('arg')
const { findSlackUsers } = require('../src/users')

const args = arg({
  // pass one or multiple usernames
  '--find-user': String,
})
debug('args %o', args)

if (args['--find-user']) {
  const usernames = args['--find-user'].split(',')
  if (Array.isArray(usernames) && usernames.length) {
    console.log('finding %d user(s) %s', usernames.length, usernames.join(', '))
    findSlackUsers(usernames)
  }
}
