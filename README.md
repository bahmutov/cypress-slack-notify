# cypress-slack-notify ![cypress version](https://img.shields.io/badge/cypress-10.8.0-brightgreen) [![cypress-slack-notify](https://img.shields.io/endpoint?url=https://dashboard.cypress.io/badge/simple/avzi1n/main&style=flat&logo=cypress)](https://dashboard.cypress.io/projects/avzi1n/runs) [![ci](https://github.com/bahmutov/cypress-slack-notify/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/bahmutov/cypress-slack-notify/actions/workflows/ci.yml)

> Post messages in Slack channels when specific Cypress tests and specs fail

![Notify Slack messages](./images/notify.png)

To use this plugin, you will need to get yourself a `SLACK_TOKEN` by making a new Slack App. This app needs a bot token with the scope `"chat:write"` to post messages. If you want to tag specific users, you will need to give the app `"users:read"` too. For details, see [Slack API docs](https://api.slack.com/methods/chat.postMessage). You will need to invite the registered and installed Slack App to each channel you would like to post messages by this plugin.

## Install

Add this plugin as a dev dependency

```shell
$ npm i -D cypress-slack-notify
# or add using Yarn
$ yarn add -D cypress-slack-notify
```

Register this plugin from your `cypress.config.js` file (or from your plugins file is using Cypress v9)

```js
// cypress.config.js
const { defineConfig } = require('cypress')

// describe the notification of each failed spec
// you want to notify about
const notificationConfiguration = {
  // if this spec fails, post a message to the channel "e2e-tests"
  'spec-a.cy.js': '#e2e-tests',
  // if this spec fails, post a message and notify Gleb
  'spec-b.cy.js': '#e2e-tests @gleb',
  // if this spec fails, notify several users
  'spec-c.cy.js': '#e2e-tests @gleb @john @mary',
}

// describe when to notify. We probably want to notify
// only when running on CI and recording the test runs
// and using certain run tags
const notifyWhen = {
  whenRecordingOnDashboard: true,
  whenRecordingDashboardTag: ['notify'],
}

module.exports = defineConfig({
  projectId: '...',
  e2e: {
    setupNodeEvents(on, config) {
      // https://github.com/bahmutov/cypress-slack-notify
      require('cypress-slack-notify')(on, notificationConfiguration, notifyWhen)
    },
  },
})
```

## whenISaySo

You can provide your own synchronous predicate function to decide if this plugin should send Slack notifications on failed specs.

```js
const notifyWhen = {
  whenISaySo({ runDashboardUrl, runDashboardTags }) {
    // look at the provided arguments, or any logic like process.env.CI
    // etc to determine if you want to send Slack notifications
    return true | false
  },
}

// https://github.com/bahmutov/cypress-slack-notify
require('cypress-slack-notify')(on, notificationConfiguration, notifyWhen)
```

## Minimatch

You can list spec files by the filename / end of the filepath. You can also rely on [minimatch](https://github.com/isaacs/minimatch) to find the target Slack channel.

```js
const notificationConfiguration = {
  // equivalents
  'spec-a.cy.js': '#one',
  'e2e/spec-a.cy.js': '#one',
  'cypress/e2e/spec-a.cy.js': '#one',
  // use minimatch with spec paths
  // https://github.com/isaacs/minimatch
  // In this case, any failed specs directly in the "sub" folder
  // will post notification to '#cypress-slack-notify-minimatch'
  // https://github.com/isaacs/minimatch
  '**/sub/*.cy.js': '#two',
}
```

In the above situation, any failed test in the spec like `cypress/e2e/sub/home.cy.js` will be posted to `#two`.

## Debugging

Enable verbose log messages by setting an environment variable `DEBUG=cypress-slack-notify`

## Examples

See [bahmutov/cypress-slack-example](https://github.com/bahmutov/cypress-slack-example)

## Small print

Author: Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt; &copy; 2022

- [@bahmutov](https://twitter.com/bahmutov)
- [glebbahmutov.com](https://glebbahmutov.com)
- [blog](https://glebbahmutov.com/blog)
- [videos](https://www.youtube.com/glebbahmutov)
- [presentations](https://slides.com/bahmutov)
- [cypress.tips](https://cypress.tips)
- [Cypress Tips & Tricks Newsletter](https://cypresstips.substack.com/)
- [my Cypress courses](https://cypress.tips/courses)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/cypress-slack-notify/issues) on Github
