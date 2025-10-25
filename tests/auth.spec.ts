import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests the complete authentication flow including login, signup, and logout
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the homepage
    await page.goto('/');
  });

  test('should redirect to login page from root', async ({ page }) => {
    await expect(page).toHaveURL('/login');
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');

    // Verify login form elements are present
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    await expect(page.getByText(/create account/i)).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');

    // Click on "Create account" link
    await page.getByRole('link', { name: /create account/i }).click();

    // Verify we're on the signup page
    await expect(page).toHaveURL('/signup');
    await expect(page.getByText('Create Account')).toBeVisible();
  });

  test('should display signup form', async ({ page }) => {
    await page.goto('/signup');

    // Verify signup form elements
    await expect(page.getByText('Create Account')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    await expect(page.getByText(/already have an account/i)).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid email
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').click(); // Trigger blur event

    // Check for error message
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test('should show validation errors for short password', async ({ page }) => {
    await page.goto('/login');

    // Enter short password
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for password length error
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });

  test('should display password strength indicator on signup', async ({ page }) => {
    await page.goto('/signup');

    // Type a password
    await page.getByLabel('Password', { exact: true }).fill('password123');

    // Verify password strength indicator appears
    await expect(page.getByText(/password strength/i)).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/signup');

    // Fill in form with mismatched passwords
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('different123');
    await page.getByRole('button', { name: /create account/i }).click();

    // Check for mismatch error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.getByLabel('Password');
    const toggleButton = page.getByRole('button', { name: /hide password/i }).first();

    // Verify password is hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    await toggleButton.click();

    // Verify password is now visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle again
    await toggleButton.click();

    // Verify password is hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate between login and signup pages', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    // Navigate to signup
    await page.getByRole('link', { name: /create account/i }).click();
    await expect(page).toHaveURL('/signup');

    // Navigate back to login
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/login');
  });

  // Note: The following tests require actual Supabase authentication to be configured
  // They are commented out but provided as examples for manual testing

  /*
  test('should successfully sign up a new user', async ({ page }) => {
    await page.goto('/signup');

    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill(testPassword);
    await page.getByLabel('Confirm Password').fill(testPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    // Verify success message and redirect
    await expect(page.getByText(/account created successfully/i)).toBeVisible();
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should redirect authenticated user from login to dashboard', async ({ page }) => {
    // First, login
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Try to access login page again
    await page.goto('/login');

    // Should be redirected back to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should successfully log out', async ({ page }) => {
    // First, login
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Logout (assuming there's a logout button in the dashboard)
    await page.getByRole('button', { name: /log out/i }).click();

    // Verify redirect to login
    await expect(page).toHaveURL('/login');
  });
  */
});