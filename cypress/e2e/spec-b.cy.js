it('fails', () => {
  cy.log('test b')
  cy.wrap(true).should('be.false')
})
