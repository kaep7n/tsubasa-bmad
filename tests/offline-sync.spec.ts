import { test, expect, Page } from '@playwright/test';

test.describe('Offline Sync', () => {
  let page: Page;

  test.beforeEach(async ({ page: p, context }) => {
    page = p;

    // Mock Supabase auth
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }));
    });
  });

  test('should queue operations when offline and sync when online', async () => {
    await page.goto('/teams/new');

    // Go offline
    await page.context().setOffline(true);

    // Fill team creation form
    await page.fill('input[formControlName="name"]', 'Offline Test Team');
    await page.fill('input[formControlName="age_group"]', 'U12');
    await page.fill('input[formControlName="season"]', '2024-2025');

    // Submit form while offline
    await page.click('button[type="submit"]');

    // Verify success message appears (operation was queued)
    await expect(page.locator('text=Team created successfully')).toBeVisible({ timeout: 5000 });

    // Verify operation is in IndexedDB sync queue
    const queuedOps = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('TsubasaDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const transaction = db.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const getAllRequest = store.getAll();

      return new Promise<any[]>((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
    });

    // Verify we have a queued insert operation for teams table
    expect(queuedOps.length).toBeGreaterThan(0);
    const teamInsert = queuedOps.find(op => op.table === 'teams' && op.operation === 'insert');
    expect(teamInsert).toBeDefined();
    expect(teamInsert?.data.name).toBe('Offline Test Team');
    expect(teamInsert?.synced).toBe(false);

    // Go back online
    await page.context().setOffline(false);

    // Wait a bit for auto-sync to trigger
    await page.waitForTimeout(2000);

    // Verify operation was synced
    const syncedOps = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('TsubasaDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const transaction = db.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const getAllRequest = store.getAll();

      return new Promise<any[]>((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
    });

    const syncedTeamInsert = syncedOps.find(op => op.table === 'teams' && op.operation === 'insert');
    expect(syncedTeamInsert?.synced).toBe(true);
  });

  test('should show offline indicator when connection is lost', async () => {
    await page.goto('/dashboard');

    // Verify initially online
    await expect(page.locator('.offline-indicator')).not.toBeVisible();

    // Go offline
    await page.context().setOffline(true);
    await page.dispatchEvent('window', 'offline');

    // Verify offline indicator appears
    await expect(page.locator('.offline-indicator, text=You are offline')).toBeVisible({ timeout: 3000 });

    // Go back online
    await page.context().setOffline(false);
    await page.dispatchEvent('window', 'online');

    // Verify offline indicator disappears
    await expect(page.locator('.offline-indicator, text=You are offline')).not.toBeVisible({ timeout: 3000 });
  });

  test('should handle multiple offline operations and sync in order', async () => {
    await page.goto('/teams/new');

    // Go offline
    await page.context().setOffline(true);

    // Create first team
    await page.fill('input[formControlName="name"]', 'Team Alpha');
    await page.fill('input[formControlName="age_group"]', 'U10');
    await page.fill('input[formControlName="season"]', '2024-2025');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Team created successfully')).toBeVisible({ timeout: 5000 });

    // Navigate back to create another team
    await page.goto('/teams/new');

    // Create second team
    await page.fill('input[formControlName="name"]', 'Team Beta');
    await page.fill('input[formControlName="age_group"]', 'U12');
    await page.fill('input[formControlName="season"]', '2024-2025');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Team created successfully')).toBeVisible({ timeout: 5000 });

    // Verify both operations are queued
    const queuedOps = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('TsubasaDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const transaction = db.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const getAllRequest = store.getAll();

      return new Promise<any[]>((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
    });

    const teamOps = queuedOps.filter(op => op.table === 'teams' && op.operation === 'insert');
    expect(teamOps.length).toBe(2);
    expect(teamOps[0].timestamp).toBeLessThan(teamOps[1].timestamp);

    // Go back online
    await page.context().setOffline(false);

    // Wait for sync
    await page.waitForTimeout(3000);

    // Verify both operations synced
    const syncedOps = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('TsubasaDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const transaction = db.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const getAllRequest = store.getAll();

      return new Promise<any[]>((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
    });

    const syncedTeamOps = syncedOps.filter(op => op.table === 'teams' && op.operation === 'insert');
    expect(syncedTeamOps.every(op => op.synced)).toBe(true);
  });

  test('should load data from IndexedDB when offline', async () => {
    // First, create a team while online
    await page.goto('/teams/new');
    await page.fill('input[formControlName="name"]', 'Cached Team');
    await page.fill('input[formControlName="age_group"]', 'U14');
    await page.fill('input[formControlName="season"]', '2024-2025');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Team created successfully')).toBeVisible({ timeout: 5000 });

    // Wait for sync to complete
    await page.waitForTimeout(2000);

    // Store team data in IndexedDB
    const teamId = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('TsubasaDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const transaction = db.transaction(['teams'], 'readwrite');
      const store = transaction.objectStore('teams');

      const team = {
        id: 'cached-team-id',
        name: 'Cached Team',
        age_group: 'U14',
        season: '2024-2025',
        created_by: 'test-user-id',
        created_at: new Date(),
        updated_at: new Date()
      };

      const addRequest = store.put(team);

      return new Promise<string>((resolve, reject) => {
        addRequest.onsuccess = () => resolve(team.id);
        addRequest.onerror = () => reject(addRequest.error);
      });
    });

    // Now go offline
    await page.context().setOffline(true);

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Verify team data is still visible (loaded from IndexedDB)
    await expect(page.locator('text=Cached Team')).toBeVisible({ timeout: 5000 });
  });

  test('should retry failed sync operations', async () => {
    await page.goto('/teams/new');

    // Go offline
    await page.context().setOffline(true);

    // Create team while offline
    await page.fill('input[formControlName="name"]', 'Retry Team');
    await page.fill('input[formControlName="age_group"]', 'U16');
    await page.fill('input[formControlName="season"]', '2024-2025');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Team created successfully')).toBeVisible({ timeout: 5000 });

    // Simulate a scenario where sync fails initially
    await page.context().setOffline(false);

    // Mock a failed API response
    await page.route('**/rest/v1/teams*', route => {
      route.abort('failed');
    });

    // Trigger manual sync
    await page.evaluate(() => {
      // Assuming there's a manual sync method exposed
      (window as any).triggerSync?.();
    });

    await page.waitForTimeout(1000);

    // Verify retry count incremented
    const retryOps = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('TsubasaDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const transaction = db.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const getAllRequest = store.getAll();

      return new Promise<any[]>((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
    });

    const teamOp = retryOps.find(op => op.data?.name === 'Retry Team');
    expect(teamOp?.retryCount).toBeGreaterThan(0);
  });

  test('should show sync status in UI', async () => {
    await page.goto('/dashboard');

    // Check if sync status indicator exists
    const syncStatus = page.locator('[data-testid="sync-status"], .sync-indicator');

    // Should show "synced" when online and no pending operations
    await expect(syncStatus).toContainText(/synced|up to date/i);

    // Go offline
    await page.context().setOffline(true);
    await page.dispatchEvent('window', 'offline');

    // Wait for UI to update
    await page.waitForTimeout(500);

    // Create an operation while offline
    await page.goto('/teams/new');
    await page.fill('input[formControlName="name"]', 'Pending Team');
    await page.fill('input[formControlName="age_group"]', 'U18');
    await page.fill('input[formControlName="season"]', '2024-2025');
    await page.click('button[type="submit"]');

    // Go back to dashboard
    await page.goto('/dashboard');

    // Should show pending count
    await expect(page.locator('text=/pending|queue/i')).toBeVisible({ timeout: 3000 });
  });

  test.afterEach(async () => {
    // Clean up IndexedDB after each test
    await page.evaluate(() => {
      indexedDB.deleteDatabase('TsubasaDB');
    });
  });
});
