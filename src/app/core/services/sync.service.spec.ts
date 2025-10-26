import { TestBed } from '@angular/core/testing';
import { SyncService } from './sync.service';
import { DatabaseService } from './database.service';
import { SupabaseService } from './supabase.service';

describe('SyncService', () => {
  let service: SyncService;
  let mockDbService: jasmine.SpyObj<DatabaseService>;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabaseClient = {
      from: jasmine.createSpy('from').and.returnValue({
        insert: jasmine
          .createSpy('insert')
          .and.returnValue(Promise.resolve({ data: null, error: null })),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ data: null, error: null })),
        }),
        delete: jasmine.createSpy('delete').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ data: null, error: null })),
        }),
        select: jasmine.createSpy('select').and.returnValue({
          gt: jasmine.createSpy('gt').and.returnValue(Promise.resolve({ data: [], error: null })),
        }),
      }),
    };

    mockSupabaseService = jasmine.createSpyObj('SupabaseService', [], {
      client: mockSupabaseClient,
    });

    // Create mock database with sync_queue methods
    const mockSyncQueue = {
      add: jasmine.createSpy('add').and.returnValue(Promise.resolve(1)),
      where: jasmine.createSpy('where').and.returnValue({
        equals: jasmine.createSpy('equals').and.returnValue({
          sortBy: jasmine.createSpy('sortBy').and.returnValue(Promise.resolve([])),
          count: jasmine.createSpy('count').and.returnValue(Promise.resolve(0)),
          and: jasmine.createSpy('and').and.returnValue({
            count: jasmine.createSpy('count').and.returnValue(Promise.resolve(0)),
          }),
          delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
        }),
      }),
      update: jasmine.createSpy('update').and.returnValue(Promise.resolve(1)),
    };

    mockDbService = jasmine.createSpyObj('DatabaseService', ['clearAll', 'getStats'], {
      db: {
        sync_queue: mockSyncQueue,
      },
    });

    TestBed.configureTestingModule({
      providers: [
        SyncService,
        { provide: DatabaseService, useValue: mockDbService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    });

    service = TestBed.inject(SyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial sync state', () => {
    const state = service.syncState();

    expect(state.status).toBe('pending');
    expect(state.lastSyncTime).toBeNull();
    expect(state.pendingCount).toBe(0);
    expect(state.error).toBeNull();
  });

  describe('queueOperation', () => {
    it('should queue an operation for sync', async () => {
      await service.queueOperation('teams', 'insert', 'team-1', { name: 'Test Team' });

      expect(mockDbService.db.sync_queue.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          table: 'teams',
          operation: 'insert',
          recordId: 'team-1',
          data: { name: 'Test Team' },
          synced: false,
          retryCount: 0,
        }),
      );
    });

    it('should set timestamp when queueing operation', async () => {
      const beforeTime = Date.now();

      await service.queueOperation('players', 'update', 'player-1', { name: 'Updated' });

      const callArgs = (mockDbService.db.sync_queue.add as jasmine.Spy).calls.mostRecent().args[0];
      expect(callArgs.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('resolveConflict', () => {
    it('should choose remote record if it has newer timestamp', () => {
      const local = {
        id: '1',
        name: 'Local',
        updated_at: new Date('2024-01-01'),
      };

      const remote = {
        id: '1',
        name: 'Remote',
        updated_at: new Date('2024-01-02'),
      };

      const result = service.resolveConflict(local, remote);

      expect(result).toBe(remote);
      expect(result.name).toBe('Remote');
    });

    it('should choose local record if it has newer timestamp', () => {
      const local = {
        id: '1',
        name: 'Local',
        updated_at: new Date('2024-01-02'),
      };

      const remote = {
        id: '1',
        name: 'Remote',
        updated_at: new Date('2024-01-01'),
      };

      const result = service.resolveConflict(local, remote);

      expect(result).toBe(local);
      expect(result.name).toBe('Local');
    });

    it('should handle string timestamps', () => {
      const local = {
        id: '1',
        name: 'Local',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const remote = {
        id: '1',
        name: 'Remote',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = service.resolveConflict(local, remote);

      expect(result).toBe(remote);
    });
  });

  describe('processSyncQueue', () => {
    it('should not sync when offline', async () => {
      spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);

      await service.processSyncQueue();

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should process all pending operations when online', async () => {
      spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);

      const mockPendingOps = [
        {
          id: 1,
          table: 'teams',
          operation: 'insert' as const,
          recordId: 'team-1',
          data: { name: 'Team 1' },
          timestamp: Date.now(),
          synced: false,
          retryCount: 0,
        },
      ];

      (mockDbService.db.sync_queue.where as jasmine.Spy).and.returnValue({
        equals: jasmine.createSpy('equals').and.returnValue({
          sortBy: jasmine.createSpy('sortBy').and.returnValue(Promise.resolve(mockPendingOps)),
          count: jasmine.createSpy('count').and.returnValue(Promise.resolve(0)),
          and: jasmine.createSpy('and').and.returnValue({
            count: jasmine.createSpy('count').and.returnValue(Promise.resolve(0)),
          }),
        }),
      });

      await service.processSyncQueue();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
    });
  });

  describe('pullChanges', () => {
    it('should not pull changes when offline', async () => {
      spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);

      const result = await service.pullChanges('teams');

      expect(result).toEqual([]);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should pull all changes when no lastSyncTime provided', async () => {
      spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);

      const mockData = [{ id: '1', name: 'Team 1' }];

      mockSupabaseClient.from.and.returnValue({
        select: jasmine
          .createSpy('select')
          .and.returnValue(Promise.resolve({ data: mockData, error: null })),
      });

      const result = await service.pullChanges('teams');

      expect(result).toEqual(mockData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
    });

    it('should pull changes since lastSyncTime when provided', async () => {
      spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);

      const lastSyncTime = new Date('2024-01-01').getTime();
      const mockData = [{ id: '2', name: 'Team 2' }];

      let gtSpy: jasmine.Spy;

      mockSupabaseClient.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          gt: (gtSpy = jasmine
            .createSpy('gt')
            .and.returnValue(Promise.resolve({ data: mockData, error: null }))),
        }),
      });

      const result = await service.pullChanges('teams', lastSyncTime);

      expect(result).toEqual(mockData);
      expect(gtSpy).toHaveBeenCalledWith('updated_at', jasmine.any(String));
    });
  });

  describe('getSyncStats', () => {
    it('should return correct sync statistics', async () => {
      (mockDbService.db.sync_queue.where as jasmine.Spy).and.callFake((_field: string) => {
        return {
          equals: (value: boolean) => ({
            and: (_fn: unknown) => ({
              count: () => Promise.resolve(value ? 2 : 3),
            }),
            count: () => Promise.resolve(value ? 2 : 5),
          }),
        };
      });

      const stats = await service.getSyncStats();

      expect(stats.pending).toBe(3);
      expect(stats.synced).toBe(2);
      expect(stats.failed).toBe(3);
    });
  });

  describe('manualSync', () => {
    it('should trigger processSyncQueue', async () => {
      spyOn(service, 'processSyncQueue').and.returnValue(Promise.resolve());

      await service.manualSync();

      expect(service.processSyncQueue).toHaveBeenCalled();
    });
  });
});
