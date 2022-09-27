# cypress-slack-notify ![cypress version](https://img.shields.io/badge/cypress-10.8.0-brightgreen)

> Post messages in Slack channels when specific Cypress tests and specs fail

![Notify Slack messages](./images/notify.png)

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
