import { test, expect } from '@playwright/test';

test.describe('Team Setup Flow', () => {
  const testEmail = `coach-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const teamName = 'Springfield Wildcats';
  const teamSeason = '2024-2025';

  test.beforeEach(async ({ page }) => {
    // Navigate to signup page and create a new account
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[formControlName="password"]', testPassword);
    await page.fill('input[formControlName="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to login page
    await page.waitForURL('**/login');

    // Login with the new account
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to team setup page (since user has no team)
    await page.waitForURL('**/team-setup');
  });

  test('should display team setup form after login for new user', async ({ page }) => {
    await expect(page.locator('mat-card-title')).toContainText('Create Your Team');
    await expect(page.locator('input[formControlName="teamName"]')).toBeVisible();
    await expect(page.locator('input[formControlName="season"]')).toBeVisible();
  });

  test('should have pre-filled season in correct format', async ({ page }) => {
    const seasonInput = page.locator('input[formControlName="season"]');
    const seasonValue = await seasonInput.inputValue();

    // Should be in YYYY-YYYY format
    expect(seasonValue).toMatch(/^\d{4}-\d{4}$/);
  });

  test('should validate team name requirements', async ({ page }) => {
    // Try submitting with empty name
    const teamNameInput = page.locator('input[formControlName="teamName"]');
    await teamNameInput.fill('');
    await teamNameInput.blur();

    await expect(page.locator('mat-error')).toContainText('This field is required');

    // Try with name too short
    await teamNameInput.fill('A');
    await teamNameInput.blur();

    await expect(page.locator('mat-error')).toContainText('at least 2 characters');
  });

  test('should validate season format', async ({ page }) => {
    const seasonInput = page.locator('input[formControlName="season"]');

    // Try invalid format
    await seasonInput.fill('2024');
    await seasonInput.blur();

    await expect(page.locator('mat-error')).toContainText('YYYY-YYYY format');

    // Try valid format
    await seasonInput.fill('2024-2025');
    await seasonInput.blur();

    await expect(page.locator('mat-error')).toHaveCount(0);
  });

  test('should create team without logo successfully', async ({ page }) => {
    // Fill in team details
    await page.fill('input[formControlName="teamName"]', teamName);
    await page.fill('input[formControlName="season"]', teamSeason);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('.mdc-snackbar__label, .mat-mdc-snack-bar-label')).toContainText('Team created successfully');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });
  });

  test('should show image preview when file is selected', async ({ page }) => {
    // Create a test image file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

    // Set the file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Choose Image")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test-logo.png',
      mimeType: 'image/png',
      buffer: buffer
    });

    // Check that preview is displayed
    await expect(page.locator('.image-preview')).toBeVisible();

    // Check that remove button is present
    await expect(page.locator('.remove-image-btn')).toBeVisible();
  });

  test('should remove image preview when remove button is clicked', async ({ page }) => {
    // Upload a file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Choose Image")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test-logo.png',
      mimeType: 'image/png',
      buffer: buffer
    });

    // Wait for preview
    await expect(page.locator('.image-preview')).toBeVisible();

    // Click remove button
    await page.click('.remove-image-btn');

    // Preview should be gone
    await expect(page.locator('.image-preview')).not.toBeVisible();

    // Upload button should be visible again
    await expect(page.locator('button:has-text("Choose Image")')).toBeVisible();
  });

  test('should validate file type for logo upload', async ({ page }) => {
    // Try uploading a text file
    const buffer = Buffer.from('This is not an image');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Choose Image")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: buffer
    });

    // Should show error message
    await expect(page.locator('.error-message')).toContainText('Invalid file type');
  });

  test('should disable submit button while loading', async ({ page }) => {
    // Fill in team details
    await page.fill('input[formControlName="teamName"]', teamName);
    await page.fill('input[formControlName="season"]', teamSeason);

    // Get submit button
    const submitButton = page.locator('button[type="submit"]');

    // Click submit
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();
  });

  test('should show loading spinner during team creation', async ({ page }) => {
    // Fill in team details
    await page.fill('input[formControlName="teamName"]', teamName);
    await page.fill('input[formControlName="season"]', teamSeason);

    // Submit form
    await page.click('button[type="submit"]');

    // Loading spinner should appear
    await expect(page.locator('mat-spinner')).toBeVisible();
  });

  test('should not allow form submission with invalid data', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');

    // Initially button should be disabled (form is invalid)
    await expect(submitButton).toBeDisabled();

    // Fill only team name
    await page.fill('input[formControlName="teamName"]', teamName);

    // Clear season (make it invalid)
    await page.fill('input[formControlName="season"]', '');

    // Button should still be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('should redirect existing team users to dashboard', async ({ page }) => {
    // First, create a team
    await page.fill('input[formControlName="teamName"]', teamName);
    await page.fill('input[formControlName="season"]', teamSeason);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });

    // Log out
    // Note: Assuming there's a logout mechanism in the dashboard
    // This part may need adjustment based on actual implementation

    // Log back in
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard, NOT team-setup
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    expect(page.url()).not.toContain('team-setup');
  });
});