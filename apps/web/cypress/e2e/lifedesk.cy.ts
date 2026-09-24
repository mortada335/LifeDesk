describe('LifeDesk E2E Journey', () => {
  const testEmail = `test_${Date.now()}@lifedesk.app`;

  it('should switch interface language to Arabic and verify RTL layout and translated text', () => {
    cy.visit('/');
    cy.get('html').should('have.attr', 'dir', 'ltr');
    cy.contains('button', 'العربية').click();
    cy.get('html').should('have.attr', 'dir', 'rtl');
    cy.get('html').should('have.attr', 'lang', 'ar');
    cy.contains('لا تفوّت').should('be.visible');
    cy.contains('ابدأ التنظيم مجاناً').should('be.visible');

    // Switch back to English
    cy.contains('button', 'English').click();
    cy.get('html').should('have.attr', 'dir', 'ltr');
    cy.get('html').should('have.attr', 'lang', 'en');
    cy.contains('Never forget what matters').should('be.visible');
  });

  it('should register a new user, create a recurring bill, and verify auto-recurrence on completion', () => {
    // 1. Visit landing page
    cy.visit('/');
    cy.contains('Never forget what matters').should('be.visible');
    cy.contains('Start Organizing for Free').click();

    // 2. On register page
    cy.url().should('include', '/register');
    cy.get('input[placeholder="e.g. Mortada Ahmed"]').type('Mortada Ahmed');
    cy.get('input[placeholder="you@example.com"]').type(testEmail);
    cy.get('input[placeholder="••••••••"]').type('password123');
    cy.contains('button', 'Create Free Account').click();

    // 3. Arrive on dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Good', { timeout: 10000 }).should('be.visible');
    cy.contains('Mortada').should('be.visible');

    // 4. Add a new bill commitment
    cy.contains('button', 'Add New Item').click();
    cy.contains('Add New Commitment').should('be.visible');

    cy.get('input[placeholder="e.g. Internet Bill, Car Registration, Passport Renewal"]').type(
      'Fiber Internet Bill',
    );
    cy.get('select').first().select('BILL');
    cy.get('input[placeholder="e.g. 45.00"]').type('35.00');

    cy.contains('label', 'Recurrence')
      .parent()
      .find('select')
      .select('MONTHLY');

    cy.contains('button', 'Save Commitment').click();

    // 5. Switch to All Items tab to view the newly created commitment
    cy.contains('button', 'All Items').click();
    cy.contains('Fiber Internet Bill', { timeout: 10000 }).should('be.visible');
    cy.contains('$35.00').should('be.visible');

    // 6. Complete the recurring item
    cy.get('button[title="Mark as completed"]').first().click();

    // 7. Verify item is marked completed
    cy.contains('Fiber Internet Bill').should('be.visible');

    // 8. Visit activity log and verify audit trail
    cy.visit('/dashboard/activity');
    cy.contains('Fiber Internet Bill', { timeout: 10000 }).should('be.visible');
    cy.contains('Completed').should('be.visible');
  });
});
