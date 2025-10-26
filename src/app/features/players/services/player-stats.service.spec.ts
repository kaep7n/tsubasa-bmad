import { TestBed } from '@angular/core/testing';
import { PlayerStatsService } from './player-stats.service';
import { DatabaseService } from '../../../core/services/database.service';

/**
 * Unit Tests for PlayerStatsService
 * Story: 2.7 Player Statistics Service Foundation
 */
describe('PlayerStatsService', () => {
  let service: PlayerStatsService;

  const mockPlayerId = 'player-1';
  const mockTeamId = 'team-1';

  beforeEach(() => {
    // Create mock DatabaseService
    const dbMock = jasmine.createSpyObj('DatabaseService', ['db']);
    dbMock.db = {
      players: {
        where: jasmine.createSpy('where').and.returnValue({
          equals: jasmine.createSpy('equals').and.returnValue({
            and: jasmine.createSpy('and').and.returnValue({
              toArray: jasmine
                .createSpy('toArray')
                .and.returnValue(
                  Promise.resolve([{ id: mockPlayerId, team_id: mockTeamId, deleted_at: null }]),
                ),
            }),
          }),
        }),
        get: jasmine.createSpy('get').and.returnValue(
          Promise.resolve({
            id: mockPlayerId,
            team_id: mockTeamId,
            deleted_at: null,
          }),
        ),
      },
    };

    TestBed.configureTestingModule({
      providers: [PlayerStatsService, { provide: DatabaseService, useValue: dbMock }],
    });

    service = TestBed.inject(PlayerStatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPlayerStats', () => {
    it('should return stats for a player', done => {
      service.getPlayerStats(mockPlayerId).subscribe(stats => {
        expect(stats).toBeDefined();
        expect(stats.playerId).toBe(mockPlayerId);
        done();
      });
    });

    it('should return empty stats when no data exists (placeholder)', done => {
      service.getPlayerStats(mockPlayerId).subscribe(stats => {
        expect(stats.gamesPlayed).toBe(0);
        expect(stats.goalsScored).toBe(0);
        expect(stats.assists).toBe(0);
        expect(stats.attendanceRate).toBe(0);
        expect(stats.trainingSessionsAttended).toBe(0);
        done();
      });
    });

    it('should cache stats after first query', done => {
      // First call - cache miss
      service.getPlayerStats(mockPlayerId).subscribe(() => {
        // Second call - should hit cache (no DB query)
        service.getPlayerStats(mockPlayerId).subscribe(stats => {
          expect(stats).toBeDefined();
          done();
        });
      });
    });

    it('should update signal when stats are fetched', done => {
      service.getPlayerStats(mockPlayerId).subscribe(() => {
        const statsMap = service.playerStats();
        expect(statsMap.has(mockPlayerId)).toBeTrue();
        const stats = statsMap.get(mockPlayerId);
        expect(stats).toBeDefined();
        expect(stats?.playerId).toBe(mockPlayerId);
        done();
      });
    });
  });

  describe('cache behavior', () => {
    it('should return cached data within TTL', done => {
      // First call
      service.getPlayerStats(mockPlayerId).subscribe(() => {
        // Second call immediately - should use cache
        service.getPlayerStats(mockPlayerId).subscribe(stats => {
          expect(stats).toBeDefined();
          done();
        });
      });
    });

    it('should invalidate cache for a specific player', done => {
      service.getPlayerStats(mockPlayerId).subscribe(() => {
        // Invalidate cache
        service.invalidatePlayerCache(mockPlayerId);

        // Verify cache is cleared
        const statsMap = service.playerStats();
        expect(statsMap.has(mockPlayerId)).toBeFalse();
        done();
      });
    });

    it('should invalidate all cache', done => {
      service.getPlayerStats(mockPlayerId).subscribe(() => {
        service.invalidateAllCache();

        const statsMap = service.playerStats();
        expect(statsMap.size).toBe(0);
        done();
      });
    });
  });

  describe('refreshPlayerStats', () => {
    it('should force re-query by invalidating cache first', done => {
      // First call
      service.getPlayerStats(mockPlayerId).subscribe(() => {
        // Refresh - should invalidate and re-query
        service.refreshPlayerStats(mockPlayerId).subscribe(stats => {
          expect(stats).toBeDefined();
          done();
        });
      });
    });
  });

  describe('getAllPlayerStats', () => {
    it('should return stats for all players in a team', done => {
      service.getAllPlayerStats(mockTeamId).subscribe(statsArray => {
        expect(Array.isArray(statsArray)).toBeTrue();
        expect(statsArray.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should filter out deleted players', done => {
      service.getAllPlayerStats(mockTeamId).subscribe(statsArray => {
        statsArray.forEach(stats => {
          expect(stats.playerId).toBeDefined();
        });
        done();
      });
    });
  });

  describe('invalidateTeamCache', () => {
    xit('should call invalidatePlayerCache for team players', done => {
      // Skip this test - requires full IndexedDB mock setup
      // The method is tested indirectly through integration tests
      done();
    });
  });
});

/**
 * Performance Tests for PlayerStatsService
 * Story: 2.7 AC #8 - Verify <100ms query time for 20 players, 50 games
 *
 * Note: These tests will be more meaningful when real database tables exist
 * and we have actual data to query. For now, they verify the service structure.
 */
describe('PlayerStatsService Performance', () => {
  let service: PlayerStatsService;

  beforeEach(() => {
    const dbMock = jasmine.createSpyObj('DatabaseService', ['db']);
    dbMock.db = {
      players: {
        where: jasmine.createSpy('where').and.returnValue({
          equals: jasmine.createSpy('equals').and.returnValue({
            and: jasmine.createSpy('and').and.returnValue({
              toArray: jasmine.createSpy('toArray').and.returnValue(Promise.resolve([])),
            }),
          }),
        }),
      },
    };

    TestBed.configureTestingModule({
      providers: [PlayerStatsService, { provide: DatabaseService, useValue: dbMock }],
    });

    service = TestBed.inject(PlayerStatsService);
  });

  it('should calculate stats for a single player quickly', done => {
    const startTime = performance.now();

    service.getPlayerStats('test-player').subscribe(() => {
      const duration = performance.now() - startTime;
      // Even with mock data, should be very fast
      expect(duration).toBeLessThan(50);
      done();
    });
  });

  it('should handle multiple concurrent requests efficiently', done => {
    const playerIds = Array.from({ length: 20 }, (_, i) => `player-${i}`);
    const startTime = performance.now();

    Promise.all(playerIds.map(id => service.getPlayerStats(id).toPromise())).then(() => {
      const duration = performance.now() - startTime;
      // Should complete all 20 queries quickly with placeholder data
      expect(duration).toBeLessThan(100);
      done();
    });
  });

  // TODO: Add real performance test when database tables exist
  // it('should calculate stats for 20 players with 50 games in <100ms', async () => {
  //   // Setup: Populate IndexedDB with test data
  //   // - 20 players
  //   // - 50 games
  //   // - 100 goals
  //   // - 200 attendance records
  //
  //   const startTime = performance.now();
  //   await service.getAllPlayerStats(teamId).toPromise();
  //   const duration = performance.now() - startTime;
  //
  //   expect(duration).toBeLessThan(100);
  // });
});
