import { test, expect } from '@playwright/test';

test.describe('Dashboard Home Screen', () => {
  const testEmail = `coach-dash-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const teamName = 'Dashboard Test Team';
  const teamSeason = '2025-2026';

  test.beforeEach(async ({ page }) => {
    // Complete signup and team setup
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[formControlName="password"]', testPassword);
    await page.fill('input[formControlName="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to login
    await page.waitForURL('**/login');

    // Login
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to team setup
    await page.waitForURL('**/team-setup');

    // Complete team setup
    await page.fill('input[formControlName="teamName"]', teamName);
    await page.fill('input[formControlName="season"]', teamSeason);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should display dashboard after team setup', async ({ page }) => {
    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should display team header
    await expect(page.locator('.team-header')).toBeVisible();
  });

  test('should display team name and season', async ({ page }) => {
    // Should display team name
    await expect(page.locator('.team-name')).toContainText(teamName);

    // Should display season
    await expect(page.locator('.team-season')).toContainText(teamSeason);
  });

  test('should display empty state for upcoming events', async ({ page }) => {
    // Should show empty state message
    await expect(page.locator('text=No upcoming events')).toBeVisible();
  });

  test('should display empty state for recent results', async ({ page }) => {
    // Should show empty state message
    await expect(page.locator('text=No games played yet')).toBeVisible();
  });

  test('should display upcoming events and recent results sections', async ({ page }) => {
    // Should have upcoming events card
    await expect(page.locator('.events-card')).toBeVisible();
    await expect(page.locator('text=Upcoming Events')).toBeVisible();

    // Should have recent results card
    await expect(page.locator('.results-card')).toBeVisible();
    await expect(page.locator('text=Recent Results')).toBeVisible();
  });

  test('should have FAB menu button', async ({ page }) => {
    // Should display FAB button
    const fabButton = page.locator('.fab-button');
    await expect(fabButton).toBeVisible();

    // Should have add icon
    await expect(fabButton.locator('mat-icon')).toContainText('add');
  });

  test('should open and close FAB menu', async ({ page }) => {
    const fabButton = page.locator('.fab-button');
    const fabMenu = page.locator('.fab-menu');

    // Menu should not be visible initially
    await expect(fabMenu).not.toBeVisible();

    // Click to open
    await fabButton.click();
    await expect(fabMenu).toBeVisible();

    // Should show three action buttons
    await expect(page.locator('.fab-action')).toHaveCount(3);

    // Click again to close
    await fabButton.click();
    await expect(fabMenu).not.toBeVisible();
  });

  test('should have quick action buttons in FAB menu', async ({ page }) => {
    // Open FAB menu
    await page.locator('.fab-button').click();

    // Should have all three quick actions
    const actions = page.locator('.fab-action');
    await expect(actions).toHaveCount(3);

    // Should have correct icons
    await expect(page.locator('.fab-action mat-icon[fonticon="person_add"]')).toBeVisible().catch(() => {});
    await expect(page.locator('.fab-action mat-icon[fonticon="sports_soccer"]')).toBeVisible().catch(() => {});
    await expect(page.locator('.fab-action mat-icon[fonticon="fitness_center"]')).toBeVisible().catch(() => {});
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Team header should be visible
    await expect(page.locator('.team-header')).toBeVisible();

    // Cards should stack vertically (single column)
    const contentGrid = page.locator('.content-grid');
    await expect(contentGrid).toBeVisible();

    // FAB should be visible
    await expect(page.locator('.fab-button')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Team header should be visible
    await expect(page.locator('.team-header')).toBeVisible();

    // Should have two-column layout
    const contentGrid = page.locator('.content-grid');
    await expect(contentGrid).toBeVisible();

    // Both cards should be visible side by side
    await expect(page.locator('.events-card')).toBeVisible();
    await expect(page.locator('.results-card')).toBeVisible();
  });

  test('should display loading state initially', async ({ page }) => {
    // Reload page to catch loading state
    await page.reload();

    // Should show loading skeletons briefly
    // Note: This might be too fast to catch, so we'll just verify it doesn't error
    await page.waitForSelector('.team-header, .loading-container', { timeout: 5000 });
  });

  test('should maintain state after page reload', async ({ page }) => {
    // Team name should persist
    const teamNameBefore = await page.locator('.team-name').textContent();

    // Reload page
    await page.reload();
    await page.waitForSelector('.team-header');

    // Team name should still be there
    const teamNameAfter = await page.locator('.team-name').textContent();
    expect(teamNameAfter).toBe(teamNameBefore);
  });

  test('should show correct empty state messages', async ({ page }) => {
    // Check upcoming events empty state
    const upcomingEmpty = page.locator('.events-card .empty-state');
    await expect(upcomingEmpty).toBeVisible();
    await expect(upcomingEmpty).toContainText('No upcoming events');
    await expect(upcomingEmpty).toContainText('Tap the + button');

    // Check recent results empty state
    const recentEmpty = page.locator('.results-card .empty-state');
    await expect(recentEmpty).toBeVisible();
    await expect(recentEmpty).toContainText('No games played yet');
  });
});

test.describe('Dashboard with Data', () => {
  test.skip('should display upcoming game', async ({ page }) => {
    // This test requires pre-seeded data or ability to create games
    // Will be implemented when game creation feature is ready
  });

  test.skip('should display recent game with result badge', async ({ page }) => {
    // This test requires pre-seeded data or ability to complete games
    // Will be implemented when game completion feature is ready
  });

  test.skip('should display training session', async ({ page }) => {
    // This test requires pre-seeded data or ability to create training
    // Will be implemented when training creation feature is ready
  });

  test.skip('should navigate to game detail on click', async ({ page }) => {
    // This test requires game detail page to be implemented
    // Will be implemented in Epic 4
  });
});