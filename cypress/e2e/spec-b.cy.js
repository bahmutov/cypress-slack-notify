describe('Spec b', { tags: '@auth' }, () => {
  context('inner suite', () => {
    it('fails', () => {
      cy.log('test b')
      cy.wrap(true).should('be.false')
    })
  })
})
