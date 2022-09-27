it('fails c', () => {
  cy.log('test c')
  cy.wrap(true, { timeout: 100 }).should('be.false')
})
