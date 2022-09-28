/// <reference types="cypress" />
const { getChannelAndPeople } = require('../../../src/utils')

it('parses channel name with usernames', () => {
  const { channel, people } = getChannelAndPeople(
    '#channel-name @user1 @user2 @user3',
  )
  expect(channel, 'channel').to.equal('#channel-name')
  expect(people, 'people').to.deep.equal(['@user1', '@user2', '@user3'])
})

it('parses channel name with usernames with spaces', () => {
  const { channel, people } = getChannelAndPeople(
    '#channel-name-1 @john doe @mary ann',
  )
  expect(channel, 'channel').to.equal('#channel-name-1')
  expect(people, 'people').to.deep.equal(['@john doe', '@mary ann'])
})

it('ignores multiple spaces', () => {
  const { channel, people } = getChannelAndPeople(
    '  #channel-name-1     @john doe    @mary ann  ',
  )
  expect(channel, 'channel').to.equal('#channel-name-1')
  expect(people, 'people').to.deep.equal(['@john doe', '@mary ann'])
})

it('does not care about casing', () => {
  const { channel, people } = getChannelAndPeople('  #channel-NAME-1     @Mary')
  expect(channel, 'channel').to.equal('#channel-NAME-1')
  expect(people, 'people').to.deep.equal(['@Mary'])
})
