/**
 * PlayerSortingService Unit Tests
 * Story: 5.9 Smart Player Sorting by Frequency
 *
 * Test Coverage:
 * 1. trackPlayerSelection() increments count
 * 2. trackPlayerSelection() updates last_used_at
 * 3. getSortedPlayers() sorts correctly (game scorers first, then frequency, then alphabetical)
 * 4. resetUsageStats() clears all stats
 * 5. Multiple selections increase count correctly
 * 6. New player starts with count 0
 * 7. getPlayerUsageStats() returns correct stats
 * 8. getAllUsageStats() returns all stats
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PlayerSortingService } from './player-sorting.service';
import { DatabaseService } from './database.service';
import { PlayerUsageStats } from '../models/player-usage-stats.model';
import { Player } from '../../models/player.model';
import { Goal } from '../models/goal.model';

describe('PlayerSortingService', () => {
  let service: PlayerSortingService;
  let mockDatabaseService: jasmine.SpyObj<DatabaseService>;

  // Mock data stores
  let mockPlayerUsageStatsTable: Map<string, PlayerUsageStats>;
  let mockPlayersTable: Map<string, Player>;
  let mockGoalsTable: Map<string, Goal>;

  beforeEach(() => {
    // Reset mock data stores
    mockPlayerUsageStatsTable = new Map<string, PlayerUsageStats>();
    mockPlayersTable = new Map<string, Player>();
    mockGoalsTable = new Map<string, Goal>();

    // Create mock DatabaseService
    mockDatabaseService = jasmine.createSpyObj('DatabaseService', [], {
      db: {
        player_usage_stats: {
          get: jasmine
            .createSpy('get')
            .and.callFake((playerId: string) =>
              Promise.resolve(mockPlayerUsageStatsTable.get(playerId))
            ),
          put: jasmine
            .createSpy('put')
            .and.callFake((stats: PlayerUsageStats) => {
              mockPlayerUsageStatsTable.set(stats.player_id, stats);
              return Promise.resolve(stats.player_id);
            }),
          clear: jasmine
            .createSpy('clear')
            .and.callFake(() => {
              mockPlayerUsageStatsTable.clear();
              return Promise.resolve();
            }),
          toArray: jasmine
            .createSpy('toArray')
            .and.callFake(() => Promise.resolve(Array.from(mockPlayerUsageStatsTable.values()))),
        },
        players: {
          where: jasmine.createSpy('where').and.returnValue({
            equals: jasmine.createSpy('equals').and.returnValue({
              and: jasmine.createSpy('and').and.returnValue({
                toArray: jasmine
                  .createSpy('toArray')
                  .and.callFake(() => Promise.resolve(Array.from(mockPlayersTable.values()))),
              }),
            }),
          }),
        },
        goals: {
          where: jasmine.createSpy('where').and.returnValue({
            equals: jasmine.createSpy('equals').and.returnValue({
              and: jasmine.createSpy('and').and.returnValue({
                toArray: jasmine
                  .createSpy('toArray')
                  .and.callFake(() => Promise.resolve(Array.from(mockGoalsTable.values()))),
              }),
            }),
          }),
        },
      },
    });

    TestBed.configureTestingModule({
      providers: [
        PlayerSortingService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    });

    service = TestBed.inject(PlayerSortingService);
  });

  // =================================================================
  // INITIALIZATION TESTS
  // =================================================================

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });
  });

  // =================================================================
  // TEST 1: trackPlayerSelection() INCREMENTS COUNT
  // =================================================================

  describe('trackPlayerSelection() - increment count', () => {
    it('should create new stats with count 1 for new player', fakeAsync(() => {
      const playerId = 'player-1';

      service.trackPlayerSelection(playerId);
      tick();

      expect(mockDatabaseService.db.player_usage_stats.get).toHaveBeenCalled();
      expect(mockDatabaseService.db.player_usage_stats.put).toHaveBeenCalled();

      const stats = mockPlayerUsageStatsTable.get(playerId);
      expect(stats).toBeDefined();
      expect(stats!.player_id).toBe(playerId);
      expect(stats!.usage_count).toBe(1);
    }));

    it('should increment count for existing player', fakeAsync(() => {
      const playerId = 'player-2';
      const existingStats: PlayerUsageStats = {
        player_id: playerId,
        usage_count: 5,
        last_used_at: new Date('2024-01-01').toISOString(),
      };

      mockPlayerUsageStatsTable.set(playerId, existingStats);

      service.trackPlayerSelection(playerId);
      tick();

      const stats = mockPlayerUsageStatsTable.get(playerId);
      expect(stats!.usage_count).toBe(6);
    }));

    it('should handle multiple selections correctly', fakeAsync(() => {
      const playerId = 'player-3';

      // First selection
      service.trackPlayerSelection(playerId);
      tick();
      expect(mockPlayerUsageStatsTable.get(playerId)!.usage_count).toBe(1);

      // Second selection
      service.trackPlayerSelection(playerId);
      tick();
      expect(mockPlayerUsageStatsTable.get(playerId)!.usage_count).toBe(2);

      // Third selection
      service.trackPlayerSelection(playerId);
      tick();
      expect(mockPlayerUsageStatsTable.get(playerId)!.usage_count).toBe(3);
    }));
  });

  // =================================================================
  // TEST 2: trackPlayerSelection() UPDATES last_used_at
  // =================================================================

  describe('trackPlayerSelection() - update timestamp', () => {
    it('should set last_used_at timestamp for new player', fakeAsync(() => {
      const playerId = 'player-4';
      const beforeTime = new Date().toISOString();

      service.trackPlayerSelection(playerId);
      tick();

      const stats = mockPlayerUsageStatsTable.get(playerId);
      expect(stats!.last_used_at).toBeDefined();
      expect(new Date(stats!.last_used_at).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime()
      );
    }));

    it('should update last_used_at timestamp for existing player', fakeAsync(() => {
      const playerId = 'player-5';
      const oldTimestamp = new Date('2024-01-01').toISOString();
      const existingStats: PlayerUsageStats = {
        player_id: playerId,
        usage_count: 3,
        last_used_at: oldTimestamp,
      };

      mockPlayerUsageStatsTable.set(playerId, existingStats);

      service.trackPlayerSelection(playerId);
      tick();

      const stats = mockPlayerUsageStatsTable.get(playerId);
      expect(stats!.last_used_at).not.toBe(oldTimestamp);
      expect(new Date(stats!.last_used_at).getTime()).toBeGreaterThan(
        new Date(oldTimestamp).getTime()
      );
    }));
  });

  // =================================================================
  // TEST 3: getSortedPlayers() SORTING LOGIC
  // =================================================================

  describe('getSortedPlayers() - sorting logic', () => {
    beforeEach(() => {
      // Setup test data
      const teamId = 'team-1';
      const gameId = 'game-1';

      // Create players
      const players: Player[] = [
        {
          id: 'player-a',
          team_id: teamId,
          first_name: 'Alice',
          last_name: 'Anderson',
          date_of_birth: null,
          jersey_number: 10,
          photo_url: null,
          squad: 'starters',
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
        {
          id: 'player-b',
          team_id: teamId,
          first_name: 'Bob',
          last_name: 'Brown',
          date_of_birth: null,
          jersey_number: 7,
          photo_url: null,
          squad: 'starters',
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
        {
          id: 'player-c',
          team_id: teamId,
          first_name: 'Charlie',
          last_name: 'Clark',
          date_of_birth: null,
          jersey_number: 9,
          photo_url: null,
          squad: 'starters',
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
        {
          id: 'player-d',
          team_id: teamId,
          first_name: 'David',
          last_name: 'Davis',
          date_of_birth: null,
          jersey_number: 11,
          photo_url: null,
          squad: 'starters',
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
      ];

      players.forEach(p => mockPlayersTable.set(p.id, p));
    });

    it('should prioritize current game scorers over usage frequency', fakeAsync(() => {
      const gameId = 'game-1';
      const teamId = 'team-1';

      // Player A: 2 goals this game, 5 total usage
      // Player B: 0 goals this game, 20 total usage (high frequency)
      // Player C: 1 goal this game, 3 total usage
      // Player D: 0 goals this game, 0 total usage

      // Create goals for this game
      const goals: Goal[] = [
        {
          id: 'goal-1',
          game_id: gameId,
          player_id: 'player-a',
          scored_at_minute: 10,
          scored_at_timestamp: '',
          created_at: '',
          updated_at: '',
          deleted_at: null,
          sync_state: 'synced',
        },
        {
          id: 'goal-2',
          game_id: gameId,
          player_id: 'player-a',
          scored_at_minute: 20,
          scored_at_timestamp: '',
          created_at: '',
          updated_at: '',
          deleted_at: null,
          sync_state: 'synced',
        },
        {
          id: 'goal-3',
          game_id: gameId,
          player_id: 'player-c',
          scored_at_minute: 30,
          scored_at_timestamp: '',
          created_at: '',
          updated_at: '',
          deleted_at: null,
          sync_state: 'synced',
        },
      ];

      goals.forEach(g => mockGoalsTable.set(g.id, g));

      // Set usage stats
      mockPlayerUsageStatsTable.set('player-a', {
        player_id: 'player-a',
        usage_count: 5,
        last_used_at: new Date().toISOString(),
      });
      mockPlayerUsageStatsTable.set('player-b', {
        player_id: 'player-b',
        usage_count: 20,
        last_used_at: new Date().toISOString(),
      });
      mockPlayerUsageStatsTable.set('player-c', {
        player_id: 'player-c',
        usage_count: 3,
        last_used_at: new Date().toISOString(),
      });

      let sortedPlayers: any[];
      service.getSortedPlayers(gameId, teamId).then(players => {
        sortedPlayers = players;
      });
      tick();

      // Expected order: player-a (2 goals), player-c (1 goal), player-b (20 usage), player-d (0 usage)
      expect(sortedPlayers![0].id).toBe('player-a');
      expect(sortedPlayers![1].id).toBe('player-c');
      expect(sortedPlayers![2].id).toBe('player-b');
      expect(sortedPlayers![3].id).toBe('player-d');
    }));

    it('should sort by usage frequency when goal counts are equal', fakeAsync(() => {
      const gameId = 'game-2';
      const teamId = 'team-1';

      // All players have 0 goals this game
      // Player A: 10 usage
      // Player B: 20 usage
      // Player C: 5 usage
      // Player D: 0 usage

      mockPlayerUsageStatsTable.set('player-a', {
        player_id: 'player-a',
        usage_count: 10,
        last_used_at: new Date().toISOString(),
      });
      mockPlayerUsageStatsTable.set('player-b', {
        player_id: 'player-b',
        usage_count: 20,
        last_used_at: new Date().toISOString(),
      });
      mockPlayerUsageStatsTable.set('player-c', {
        player_id: 'player-c',
        usage_count: 5,
        last_used_at: new Date().toISOString(),
      });

      let sortedPlayers: any[];
      service.getSortedPlayers(gameId, teamId).then(players => {
        sortedPlayers = players;
      });
      tick();

      // Expected order: player-b (20), player-a (10), player-c (5), player-d (0)
      expect(sortedPlayers![0].id).toBe('player-b');
      expect(sortedPlayers![1].id).toBe('player-a');
      expect(sortedPlayers![2].id).toBe('player-c');
      expect(sortedPlayers![3].id).toBe('player-d');
    }));

    it('should sort alphabetically when goal count and usage are equal', fakeAsync(() => {
      const gameId = 'game-3';
      const teamId = 'team-1';

      // All players have 0 goals and 0 usage
      // Expected order: Anderson, Brown, Clark, Davis (alphabetical by last name)

      let sortedPlayers: any[];
      service.getSortedPlayers(gameId, teamId).then(players => {
        sortedPlayers = players;
      });
      tick();

      expect(sortedPlayers![0].last_name).toBe('Anderson');
      expect(sortedPlayers![1].last_name).toBe('Brown');
      expect(sortedPlayers![2].last_name).toBe('Clark');
      expect(sortedPlayers![3].last_name).toBe('Davis');
    }));

    it('should return players with correct stats attached', fakeAsync(() => {
      const gameId = 'game-4';
      const teamId = 'team-1';

      // Player A: 1 goal this game, 5 total usage
      const goal: Goal = {
        id: 'goal-1',
        game_id: gameId,
        player_id: 'player-a',
        scored_at_minute: 10,
        scored_at_timestamp: '',
        created_at: '',
        updated_at: '',
        deleted_at: null,
        sync_state: 'synced',
      };
      mockGoalsTable.set(goal.id, goal);

      mockPlayerUsageStatsTable.set('player-a', {
        player_id: 'player-a',
        usage_count: 5,
        last_used_at: new Date().toISOString(),
      });

      let sortedPlayers: any[];
      service.getSortedPlayers(gameId, teamId).then(players => {
        sortedPlayers = players;
      });
      tick();

      const playerA = sortedPlayers!.find(p => p.id === 'player-a');
      expect(playerA).toBeDefined();
      expect(playerA!.goalCount).toBe(1);
      expect(playerA!.usageCount).toBe(5);
    }));

    it('should handle players with no usage stats', fakeAsync(() => {
      const gameId = 'game-5';
      const teamId = 'team-1';

      // Player A has stats, others don't
      mockPlayerUsageStatsTable.set('player-a', {
        player_id: 'player-a',
        usage_count: 5,
        last_used_at: new Date().toISOString(),
      });

      let sortedPlayers: any[];
      service.getSortedPlayers(gameId, teamId).then(players => {
        sortedPlayers = players;
      });
      tick();

      const playerB = sortedPlayers!.find(p => p.id === 'player-b');
      expect(playerB!.usageCount).toBe(0);
      expect(playerB!.goalCount).toBe(0);
    }));
  });

  // =================================================================
  // TEST 4: resetUsageStats() CLEARS ALL STATS
  // =================================================================

  describe('resetUsageStats()', () => {
    it('should clear all usage statistics', fakeAsync(() => {
      // Add some stats
      mockPlayerUsageStatsTable.set('player-1', {
        player_id: 'player-1',
        usage_count: 10,
        last_used_at: new Date().toISOString(),
      });
      mockPlayerUsageStatsTable.set('player-2', {
        player_id: 'player-2',
        usage_count: 5,
        last_used_at: new Date().toISOString(),
      });

      expect(mockPlayerUsageStatsTable.size).toBe(2);

      service.resetUsageStats();
      tick();

      expect(mockDatabaseService.db.player_usage_stats.clear).toHaveBeenCalled();
      expect(mockPlayerUsageStatsTable.size).toBe(0);
    }));

    it('should handle clearing empty stats', fakeAsync(() => {
      expect(mockPlayerUsageStatsTable.size).toBe(0);

      service.resetUsageStats();
      tick();

      expect(mockDatabaseService.db.player_usage_stats.clear).toHaveBeenCalled();
      expect(mockPlayerUsageStatsTable.size).toBe(0);
    }));
  });

  // =================================================================
  // TEST 5 & 6: MULTIPLE SELECTIONS & NEW PLAYER
  // =================================================================

  describe('Multiple selections and new player behavior', () => {
    it('should correctly track multiple players', fakeAsync(() => {
      const player1 = 'player-1';
      const player2 = 'player-2';

      service.trackPlayerSelection(player1);
      tick();
      service.trackPlayerSelection(player2);
      tick();
      service.trackPlayerSelection(player1);
      tick();

      expect(mockPlayerUsageStatsTable.get(player1)!.usage_count).toBe(2);
      expect(mockPlayerUsageStatsTable.get(player2)!.usage_count).toBe(1);
    }));

    it('should start new player with count 0 before tracking', fakeAsync(() => {
      const gameId = 'game-1';
      const teamId = 'team-1';

      // Add a player with no usage stats
      mockPlayersTable.set('player-new', {
        id: 'player-new',
        team_id: teamId,
        first_name: 'New',
        last_name: 'Player',
        date_of_birth: null,
        jersey_number: 99,
        photo_url: null,
        squad: 'starters',
        created_at: '',
        updated_at: '',
        deleted_at: null,
      });

      let sortedPlayers: any[];
      service.getSortedPlayers(gameId, teamId).then(players => {
        sortedPlayers = players;
      });
      tick();

      const newPlayer = sortedPlayers!.find(p => p.id === 'player-new');
      expect(newPlayer).toBeDefined();
      expect(newPlayer!.usageCount).toBe(0);
      expect(newPlayer!.goalCount).toBe(0);
    }));
  });

  // =================================================================
  // TEST 7: getPlayerUsageStats()
  // =================================================================

  describe('getPlayerUsageStats()', () => {
    it('should return stats for existing player', fakeAsync(() => {
      const playerId = 'player-1';
      const stats: PlayerUsageStats = {
        player_id: playerId,
        usage_count: 15,
        last_used_at: new Date().toISOString(),
      };

      mockPlayerUsageStatsTable.set(playerId, stats);

      let retrievedStats: PlayerUsageStats | undefined;
      service.getPlayerUsageStats(playerId).then(s => {
        retrievedStats = s;
      });
      tick();

      expect(retrievedStats).toEqual(stats);
    }));

    it('should return undefined for player with no stats', fakeAsync(() => {
      let retrievedStats: PlayerUsageStats | undefined = {} as PlayerUsageStats;
      service.getPlayerUsageStats('non-existent-player').then(s => {
        retrievedStats = s;
      });
      tick();

      expect(retrievedStats).toBeUndefined();
    }));
  });

  // =================================================================
  // TEST 8: getAllUsageStats()
  // =================================================================

  describe('getAllUsageStats()', () => {
    it('should return all usage statistics', fakeAsync(() => {
      const stats1: PlayerUsageStats = {
        player_id: 'player-1',
        usage_count: 10,
        last_used_at: new Date().toISOString(),
      };
      const stats2: PlayerUsageStats = {
        player_id: 'player-2',
        usage_count: 5,
        last_used_at: new Date().toISOString(),
      };

      mockPlayerUsageStatsTable.set('player-1', stats1);
      mockPlayerUsageStatsTable.set('player-2', stats2);

      let allStats: PlayerUsageStats[];
      service.getAllUsageStats().then(stats => {
        allStats = stats;
      });
      tick();

      expect(allStats!.length).toBe(2);
      expect(allStats!).toContain(stats1);
      expect(allStats!).toContain(stats2);
    }));

    it('should return empty array when no stats exist', fakeAsync(() => {
      let allStats: PlayerUsageStats[];
      service.getAllUsageStats().then(stats => {
        allStats = stats;
      });
      tick();

      expect(allStats!).toEqual([]);
    }));
  });

  // =================================================================
  // ERROR HANDLING TESTS
  // =================================================================

  describe('Error Handling', () => {
    it('should throw error when tracking player fails', fakeAsync(() => {
      const getSpy = mockDatabaseService.db.player_usage_stats.get as jasmine.Spy;
      getSpy.and.returnValue(Promise.reject(new Error('Database error')));

      spyOn(console, 'error');

      service.trackPlayerSelection('player-1').catch(error => {
        expect(error).toBeDefined();
      });
      tick();

      expect(console.error).toHaveBeenCalledWith(
        '[PlayerSortingService] Error tracking player selection:',
        jasmine.any(Error)
      );
    }));

    it('should throw error when getting sorted players fails', fakeAsync(() => {
      const whereSpy = mockDatabaseService.db.players.where as jasmine.Spy;
      whereSpy.and.returnValue({
        equals: jasmine.createSpy('equals').and.returnValue({
          and: jasmine.createSpy('and').and.returnValue({
            toArray: jasmine
              .createSpy('toArray')
              .and.returnValue(Promise.reject(new Error('Database error'))),
          }),
        }),
      });

      spyOn(console, 'error');

      service.getSortedPlayers('game-1', 'team-1').catch(error => {
        expect(error).toBeDefined();
      });
      tick();

      expect(console.error).toHaveBeenCalledWith(
        '[PlayerSortingService] Error getting sorted players:',
        jasmine.any(Error)
      );
    }));

    it('should throw error when reset fails', fakeAsync(() => {
      const clearSpy = mockDatabaseService.db.player_usage_stats.clear as jasmine.Spy;
      clearSpy.and.returnValue(Promise.reject(new Error('Database error')));

      spyOn(console, 'error');

      service.resetUsageStats().catch(error => {
        expect(error).toBeDefined();
      });
      tick();

      expect(console.error).toHaveBeenCalledWith(
        '[PlayerSortingService] Error resetting usage stats:',
        jasmine.any(Error)
      );
    }));
  });

  // =================================================================
  // INTEGRATION TESTS
  // =================================================================

  describe('Integration Tests', () => {
    it('should handle complete workflow: track, sort, reset', fakeAsync(() => {
      const gameId = 'game-1';
      const teamId = 'team-1';

      // Setup players
      mockPlayersTable.set('player-a', {
        id: 'player-a',
        team_id: teamId,
        first_name: 'Alice',
        last_name: 'Anderson',
        date_of_birth: null,
        jersey_number: 10,
        photo_url: null,
        squad: 'starters',
        created_at: '',
        updated_at: '',
        deleted_at: null,
      });
      mockPlayersTable.set('player-b', {
        id: 'player-b',
        team_id: teamId,
        first_name: 'Bob',
        last_name: 'Brown',
        date_of_birth: null,
        jersey_number: 7,
        photo_url: null,
        squad: 'starters',
        created_at: '',
        updated_at: '',
        deleted_at: null,
      });

      // Track some selections
      service.trackPlayerSelection('player-a');
      tick();
      service.trackPlayerSelection('player-a');
      tick();
      service.trackPlayerSelection('player-b');
      tick();

      // Verify tracking
      expect(mockPlayerUsageStatsTable.get('player-a')!.usage_count).toBe(2);
      expect(mockPlayerUsageStatsTable.get('player-b')!.usage_count).toBe(1);

      // Get sorted players
      let sortedPlayers: any[];
      service.getSortedPlayers(gameId, teamId).then(players => {
        sortedPlayers = players;
      });
      tick();

      expect(sortedPlayers![0].id).toBe('player-a'); // Higher usage
      expect(sortedPlayers![1].id).toBe('player-b');

      // Reset stats
      service.resetUsageStats();
      tick();

      expect(mockPlayerUsageStatsTable.size).toBe(0);

      // Verify after reset
      service.getSortedPlayers(gameId, teamId).then(players => {
        sortedPlayers = players;
      });
      tick();

      // After reset, should be alphabetical
      expect(sortedPlayers![0].last_name).toBe('Anderson');
      expect(sortedPlayers![1].last_name).toBe('Brown');
      expect(sortedPlayers![0].usageCount).toBe(0);
      expect(sortedPlayers![1].usageCount).toBe(0);
    }));
  });
});
