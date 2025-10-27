# Google Calendar OAuth Setup Guide

This document explains how to configure Google Calendar integration for Stories 4.7 and 4.8.

## Prerequisites

- Google Cloud account
- Supabase project
- Application deployed and accessible

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "Tsubasa Soccer Manager")
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on "Google Calendar API"
4. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Click "Create"
4. Fill in required fields:
   - App name: "Tsubasa Soccer Manager"
   - User support email: your email
   - Developer contact email: your email
5. Click "Save and Continue"
6. On "Scopes" page, click "Add or Remove Scopes"
7. Filter for "Google Calendar API"
8. Select: `https://www.googleapis.com/auth/calendar.readonly`
9. Click "Update" → "Save and Continue"
10. On "Test users" page, add your email (for testing)
11. Click "Save and Continue"
12. Click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Name: "Tsubasa Web Client"
5. Under "Authorized redirect URIs", add:
   ```
   https://[your-supabase-project-ref].supabase.co/auth/v1/callback
   ```
   Replace `[your-supabase-project-ref]` with your actual Supabase project reference
6. Click "Create"
7. **Copy the Client ID and Client Secret** (you'll need these for Supabase)

## Step 5: Configure Supabase Auth

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to "Authentication" → "Providers"
4. Find "Google" in the list and click to expand
5. Enable "Google enabled"
6. Paste your **Client ID** from Step 4
7. Paste your **Client Secret** from Step 4
8. In "Authorized Client IDs", paste the Client ID again
9. In "Skip nonce check", leave unchecked
10. Click "Save"

## Step 6: Test the Integration

1. Build and deploy your application
2. In the app, navigate to Games → Click "+" FAB → "Import Calendar"
3. Click "Connect Google Calendar"
4. You should be redirected to Google's OAuth consent screen
5. Grant permission for calendar access
6. You should be redirected back to your app
7. Select a calendar and click "Import Games"

## Troubleshooting

### "Error: redirect_uri_mismatch"
- Verify the redirect URI in Google Cloud Console exactly matches your Supabase URL
- Check for trailing slashes - they must match exactly
- Supabase format: `https://[project-ref].supabase.co/auth/v1/callback`

### "Error: invalid_client"
- Verify Client ID and Client Secret are correct in Supabase
- Regenerate credentials if needed

### "Error: access_denied"
- Make sure you added your email as a test user in OAuth consent screen
- If in production, you'll need to verify your OAuth app with Google

### No calendars appear in dropdown
- Check browser console for API errors
- Verify Calendar API is enabled in Google Cloud Console
- Check that the scope `calendar.readonly` is included in Supabase

## Production Deployment

Before going to production:

1. **Verify OAuth App** (if needed):
   - Google requires verification for apps requesting sensitive scopes
   - Go to OAuth consent screen → "Publishing status"
   - Click "Publish App" or start verification process

2. **Update Test Users**:
   - Remove test users and allow all users with Google accounts

3. **Update Privacy Policy & Terms**:
   - Add links in OAuth consent screen
   - Required for verification

## Security Notes

- The `calendar.readonly` scope only allows **reading** calendar events
- We never modify or delete calendar events
- OAuth tokens are stored securely in Supabase Auth
- Tokens are automatically refreshed by Supabase
- Users can revoke access anytime from their Google Account settings

## References

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
