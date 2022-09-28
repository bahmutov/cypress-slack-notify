describe('Spec b', () => {
  context('inner suite', () => {
    it('fails', () => {
      cy.log('test b')
      cy.wrap(true).should('be.false')
    })
  })
})
