#!/usr/bin/env node

// @ts-check

const debug = require('debug')('cypress-slack-notify')
const arg = require('arg')
const { findSlackUsers } = require('../src/users')

const args = arg({
  '--find-user': String,
})
debug('args %o', args)

if (args['--find-user']) {
  console.log('finding user "%s"', args['--find-user'])
  findSlackUsers(args['--find-user']).then((id) => {
    if (id) {
      console.log('found Slack user ID:', id)
    } else {
      console.error('could not find Slack user', args['--find-user'])
    }
  })
}
