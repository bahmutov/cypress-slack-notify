import { shouldNotify } from '../../../src/utils'

describe('shouldNotify', () => {
  it('returns false without recording', () => {
    const notifyConditions = {
      whenRecordingOnDashboard: false,
      whenRecordingDashboardTag: ['notify'],
    }
    const recording = {
      runDashboardUrl: 'some url',
      runDashboardTags: ['user', 'notify'],
    }
    expect(shouldNotify(notifyConditions, recording)).to.be.false
  })

  it('returns true for recorded run with a matching tag', () => {
    const notifyConditions = {
      whenRecordingOnDashboard: true,
      whenRecordingDashboardTag: ['notify'],
    }
    const recording = {
      runDashboardUrl: 'some url',
      runDashboardTags: ['user', 'notify'],
    }
    expect(shouldNotify(notifyConditions, recording)).to.be.true
  })

  it('returns false for recorded run without a matching tag', () => {
    const notifyConditions = {
      whenRecordingOnDashboard: true,
      whenRecordingDashboardTag: ['notify'],
    }
    const recording = {
      runDashboardUrl: 'some url',
      runDashboardTags: ['user', 'auth'],
    }
    expect(shouldNotify(notifyConditions, recording)).to.be.false
  })

  it('returns true when I say so', () => {
    const notifyConditions = {
      whenISaySo: cy.stub().returns(true).as('whenISaySo'),
    }
    expect(shouldNotify(notifyConditions)).to.be.true
    expect(notifyConditions.whenISaySo).to.be.calledOnce
  })
})
