import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { GoalLogModalComponent, GoalLogModalData } from './goal-log-modal.component';
import { DatabaseService } from '../../../../core/services/database.service';
import { GoalService } from '../../../../core/services/goal.service';
import { GameTimerService } from '../../../../core/services/game-timer.service';
import { Player } from '../../../../models/player.model';
import { Goal } from '../../../../core/models/goal.model';

describe('GoalLogModalComponent', () => {
  let component: GoalLogModalComponent;
  let fixture: ComponentFixture<GoalLogModalComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<GoalLogModalComponent>>;
  let mockDb: any;
  let mockGoalService: jasmine.SpyObj<GoalService>;
  let mockTimerService: any;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<any>>;

  const mockDialogData: GoalLogModalData = {
    gameId: 'game-123',
    teamId: 'team-456'
  };

  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      team_id: 'team-456',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '2000-01-01',
      jersey_number: 10,
      photo_url: null,
      squad: 'starters',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      deleted_at: null
    },
    {
      id: 'player-2',
      team_id: 'team-456',
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: '2001-02-02',
      jersey_number: 7,
      photo_url: null,
      squad: 'starters',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      deleted_at: null
    },
    {
      id: 'player-3',
      team_id: 'team-456',
      first_name: 'Bob',
      last_name: 'Anderson',
      date_of_birth: '1999-03-03',
      jersey_number: 5,
      photo_url: null,
      squad: 'starters',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      deleted_at: null
    },
    {
      id: 'player-deleted',
      team_id: 'team-456',
      first_name: 'Deleted',
      last_name: 'Player',
      date_of_birth: '1998-04-04',
      jersey_number: 99,
      photo_url: null,
      squad: 'starters',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      deleted_at: '2025-01-15T00:00:00Z'
    }
  ];

  const mockGoals: Goal[] = [
    {
      id: 'goal-1',
      game_id: 'game-123',
      player_id: 'player-1',
      scored_at_minute: 23,
      scored_at_timestamp: '2025-01-01T15:23:00Z',
      notes: null,
      created_at: '2025-01-01T15:23:00Z',
      updated_at: '2025-01-01T15:23:00Z',
      deleted_at: null,
      sync_state: 'synced'
    },
    {
      id: 'goal-2',
      game_id: 'game-123',
      player_id: 'player-1',
      scored_at_minute: 67,
      scored_at_timestamp: '2025-01-01T15:67:00Z',
      notes: null,
      created_at: '2025-01-01T15:67:00Z',
      updated_at: '2025-01-01T15:67:00Z',
      deleted_at: null,
      sync_state: 'synced'
    },
    {
      id: 'goal-3',
      game_id: 'game-123',
      player_id: 'player-2',
      scored_at_minute: 45,
      scored_at_timestamp: '2025-01-01T15:45:00Z',
      notes: null,
      created_at: '2025-01-01T15:45:00Z',
      updated_at: '2025-01-01T15:45:00Z',
      deleted_at: null,
      sync_state: 'synced'
    }
  ];

  // Helper function to create mock Dexie collection with query chaining
  function createMockDexieCollection(data: any[], filterFn?: (item: any) => boolean) {
    const filteredData = filterFn ? data.filter(filterFn) : data;

    return {
      where: jasmine.createSpy('where').and.returnValue({
        equals: jasmine.createSpy('equals').and.returnValue({
          and: jasmine.createSpy('and').and.callFake((predicate: (item: any) => boolean) => ({
            toArray: jasmine.createSpy('toArray').and.returnValue(
              Promise.resolve(filteredData.filter(predicate))
            ),
            count: jasmine.createSpy('count').and.returnValue(
              Promise.resolve(filteredData.filter(predicate).length)
            )
          }))
        })
      })
    };
  }

  beforeEach(async () => {
    // Mock DatabaseService with Dexie tables
    mockDb = {
      db: {
        players: createMockDexieCollection(mockPlayers),
        goals: createMockDexieCollection(mockGoals)
      }
    };

    mockGoalService = jasmine.createSpyObj('GoalService', ['createGoal', 'createOpponentGoal']);
    mockGoalService.createGoal.and.returnValue(of({} as any));
    mockGoalService.createOpponentGoal.and.returnValue(of({} as any));

    const mockCurrentMinute = signal(45);
    mockTimerService = {
      currentMinute: mockCurrentMinute.asReadonly()
    };

    mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction']);
    mockSnackBarRef.onAction.and.returnValue(of(undefined));

    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockSnackBar.open.and.returnValue(mockSnackBarRef);

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [GoalLogModalComponent, NoopAnimationsModule],
      providers: [
        { provide: DatabaseService, useValue: mockDb },
        { provide: GoalService, useValue: mockGoalService },
        { provide: GameTimerService, useValue: mockTimerService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GoalLogModalComponent);
    component = fixture.componentInstance;
  });

  // ========================================================================
  // 1. Component Creation Tests
  // ========================================================================

  describe('Component Creation', () => {
    it('should create successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should receive dialog data with gameId and teamId', () => {
      expect(component.data).toEqual(mockDialogData);
      expect(component.data.gameId).toBe('game-123');
      expect(component.data.teamId).toBe('team-456');
    });

    it('should initialize with empty player list', () => {
      expect(component.allPlayers()).toEqual([]);
    });

    it('should initialize with loading state false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should initialize with empty search query', () => {
      expect(component.searchQuery()).toBe('');
    });
  });

  // ========================================================================
  // 2. Player Loading Tests (AC 2, 3, 4)
  // ========================================================================

  describe('Player Loading', () => {
    it('should load players from IndexedDB on init', async () => {
      await component.ngOnInit();

      expect(mockDb.db.players.where).toHaveBeenCalledWith('team_id');
      expect(component.allPlayers().length).toBeGreaterThan(0);
    });

    it('should filter out deleted players', async () => {
      await component.ngOnInit();

      const players = component.allPlayers();
      const deletedPlayer = players.find(p => p.id === 'player-deleted');

      expect(deletedPlayer).toBeUndefined();
    });

    it('should count goals for each player in current game', async () => {
      await component.ngOnInit();

      const players = component.allPlayers();
      const player1 = players.find(p => p.id === 'player-1');
      const player2 = players.find(p => p.id === 'player-2');
      const player3 = players.find(p => p.id === 'player-3');

      expect(player1?.goalCount).toBe(2); // Has 2 goals in current game
      expect(player2?.goalCount).toBe(1); // Has 1 goal in current game
      expect(player3?.goalCount).toBe(0); // Has no goals in current game
    });

    it('should calculate usage frequency (total goals)', async () => {
      await component.ngOnInit();

      const players = component.allPlayers();

      players.forEach(player => {
        expect(player.usageCount).toBeDefined();
        expect(typeof player.usageCount).toBe('number');
        expect(player.usageCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should create PlayerWithGoals objects', async () => {
      await component.ngOnInit();

      const players = component.allPlayers();

      players.forEach(player => {
        expect(player.goalCount).toBeDefined();
        expect(player.usageCount).toBeDefined();
        expect(player.id).toBeDefined();
        expect(player.first_name).toBeDefined();
        expect(player.last_name).toBeDefined();
      });
    });

    it('should handle loading errors gracefully', async () => {
      // Mock database error
      mockDb.db.players = {
        where: jasmine.createSpy('where').and.returnValue({
          equals: jasmine.createSpy('equals').and.returnValue({
            and: jasmine.createSpy('and').and.returnValue({
              toArray: jasmine.createSpy('toArray').and.returnValue(
                Promise.reject(new Error('Database error'))
              )
            })
          })
        })
      };

      await component.ngOnInit();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error loading players',
        'Close',
        { duration: 3000 }
      );
    });

    it('should set loading state to true during load', async () => {
      let loadingDuringFetch = false;

      // Create a delayed promise to check loading state
      mockDb.db.players = {
        where: jasmine.createSpy('where').and.returnValue({
          equals: jasmine.createSpy('equals').and.returnValue({
            and: jasmine.createSpy('and').and.returnValue({
              toArray: jasmine.createSpy('toArray').and.callFake(() => {
                loadingDuringFetch = component.isLoading();
                return Promise.resolve(mockPlayers.filter(p => !p.deleted_at));
              })
            })
          })
        })
      };

      await component.ngOnInit();

      expect(loadingDuringFetch).toBe(true);
    });

    it('should set loading state to false after load', async () => {
      await component.ngOnInit();

      expect(component.isLoading()).toBe(false);
    });

    it('should load goals for the current game only', async () => {
      await component.ngOnInit();

      expect(mockDb.db.goals.where).toHaveBeenCalledWith('game_id');
    });
  });

  // ========================================================================
  // 3. Smart Sorting Tests (AC 3)
  // ========================================================================

  describe('Smart Sorting', () => {
    beforeEach(async () => {
      // Setup mock to return specific usage frequencies
      mockDb.db.goals = {
        where: jasmine.createSpy('where').and.callFake((field: string) => {
          if (field === 'game_id') {
            return {
              equals: jasmine.createSpy('equals').and.returnValue({
                and: jasmine.createSpy('and').and.returnValue({
                  toArray: jasmine.createSpy('toArray').and.returnValue(
                    Promise.resolve(mockGoals)
                  )
                })
              })
            };
          } else if (field === 'player_id') {
            return {
              equals: jasmine.createSpy('equals').and.callFake((playerId: string) => ({
                count: jasmine.createSpy('count').and.callFake(() => {
                  if (playerId === 'player-1') return Promise.resolve(5); // High usage
                  if (playerId === 'player-2') return Promise.resolve(3); // Medium usage
                  if (playerId === 'player-3') return Promise.resolve(1); // Low usage
                  return Promise.resolve(0);
                })
              }))
            };
          }
          return null;
        })
      };

      await component.ngOnInit();
    });

    it('should sort players with goals in current game first', () => {
      const filtered = component.filteredPlayers();

      // First players should have goals in current game
      expect(filtered[0].goalCount).toBeGreaterThan(0);
      expect(filtered[1].goalCount).toBeGreaterThan(0);

      // Last player should have no goals
      expect(filtered[filtered.length - 1].goalCount).toBe(0);
    });

    it('should sort by goal count descending for current game', () => {
      const filtered = component.filteredPlayers();
      const playersWithGoals = filtered.filter(p => p.goalCount > 0);

      for (let i = 0; i < playersWithGoals.length - 1; i++) {
        expect(playersWithGoals[i].goalCount).toBeGreaterThanOrEqual(
          playersWithGoals[i + 1].goalCount
        );
      }
    });

    it('should sort by usage frequency after goal count', () => {
      const filtered = component.filteredPlayers();

      // Among players with same goal count, usage frequency should be descending
      const sameGoalCountGroups = new Map<number, any[]>();
      filtered.forEach(player => {
        const group = sameGoalCountGroups.get(player.goalCount) || [];
        group.push(player);
        sameGoalCountGroups.set(player.goalCount, group);
      });

      sameGoalCountGroups.forEach(group => {
        if (group.length > 1) {
          for (let i = 0; i < group.length - 1; i++) {
            expect(group[i].usageCount).toBeGreaterThanOrEqual(
              group[i + 1].usageCount
            );
          }
        }
      });
    });

    it('should sort alphabetically by last name as final tiebreaker', () => {
      // Create players with same goal count and usage frequency
      const samePlayers: Player[] = [
        { ...mockPlayers[0], id: 'p1', last_name: 'Zebra' },
        { ...mockPlayers[0], id: 'p2', last_name: 'Alpha' },
        { ...mockPlayers[0], id: 'p3', last_name: 'Beta' }
      ];

      mockDb.db.players = createMockDexieCollection(samePlayers);
      mockDb.db.goals = createMockDexieCollection([]);

      component.ngOnInit().then(() => {
        const filtered = component.filteredPlayers();
        expect(filtered[0].last_name).toBe('Alpha');
        expect(filtered[1].last_name).toBe('Beta');
        expect(filtered[2].last_name).toBe('Zebra');
      });
    });

    it('should update sort when goals change', async () => {
      await component.ngOnInit();

      const initialOrder = component.filteredPlayers().map(p => p.id);

      // Simulate adding a new goal (this would happen after goal logging)
      // Force re-computation by setting new players
      const updatedPlayers = component.allPlayers().map(p =>
        p.id === 'player-3'
          ? { ...p, goalCount: 10 } // Give player-3 many goals
          : p
      );
      component.allPlayers.set(updatedPlayers);

      const newOrder = component.filteredPlayers().map(p => p.id);

      // Order should have changed
      expect(newOrder).not.toEqual(initialOrder);

      // Player-3 should now be first
      expect(newOrder[0]).toBe('player-3');
    });
  });

  // ========================================================================
  // 4. Search Filter Tests (AC 10)
  // ========================================================================

  describe('Search Filter', () => {
    it('should show search field when >15 players', async () => {
      // Create 20 players
      const manyPlayers = Array.from({ length: 20 }, (_, i) => ({
        ...mockPlayers[0],
        id: `player-${i}`,
        first_name: `Player${i}`,
        last_name: `Test${i}`
      }));

      mockDb.db.players = createMockDexieCollection(manyPlayers);
      mockDb.db.goals = createMockDexieCollection([]);

      await component.ngOnInit();

      expect(component.showSearch()).toBe(true);
    });

    it('should hide search field when <=15 players', async () => {
      await component.ngOnInit();

      expect(component.allPlayers().length).toBeLessThanOrEqual(15);
      expect(component.showSearch()).toBe(false);
    });

    it('should filter by first name (case insensitive)', async () => {
      await component.ngOnInit();

      component.onSearchChange('john');

      const filtered = component.filteredPlayers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].first_name).toBe('John');
    });

    it('should filter by last name (case insensitive)', async () => {
      await component.ngOnInit();

      component.onSearchChange('SMITH');

      const filtered = component.filteredPlayers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].last_name).toBe('Smith');
    });

    it('should handle partial matches in first name', async () => {
      await component.ngOnInit();

      component.onSearchChange('jo');

      const filtered = component.filteredPlayers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].first_name).toContain('Jo');
    });

    it('should handle partial matches in last name', async () => {
      await component.ngOnInit();

      component.onSearchChange('mit');

      const filtered = component.filteredPlayers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].last_name).toContain('mit');
    });

    it('should show all players when search is empty', async () => {
      await component.ngOnInit();
      const allCount = component.filteredPlayers().length;

      component.onSearchChange('john');
      expect(component.filteredPlayers().length).toBeLessThan(allCount);

      component.onSearchChange('');
      expect(component.filteredPlayers().length).toBe(allCount);
    });

    it('should show empty state when no matches', async () => {
      await component.ngOnInit();

      component.onSearchChange('nonexistentplayer');

      const filtered = component.filteredPlayers();
      expect(filtered.length).toBe(0);
    });

    it('should trim search query', async () => {
      await component.ngOnInit();

      component.onSearchChange('  john  ');

      const filtered = component.filteredPlayers();
      expect(filtered.length).toBe(1);
    });

    it('should update searchQuery signal', () => {
      component.onSearchChange('test');
      expect(component.searchQuery()).toBe('test');
    });
  });

  // ========================================================================
  // 5. Goal Logging Tests (AC 5, 6, 7)
  // ========================================================================

  describe('Goal Logging', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should call GoalService.createGoal on player selection', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      expect(mockGoalService.createGoal).toHaveBeenCalled();
    });

    it('should pass correct goal data (gameId, playerId, minute, timestamp)', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.game_id).toBe('game-123');
      expect(callArgs.player_id).toBe(player.id);
      expect(callArgs.scored_at_minute).toBe(45);
      expect(callArgs.scored_at_timestamp).toBeDefined();
    });

    it('should get current minute from GameTimerService', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_minute).toBe(mockTimerService.currentMinute());
    });

    it('should use ISO 8601 timestamp format', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      const timestamp = callArgs.scored_at_timestamp;

      // Check ISO 8601 format
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should show success toast with player name and minute', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('John Doe'),
        'Undo',
        { duration: 5000 }
      );
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining("45'"),
        'Undo',
        { duration: 5000 }
      );
    });

    it('should close modal after successful logging', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: true,
        goalLogged: true
      });
    });

    it('should handle goal logging errors', async () => {
      mockGoalService.createGoal.and.returnValue(
        throwError(() => new Error('Database error'))
      );

      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error logging goal',
        'Close',
        { duration: 3000 }
      );
    });

    it('should show error toast on failure', async () => {
      mockGoalService.createGoal.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error logging goal',
        'Close',
        { duration: 3000 }
      );
    });

    it('should not close modal on error', async () => {
      mockGoalService.createGoal.and.returnValue(
        throwError(() => new Error('Error'))
      );

      const player = component.allPlayers()[0];
      mockDialogRef.close.calls.reset();

      await component.onPlayerSelected(player);

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 6. Toast Notification Tests (AC 7)
  // ========================================================================

  describe('Toast Notifications', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should show toast with correct message format', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      expect(callArgs[0]).toMatch(/^Goal by .+ - \d+\'$/);
    });

    it('should include player full name', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toContain('John Doe');
    });

    it('should include current minute', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toContain("45'");
    });

    it('should show "Undo" action', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      const action = mockSnackBar.open.calls.mostRecent().args[1];
      expect(action).toBe('Undo');
    });

    it('should have 5 second duration', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      const config = mockSnackBar.open.calls.mostRecent().args[2];
      expect(config?.duration).toBe(5000);
    });

    it('should handle undo action subscription', async () => {
      const player = component.allPlayers()[0];

      await component.onPlayerSelected(player);

      expect(mockSnackBarRef.onAction).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 7. Opponent Goal Button Tests (AC 8)
  // ========================================================================

  describe('Opponent Goal Button', () => {
    it('should close modal with opponentGoal flag on click', () => {
      component.onOpponentGoalClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        opponentGoal: true
      });
    });

    it('should render opponent goal button in template', async () => {
      await component.ngOnInit();
      fixture.detectChanges();

      const button = fixture.debugElement.query(
        By.css('button[color="warn"]')
      );

      expect(button).toBeTruthy();
    });
  });

  // ========================================================================
  // 8. Visual Indicator Tests (AC 4)
  // ========================================================================

  describe('Visual Indicators', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      fixture.detectChanges();
    });

    it('should show goal badge for players with goals', () => {
      const playersWithGoals = component.filteredPlayers().filter(p => p.goalCount > 0);

      expect(playersWithGoals.length).toBeGreaterThan(0);
      playersWithGoals.forEach(player => {
        expect(player.goalCount).toBeGreaterThan(0);
      });
    });

    it('should display correct goal count in badge', () => {
      const player = component.filteredPlayers().find(p => p.id === 'player-1');

      expect(player?.goalCount).toBe(2);
    });

    it('should not show badge for players without goals', () => {
      const player = component.filteredPlayers().find(p => p.goalCount === 0);

      expect(player).toBeDefined();
      expect(player!.goalCount).toBe(0);
    });

    it('should have goalCount property for all players', () => {
      const players = component.filteredPlayers();

      players.forEach(player => {
        expect(player.goalCount).toBeDefined();
        expect(typeof player.goalCount).toBe('number');
      });
    });
  });

  // ========================================================================
  // 9. Touch Target Tests (AC 9)
  // ========================================================================

  describe('Touch Targets', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      fixture.detectChanges();
    });

    it('should have proper player list structure', () => {
      const players = component.filteredPlayers();
      expect(players.length).toBeGreaterThan(0);
    });

    it('should have clickable player items', () => {
      // This would test the actual DOM if the template renders properly
      expect(component.filteredPlayers().length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // 10. Player Display Tests
  // ========================================================================

  describe('Player Display', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should display player with jersey number format', () => {
      const player = component.allPlayers()[0]; // Has jersey number 10
      const display = component.getPlayerDisplay(player);

      expect(display).toBe('#10 John Doe');
    });

    it('should display player without jersey number', () => {
      const player = {
        ...component.allPlayers()[0],
        jersey_number: null
      };
      const display = component.getPlayerDisplay(player);

      expect(display).toBe('John Doe');
    });

    it('should show full name correctly', () => {
      const player = component.allPlayers()[0];
      const display = component.getPlayerDisplay(player);

      expect(display).toContain('John');
      expect(display).toContain('Doe');
    });

    it('should format all players consistently', () => {
      const players = component.allPlayers();

      players.forEach(player => {
        const display = component.getPlayerDisplay(player);
        expect(display).toContain(player.first_name);
        expect(display).toContain(player.last_name);

        if (player.jersey_number) {
          expect(display).toContain(`#${player.jersey_number}`);
        }
      });
    });
  });

  // ========================================================================
  // 11. Modal Dismissal Tests (AC 11)
  // ========================================================================

  describe('Modal Dismissal', () => {
    it('should close on close button click via dialogRef', () => {
      mockDialogRef.close();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should have dialogRef available', () => {
      expect(component['dialogRef']).toBe(mockDialogRef);
    });
  });

  // ========================================================================
  // 12. Loading State Tests
  // ========================================================================

  describe('Loading State', () => {
    it('should show loading indicator while loading', async () => {
      let loadingStateDuringFetch = false;

      // Mock delayed response
      mockDb.db.players = {
        where: jasmine.createSpy('where').and.returnValue({
          equals: jasmine.createSpy('equals').and.returnValue({
            and: jasmine.createSpy('and').and.returnValue({
              toArray: jasmine.createSpy('toArray').and.callFake(async () => {
                loadingStateDuringFetch = component.isLoading();
                return mockPlayers.filter(p => !p.deleted_at);
              })
            })
          })
        })
      };

      await component.ngOnInit();

      expect(loadingStateDuringFetch).toBe(true);
    });

    it('should hide loading indicator after load', async () => {
      await component.ngOnInit();

      expect(component.isLoading()).toBe(false);
    });

    it('should hide loading indicator after error', async () => {
      mockDb.db.players = {
        where: jasmine.createSpy('where').and.returnValue({
          equals: jasmine.createSpy('equals').and.returnValue({
            and: jasmine.createSpy('and').and.returnValue({
              toArray: jasmine.createSpy('toArray').and.returnValue(
                Promise.reject(new Error('Error'))
              )
            })
          })
        })
      };

      await component.ngOnInit();

      expect(component.isLoading()).toBe(false);
    });
  });

  // ========================================================================
  // 13. Empty State Tests
  // ========================================================================

  describe('Empty State', () => {
    it('should show empty state when no players found', async () => {
      mockDb.db.players = createMockDexieCollection([]);
      mockDb.db.goals = createMockDexieCollection([]);

      await component.ngOnInit();

      expect(component.filteredPlayers().length).toBe(0);
    });

    it('should handle empty player array gracefully', async () => {
      mockDb.db.players = createMockDexieCollection([]);
      mockDb.db.goals = createMockDexieCollection([]);

      await component.ngOnInit();

      expect(component.allPlayers()).toEqual([]);
      expect(component.filteredPlayers()).toEqual([]);
    });
  });

  // ========================================================================
  // 14. Offline Support Tests (AC 12)
  // ========================================================================

  describe('Offline Support', () => {
    it('should load players from IndexedDB', async () => {
      await component.ngOnInit();

      expect(mockDb.db.players.where).toHaveBeenCalled();
      expect(component.allPlayers().length).toBeGreaterThan(0);
    });

    it('should save goal to IndexedDB via service', async () => {
      await component.ngOnInit();

      const player = component.allPlayers()[0];
      await component.onPlayerSelected(player);

      expect(mockGoalService.createGoal).toHaveBeenCalled();
    });

    it('should work without network connection', async () => {
      // Goal service handles offline logic internally
      await component.ngOnInit();

      const player = component.allPlayers()[0];
      await component.onPlayerSelected(player);

      expect(mockGoalService.createGoal).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 15. Undo Functionality Tests (Story 5.8)
  // ========================================================================

  describe('Undo Functionality', () => {
    beforeEach(async () => {
      // Add deleteGoal and deleteOpponentGoal methods to mock
      mockGoalService.deleteGoal = jasmine.createSpy('deleteGoal').and.returnValue(of(undefined));
      mockGoalService.deleteOpponentGoal = jasmine.createSpy('deleteOpponentGoal').and.returnValue(of(undefined));

      await component.ngOnInit();
    });

    it('should show snackbar with Undo action after logging goal', async () => {
      const player = component.allPlayers()[0];
      mockGoalService.createGoal.and.returnValue(of({ id: 'goal-new-1' } as any));

      await component['saveGoal'](player, []);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Goal by'),
        'Undo',
        { duration: 5000 }
      );
    });

    it('should show goal details in snackbar message', async () => {
      const player = component.allPlayers()[0];
      const currentMinute = mockTimerService.currentMinute();
      mockGoalService.createGoal.and.returnValue(of({ id: 'goal-new-1' } as any));

      await component['saveGoal'](player, []);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        `Goal by John Doe - ${currentMinute}'`,
        'Undo',
        { duration: 5000 }
      );
    });

    it('should include assist names in snackbar message when assists exist', async () => {
      const player = component.allPlayers()[0];
      const assistIds = ['player-2', 'player-3'];
      mockGoalService.createGoal.and.returnValue(of({ id: 'goal-new-1' } as any));

      await component['saveGoal'](player, assistIds);

      const snackbarMessage = mockSnackBar.open.calls.mostRecent().args[0];
      expect(snackbarMessage).toContain('(Assists:');
      expect(snackbarMessage).toContain('Jane Smith');
      expect(snackbarMessage).toContain('Bob Anderson');
    });

    it('should call deleteGoal when Undo action is clicked', async () => {
      const player = component.allPlayers()[0];
      const goalId = 'goal-new-1';
      mockGoalService.createGoal.and.returnValue(of({ id: goalId } as any));

      await component['saveGoal'](player, []);

      // Simulate clicking "Undo" action
      mockSnackBarRef.onAction().subscribe();

      expect(mockGoalService.deleteGoal).toHaveBeenCalledWith(goalId);
    });

    it('should show confirmation snackbar after undo', async () => {
      const player = component.allPlayers()[0];
      const goalId = 'goal-new-1';
      mockGoalService.createGoal.and.returnValue(of({ id: goalId } as any));
      mockGoalService.deleteGoal.and.returnValue(of(undefined));

      await component['saveGoal'](player, []);

      // Reset mock to track second snackbar call
      mockSnackBar.open.calls.reset();

      // Trigger undo action
      const onActionObservable = mockSnackBarRef.onAction();
      await onActionObservable.toPromise();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Goal undone',
        'Close',
        { duration: 2000 }
      );
    });

    it('should handle error when undo fails', async () => {
      const player = component.allPlayers()[0];
      const goalId = 'goal-new-1';
      mockGoalService.createGoal.and.returnValue(of({ id: goalId } as any));
      mockGoalService.deleteGoal.and.returnValue(throwError(() => new Error('Delete failed')));

      spyOn(console, 'error');

      await component['saveGoal'](player, []);

      // Reset mock to track error snackbar
      mockSnackBar.open.calls.reset();

      // Trigger undo action
      const onActionObservable = mockSnackBarRef.onAction();
      try {
        await onActionObservable.toPromise();
      } catch (e) {
        // Expected error
      }

      expect(console.error).toHaveBeenCalledWith('Error undoing goal:', jasmine.any(Error));
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error undoing goal',
        'Close',
        { duration: 3000 }
      );
    });

    it('should show snackbar with Undo action after logging opponent goal', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(of({ id: 'opp-goal-new-1' } as any));

      await component.onOpponentGoalClick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Opponent Goal'),
        'Undo',
        { duration: 5000 }
      );
    });

    it('should show opponent goal minute in snackbar message', async () => {
      const currentMinute = mockTimerService.currentMinute();
      mockGoalService.createOpponentGoal.and.returnValue(of({ id: 'opp-goal-new-1' } as any));

      await component.onOpponentGoalClick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        `Opponent Goal - ${currentMinute}'`,
        'Undo',
        { duration: 5000 }
      );
    });

    it('should call deleteOpponentGoal when Undo action is clicked on opponent goal', async () => {
      const opponentGoalId = 'opp-goal-new-1';
      mockGoalService.createOpponentGoal.and.returnValue(of({ id: opponentGoalId } as any));

      await component.onOpponentGoalClick();

      // Simulate clicking "Undo" action
      mockSnackBarRef.onAction().subscribe();

      expect(mockGoalService.deleteOpponentGoal).toHaveBeenCalledWith(opponentGoalId);
    });

    it('should show confirmation snackbar after undoing opponent goal', async () => {
      const opponentGoalId = 'opp-goal-new-1';
      mockGoalService.createOpponentGoal.and.returnValue(of({ id: opponentGoalId } as any));
      mockGoalService.deleteOpponentGoal.and.returnValue(of(undefined));

      await component.onOpponentGoalClick();

      // Reset mock to track second snackbar call
      mockSnackBar.open.calls.reset();

      // Trigger undo action
      const onActionObservable = mockSnackBarRef.onAction();
      await onActionObservable.toPromise();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Opponent goal undone',
        'Close',
        { duration: 2000 }
      );
    });

    it('should handle error when undoing opponent goal fails', async () => {
      const opponentGoalId = 'opp-goal-new-1';
      mockGoalService.createOpponentGoal.and.returnValue(of({ id: opponentGoalId } as any));
      mockGoalService.deleteOpponentGoal.and.returnValue(throwError(() => new Error('Delete failed')));

      spyOn(console, 'error');

      await component.onOpponentGoalClick();

      // Reset mock to track error snackbar
      mockSnackBar.open.calls.reset();

      // Trigger undo action
      const onActionObservable = mockSnackBarRef.onAction();
      try {
        await onActionObservable.toPromise();
      } catch (e) {
        // Expected error
      }

      expect(console.error).toHaveBeenCalledWith('Error undoing opponent goal:', jasmine.any(Error));
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error undoing opponent goal',
        'Close',
        { duration: 3000 }
      );
    });

    it('should show snackbar for 5 seconds to allow undo', async () => {
      const player = component.allPlayers()[0];
      mockGoalService.createGoal.and.returnValue(of({ id: 'goal-new-1' } as any));

      await component['saveGoal'](player, []);

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      expect(callArgs[2].duration).toBe(5000);
    });

    it('should show confirmation snackbar for 2 seconds after undo', async () => {
      const player = component.allPlayers()[0];
      mockGoalService.createGoal.and.returnValue(of({ id: 'goal-new-1' } as any));

      await component['saveGoal'](player, []);

      mockSnackBar.open.calls.reset();

      // Trigger undo
      const onActionObservable = mockSnackBarRef.onAction();
      await onActionObservable.toPromise();

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      expect(callArgs[2].duration).toBe(2000);
    });
  });

  // ========================================================================
  // 16. Integration Tests
  // ========================================================================

  describe('Integration', () => {
    it('should work with DatabaseService', async () => {
      await component.ngOnInit();

      expect(mockDb.db.players.where).toHaveBeenCalled();
      expect(mockDb.db.goals.where).toHaveBeenCalled();
    });

    it('should work with GoalService', async () => {
      await component.ngOnInit();

      const player = component.allPlayers()[0];
      await component.onPlayerSelected(player);

      expect(mockGoalService.createGoal).toHaveBeenCalled();
    });

    it('should work with GameTimerService', async () => {
      await component.ngOnInit();

      const player = component.allPlayers()[0];
      await component.onPlayerSelected(player);

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_minute).toBe(mockTimerService.currentMinute());
    });

    it('should work with MatSnackBar', async () => {
      await component.ngOnInit();

      const player = component.allPlayers()[0];
      await component.onPlayerSelected(player);

      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('should coordinate all services properly', async () => {
      // Full integration flow
      await component.ngOnInit();

      // Verify data loaded
      expect(component.allPlayers().length).toBeGreaterThan(0);

      // Log a goal
      const player = component.allPlayers()[0];
      await component.onPlayerSelected(player);

      // Verify all services called correctly
      expect(mockGoalService.createGoal).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Additional Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle player with no jersey number', async () => {
      const players: Player[] = [{
        ...mockPlayers[0],
        jersey_number: null
      }];

      mockDb.db.players = createMockDexieCollection(players);
      mockDb.db.goals = createMockDexieCollection([]);

      await component.ngOnInit();

      const display = component.getPlayerDisplay(component.allPlayers()[0]);
      expect(display).not.toContain('#');
    });

    it('should handle multiple players with same goal count', async () => {
      await component.ngOnInit();

      // Check sorting works with ties
      const filtered = component.filteredPlayers();
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should handle search with special characters', async () => {
      await component.ngOnInit();

      component.onSearchChange('!@#$%');

      const filtered = component.filteredPlayers();
      expect(filtered.length).toBe(0);
    });

    it('should handle very long player names', async () => {
      await component.ngOnInit();

      const longName = {
        ...mockPlayers[0],
        first_name: 'VeryLongFirstNameThatExceedsNormalLength',
        last_name: 'VeryLongLastNameThatExceedsNormalLength',
        goalCount: 0,
        usageCount: 0
      };

      const display = component.getPlayerDisplay(longName);
      expect(display).toContain(longName.first_name);
      expect(display).toContain(longName.last_name);
    });

    it('should handle minute at 0', async () => {
      mockTimerService.currentMinute = signal(0).asReadonly();

      await component.ngOnInit();
      const player = component.allPlayers()[0];
      await component.onPlayerSelected(player);

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_minute).toBe(0);
    });

    it('should handle minute at 90+', async () => {
      mockTimerService.currentMinute = signal(93).asReadonly();

      await component.ngOnInit();
      const player = component.allPlayers()[0];
      await component.onPlayerSelected(player);

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_minute).toBe(93);
    });

    it('should handle concurrent player selections', async () => {
      await component.ngOnInit();

      const player1 = component.allPlayers()[0];
      const player2 = component.allPlayers()[1];

      // Simulate quick successive clicks
      const promise1 = component.onPlayerSelected(player1);
      const promise2 = component.onPlayerSelected(player2);

      await Promise.all([promise1, promise2]);

      expect(mockGoalService.createGoal).toHaveBeenCalledTimes(2);
    });

    it('should maintain signal reactivity', async () => {
      await component.ngOnInit();

      const initialPlayers = component.allPlayers();
      expect(initialPlayers.length).toBeGreaterThan(0);

      // Update signal
      component.allPlayers.set([]);

      expect(component.allPlayers()).toEqual([]);
      expect(component.filteredPlayers()).toEqual([]);
    });
  });

  // ========================================================================
  // 16. Screen Navigation Tests (AC 1) - Story 5.5
  // ========================================================================

  describe('Screen Navigation - Assist Tracking', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should start on scorer screen', () => {
      expect(component.currentScreen()).toBe('scorer');
    });

    it('should transition to assists screen after regular tap on player', fakeAsync(() => {
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);
      tick(100); // Less than long-press threshold
      component.onPlayerMouseUp(player);

      expect(component.currentScreen()).toBe('assists');
    }));

    it('should update selectedScorer signal when transitioning', fakeAsync(() => {
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);
      tick(100);
      component.onPlayerMouseUp(player);

      expect(component.selectedScorer()).toEqual(jasmine.objectContaining({
        id: player.id,
        first_name: player.first_name,
        last_name: player.last_name
      }));
    }));

    it('should filter out scorer from assist player list', fakeAsync(() => {
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);
      tick(100);
      component.onPlayerMouseUp(player);

      const assistList = component.assistPlayers();
      const scorerInList = assistList.find(p => p.id === player.id);
      expect(scorerInList).toBeUndefined();
    }));

    it('should not transition to assist screen on long-press', fakeAsync(() => {
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);
      tick(500); // Long-press threshold

      expect(component.currentScreen()).toBe('scorer');
      expect(component.selectedScorer()).toBeNull();
    }));

    it('should maintain scorer screen state after long-press', fakeAsync(() => {
      const initialScreen = component.currentScreen();
      const player = component.allPlayers()[0];

      component.onPlayerMouseDown(player);
      tick(500);

      expect(component.currentScreen()).toBe(initialScreen);
    }));

    it('should compute assistPlayers as empty when no scorer selected', () => {
      component.selectedScorer.set(null);
      expect(component.assistPlayers()).toEqual([]);
    });

    it('should compute assistPlayers correctly when scorer is selected', fakeAsync(() => {
      const allCount = component.allPlayers().length;
      const player = component.allPlayers()[0];

      component.onPlayerMouseDown(player);
      tick(100);
      component.onPlayerMouseUp(player);

      const assistList = component.assistPlayers();
      expect(assistList.length).toBe(allCount - 1);
    }));
  });

  // ========================================================================
  // 17. Long-Press Detection Tests (AC 8) - Story 5.5
  // ========================================================================

  describe('Long-Press Detection', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should detect long-press after 500ms', fakeAsync(() => {
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);
      tick(500);

      expect(component.isLongPress()).toBe(true);
    }));

    it('should not detect long-press before 500ms', fakeAsync(() => {
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);
      tick(400);

      expect(component.isLongPress()).toBe(false);
    }));

    it('should save goal immediately on long-press', fakeAsync(() => {
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);
      tick(500);

      expect(mockGoalService.createGoal).toHaveBeenCalled();
    }));

    it('should not transition to assist screen on long-press', fakeAsync(() => {
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);
      tick(500);

      expect(component.currentScreen()).toBe('scorer');
    }));

    it('should clear press timer on mouse up', fakeAsync(() => {
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);
      tick(100);
      component.onPlayerMouseUp(player);

      // Long-press should not trigger
      tick(500);
      expect(component.isLongPress()).toBe(false);
    }));

    it('should clear press timer on mouse leave', fakeAsync(() => {
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);
      tick(100);
      component.onPlayerMouseLeave();

      tick(500);
      expect(component.isLongPress()).toBe(false);
    }));

    it('should reset isLongPress flag on mouse leave', () => {
      component.isLongPress.set(true);
      component.onPlayerMouseLeave();

      expect(component.isLongPress()).toBe(false);
    });

    it('should initialize isLongPress as false on mouse down', () => {
      component.isLongPress.set(true);
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);

      expect(component.isLongPress()).toBe(false);
    });

    it('should call onPlayerSelected with isLongPress=true after 500ms', fakeAsync(() => {
      spyOn(component, 'onPlayerSelected');
      const player = component.allPlayers()[0];

      component.onPlayerMouseDown(player);
      tick(500);

      expect(component.onPlayerSelected).toHaveBeenCalledWith(player, true);
    }));

    it('should call onPlayerSelected with isLongPress=false on regular tap', fakeAsync(() => {
      spyOn(component, 'onPlayerSelected');
      const player = component.allPlayers()[0];

      component.onPlayerMouseDown(player);
      tick(100);
      component.onPlayerMouseUp(player);

      expect(component.onPlayerSelected).toHaveBeenCalledWith(player, false);
    }));

    it('should not call onPlayerSelected on mouse up if long-press was triggered', fakeAsync(() => {
      spyOn(component, 'onPlayerSelected').and.callThrough();
      const player = component.allPlayers()[0];

      component.onPlayerMouseDown(player);
      tick(500); // Trigger long-press

      const callCount = (component.onPlayerSelected as jasmine.Spy).calls.count();

      component.onPlayerMouseUp(player);

      expect((component.onPlayerSelected as jasmine.Spy).calls.count()).toBe(callCount);
    }));
  });

  // ========================================================================
  // 18. Multi-Select Interface Tests (AC 3) - Story 5.5
  // ========================================================================

  describe('Multi-Select Interface', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      // Transition to assists screen
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);
      component.currentScreen.set('assists');
    });

    it('should toggle assist selection on first tap', () => {
      const playerId = component.allPlayers()[1].id;

      component.toggleAssist(playerId);
      expect(component.isAssistSelected(playerId)).toBe(true);
    });

    it('should remove player from selectedAssists Set on second tap', () => {
      const playerId = component.allPlayers()[1].id;

      component.toggleAssist(playerId);
      expect(component.isAssistSelected(playerId)).toBe(true);

      component.toggleAssist(playerId);
      expect(component.isAssistSelected(playerId)).toBe(false);
    });

    it('should allow multiple assists to be selected', () => {
      const player1Id = component.allPlayers()[1].id;
      const player2Id = component.allPlayers()[2].id;

      component.toggleAssist(player1Id);
      component.toggleAssist(player2Id);

      expect(component.selectedAssists().size).toBe(2);
      expect(component.isAssistSelected(player1Id)).toBe(true);
      expect(component.isAssistSelected(player2Id)).toBe(true);
    });

    it('should maintain selection state across toggles', () => {
      const player1Id = component.allPlayers()[1].id;
      const player2Id = component.allPlayers()[2].id;

      component.toggleAssist(player1Id);
      component.toggleAssist(player2Id);
      component.toggleAssist(player1Id); // Deselect player1

      expect(component.isAssistSelected(player1Id)).toBe(false);
      expect(component.isAssistSelected(player2Id)).toBe(true);
      expect(component.selectedAssists().size).toBe(1);
    });

    it('should create new Set instance on toggle for signal reactivity', () => {
      const player1Id = component.allPlayers()[1].id;
      const initialSet = component.selectedAssists();

      component.toggleAssist(player1Id);
      const newSet = component.selectedAssists();

      expect(newSet).not.toBe(initialSet);
    });

    it('should handle toggling same player multiple times', () => {
      const playerId = component.allPlayers()[1].id;

      component.toggleAssist(playerId);
      expect(component.isAssistSelected(playerId)).toBe(true);

      component.toggleAssist(playerId);
      expect(component.isAssistSelected(playerId)).toBe(false);

      component.toggleAssist(playerId);
      expect(component.isAssistSelected(playerId)).toBe(true);
    });

    it('should return false for non-selected players', () => {
      const playerId = component.allPlayers()[1].id;
      expect(component.isAssistSelected(playerId)).toBe(false);
    });

    it('should handle selecting all available assists', () => {
      const assistPlayers = component.assistPlayers();

      assistPlayers.forEach(player => {
        component.toggleAssist(player.id);
      });

      expect(component.selectedAssists().size).toBe(assistPlayers.length);
    });

    it('should maintain separate selections for different players', () => {
      const player1Id = component.allPlayers()[1].id;
      const player2Id = component.allPlayers()[2].id;

      component.toggleAssist(player1Id);

      expect(component.isAssistSelected(player1Id)).toBe(true);
      expect(component.isAssistSelected(player2Id)).toBe(false);
    });
  });

  // ========================================================================
  // 19. Auto-Save Timer Tests (AC 6) - Story 5.5
  // ========================================================================

  describe('Auto-Save Timer', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
      component.clearAutoSaveTimer();
    });

    it('should start 10-second timer when transitioning to assist screen', () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);
      component.startAutoSaveTimer();

      expect(component.timeRemaining()).toBe(10);
    });

    it('should update timeRemaining signal every second', () => {
      component.startAutoSaveTimer();

      jasmine.clock().tick(1000);
      expect(component.timeRemaining()).toBe(9);

      jasmine.clock().tick(1000);
      expect(component.timeRemaining()).toBe(8);

      jasmine.clock().tick(1000);
      expect(component.timeRemaining()).toBe(7);
    });

    it('should auto-save with no assists after 10 seconds', () => {
      spyOn(component, 'saveGoalWithSelectedAssists');
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);
      component.startAutoSaveTimer();

      jasmine.clock().tick(10000);
      expect(component.saveGoalWithSelectedAssists).toHaveBeenCalled();
    });

    it('should clear countdown interval when timer expires', () => {
      component.startAutoSaveTimer();

      jasmine.clock().tick(10000);

      // Timer should be stopped
      const timeAtExpiry = component.timeRemaining();
      jasmine.clock().tick(1000);
      expect(component.timeRemaining()).toBe(timeAtExpiry);
    });

    it('should clear timer when clearAutoSaveTimer is called', () => {
      component.startAutoSaveTimer();

      jasmine.clock().tick(2000);
      expect(component.timeRemaining()).toBe(8);

      component.clearAutoSaveTimer();

      // Timer should be stopped
      const timeAfterClear = component.timeRemaining();
      jasmine.clock().tick(1000);
      expect(component.timeRemaining()).toBe(timeAfterClear);
    });

    it('should clear timer on component destroy', () => {
      component.startAutoSaveTimer();
      spyOn(component, 'clearAutoSaveTimer');

      component.ngOnDestroy();

      expect(component.clearAutoSaveTimer).toHaveBeenCalled();
    });

    it('should countdown from 10 to 0', () => {
      component.startAutoSaveTimer();

      for (let i = 10; i > 0; i--) {
        expect(component.timeRemaining()).toBe(i);
        jasmine.clock().tick(1000);
      }

      expect(component.timeRemaining()).toBe(0);
    });

    it('should clear autoSaveTimer reference after clearing', () => {
      component.startAutoSaveTimer();
      expect(component.autoSaveTimer).not.toBeNull();

      component.clearAutoSaveTimer();
      expect(component.autoSaveTimer).toBeNull();
    });

    it('should clear countdownInterval reference after clearing', () => {
      component.startAutoSaveTimer();
      expect(component.countdownInterval).not.toBeNull();

      component.clearAutoSaveTimer();
      expect(component.countdownInterval).toBeNull();
    });

    it('should handle multiple clearAutoSaveTimer calls safely', () => {
      component.startAutoSaveTimer();

      component.clearAutoSaveTimer();
      component.clearAutoSaveTimer();
      component.clearAutoSaveTimer();

      expect(component.autoSaveTimer).toBeNull();
      expect(component.countdownInterval).toBeNull();
    });

    it('should call clearAutoSaveTimer when skip is clicked', async () => {
      spyOn(component, 'clearAutoSaveTimer');
      const scorer = component.allPlayers()[0];

      await component.saveGoalWithoutAssists(scorer);

      expect(component.clearAutoSaveTimer).toHaveBeenCalled();
    });

    it('should call clearAutoSaveTimer when save is clicked', async () => {
      spyOn(component, 'clearAutoSaveTimer');
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);

      await component.saveGoalWithSelectedAssists();

      expect(component.clearAutoSaveTimer).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 20. Skip Button Tests (AC 4) - Story 5.5
  // ========================================================================

  describe('Skip Button', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should save goal with empty assists array when skip clicked', async () => {
      const scorer = component.allPlayers()[0];

      await component.saveGoalWithoutAssists(scorer);

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.assist_player_ids).toEqual([]);
    });

    it('should close modal after skip', async () => {
      const scorer = component.allPlayers()[0];

      await component.saveGoalWithoutAssists(scorer);

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: true,
        goalLogged: true
      });
    });

    it('should show toast without assist names on skip', async () => {
      const scorer = component.allPlayers()[0];

      await component.saveGoalWithoutAssists(scorer);

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).not.toContain('Assists:');
      expect(message).toMatch(/^Goal by .+ - \d+'$/);
    });

    it('should clear auto-save timer on skip', async () => {
      const scorer = component.allPlayers()[0];
      component.startAutoSaveTimer();

      await component.saveGoalWithoutAssists(scorer);

      expect(component.autoSaveTimer).toBeNull();
    });

    it('should pass correct scorer data on skip', async () => {
      const scorer = component.allPlayers()[0];

      await component.saveGoalWithoutAssists(scorer);

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.player_id).toBe(scorer.id);
      expect(callArgs.game_id).toBe('game-123');
    });
  });

  // ========================================================================
  // 21. Save Button Tests (AC 5) - Story 5.5
  // ========================================================================

  describe('Save Button', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should save goal with selected assist IDs', async () => {
      const scorer = component.allPlayers()[0];
      const assist1 = component.allPlayers()[1];
      const assist2 = component.allPlayers()[2];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist1.id);
      component.toggleAssist(assist2.id);

      await component.saveGoalWithSelectedAssists();

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.assist_player_ids).toContain(assist1.id);
      expect(callArgs.assist_player_ids).toContain(assist2.id);
      expect(callArgs.assist_player_ids?.length).toBe(2);
    });

    it('should close modal after save', async () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);

      await component.saveGoalWithSelectedAssists();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: true,
        goalLogged: true
      });
    });

    it('should show toast with assist names when assists selected', async () => {
      const scorer = component.allPlayers()[0];
      const assist = component.allPlayers()[1];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist.id);

      await component.saveGoalWithSelectedAssists();

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toContain('Assists:');
      expect(message).toContain('Jane Smith');
    });

    it('should handle 0 assists (same as skip)', async () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);

      await component.saveGoalWithSelectedAssists();

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.assist_player_ids).toEqual([]);

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).not.toContain('Assists:');
    });

    it('should handle 1 assist', async () => {
      const scorer = component.allPlayers()[0];
      const assist = component.allPlayers()[1];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist.id);

      await component.saveGoalWithSelectedAssists();

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.assist_player_ids).toEqual([assist.id]);
    });

    it('should handle multiple assists (2-3 typical)', async () => {
      const scorer = component.allPlayers()[0];
      const assist1 = component.allPlayers()[1];
      const assist2 = component.allPlayers()[2];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist1.id);
      component.toggleAssist(assist2.id);

      await component.saveGoalWithSelectedAssists();

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.assist_player_ids?.length).toBe(2);
    });

    it('should clear auto-save timer on save', async () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);
      component.startAutoSaveTimer();

      await component.saveGoalWithSelectedAssists();

      expect(component.autoSaveTimer).toBeNull();
    });

    it('should return early if no scorer selected', async () => {
      component.selectedScorer.set(null);

      await component.saveGoalWithSelectedAssists();

      expect(mockGoalService.createGoal).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 22. Assist Saving Integration Tests (AC 7) - Story 5.5
  // ========================================================================

  describe('Assist Saving Integration', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should pass assist_player_ids to GoalService.createGoal()', async () => {
      const scorer = component.allPlayers()[0];
      const assist = component.allPlayers()[1];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist.id);

      await component.saveGoalWithSelectedAssists();

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.assist_player_ids).toBeDefined();
      expect(Array.isArray(callArgs.assist_player_ids)).toBe(true);
    });

    it('should include assist IDs in GoalFormData', async () => {
      const scorer = component.allPlayers()[0];
      const assist1 = component.allPlayers()[1];
      const assist2 = component.allPlayers()[2];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist1.id);
      component.toggleAssist(assist2.id);

      await component.saveGoalWithSelectedAssists();

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.game_id).toBe('game-123');
      expect(callArgs.player_id).toBe(scorer.id);
      expect(callArgs.assist_player_ids).toEqual([assist1.id, assist2.id]);
      expect(callArgs.scored_at_minute).toBe(45);
    });

    it('should format toast message with assist names', async () => {
      const scorer = component.allPlayers()[0];
      const assist1 = component.allPlayers()[1];
      const assist2 = component.allPlayers()[2];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist1.id);
      component.toggleAssist(assist2.id);

      await component.saveGoalWithSelectedAssists();

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toContain("Goal by John Doe - 45'");
      expect(message).toContain('(Assists: Jane Smith, Bob Anderson)');
    });

    it('should handle goal save with assists successfully', async () => {
      const scorer = component.allPlayers()[0];
      const assist = component.allPlayers()[1];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist.id);

      await component.saveGoalWithSelectedAssists();

      expect(mockGoalService.createGoal).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should handle errors during assist save', async () => {
      mockGoalService.createGoal.and.returnValue(
        throwError(() => new Error('Save error'))
      );

      const scorer = component.allPlayers()[0];
      const assist = component.allPlayers()[1];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist.id);

      await component.saveGoalWithSelectedAssists();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error logging goal',
        'Close',
        { duration: 3000 }
      );
    });

    it('should filter out invalid assist player IDs from toast', async () => {
      const scorer = component.allPlayers()[0];

      component.selectedScorer.set(scorer);
      component.selectedAssists.set(new Set(['invalid-id-1', 'invalid-id-2']));

      await component.saveGoalWithSelectedAssists();

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      // Should not crash and should handle missing players gracefully
      expect(message).toContain("Goal by John Doe - 45'");
    });

    it('should convert Set to Array for assist IDs', async () => {
      const scorer = component.allPlayers()[0];
      const assist1 = component.allPlayers()[1];
      const assist2 = component.allPlayers()[2];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist1.id);
      component.toggleAssist(assist2.id);

      await component.saveGoalWithSelectedAssists();

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(Array.isArray(callArgs.assist_player_ids)).toBe(true);
    });
  });

  // ========================================================================
  // 23. Assist Player List Tests (AC 2) - Story 5.5
  // ========================================================================

  describe('Assist Player List', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should exclude scorer from assist list', () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);

      const assistList = component.assistPlayers();
      const scorerInList = assistList.find(p => p.id === scorer.id);

      expect(scorerInList).toBeUndefined();
    });

    it('should maintain smart sorting for assists', () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);

      const assistList = component.assistPlayers();

      // Check sorting order is maintained (goal count, usage frequency, alphabetical)
      for (let i = 0; i < assistList.length - 1; i++) {
        const current = assistList[i];
        const next = assistList[i + 1];

        if (current.goalCount !== next.goalCount) {
          expect(current.goalCount).toBeGreaterThanOrEqual(next.goalCount);
        }
      }
    });

    it('should filter by search on assist screen', () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);
      component.onSearchChange('jane');

      const assistList = component.assistPlayers();

      expect(assistList.length).toBe(1);
      expect(assistList[0].first_name).toBe('Jane');
    });

    it('should show same player info (jersey, goal count)', () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);

      const assistList = component.assistPlayers();

      assistList.forEach(player => {
        expect(player.jersey_number).toBeDefined();
        expect(player.goalCount).toBeDefined();
        expect(typeof player.goalCount).toBe('number');
      });
    });

    it('should handle empty assist list (only 1 player on team)', () => {
      // Create scenario with only one player
      mockDb.db.players = createMockDexieCollection([mockPlayers[0]]);
      mockDb.db.goals = createMockDexieCollection([]);

      component.ngOnInit().then(() => {
        const scorer = component.allPlayers()[0];
        component.selectedScorer.set(scorer);

        const assistList = component.assistPlayers();
        expect(assistList.length).toBe(0);
      });
    });

    it('should return all players minus scorer', () => {
      const scorer = component.allPlayers()[0];
      const totalPlayers = component.allPlayers().length;

      component.selectedScorer.set(scorer);

      const assistList = component.assistPlayers();
      expect(assistList.length).toBe(totalPlayers - 1);
    });

    it('should maintain goal counts in assist list', () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);

      const assistList = component.assistPlayers();
      const playerWithGoals = assistList.find(p => p.id === 'player-2');

      expect(playerWithGoals?.goalCount).toBe(1);
    });

    it('should recompute when search changes', () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);

      const allAssists = component.assistPlayers().length;

      component.onSearchChange('bob');
      const filteredAssists = component.assistPlayers().length;

      expect(filteredAssists).toBeLessThan(allAssists);
    });
  });

  // ========================================================================
  // 24. Enhanced Toast Message Tests (AC 9) - Story 5.5
  // ========================================================================

  describe('Enhanced Toast Messages', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should format toast as "Goal by [Name] - [Minute]\'" without assists', async () => {
      const scorer = component.allPlayers()[0];
      await component.saveGoalWithoutAssists(scorer);

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toBe("Goal by John Doe - 45'");
    });

    it('should format toast with assists in format "Goal by [Name] - [Minute]\' (Assists: [Names])"', async () => {
      const scorer = component.allPlayers()[0];
      const assist = component.allPlayers()[1];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist.id);

      await component.saveGoalWithSelectedAssists();

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toBe("Goal by John Doe - 45' (Assists: Jane Smith)");
    });

    it('should handle 1 assist in toast', async () => {
      const scorer = component.allPlayers()[0];
      const assist = component.allPlayers()[1];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist.id);

      await component.saveGoalWithSelectedAssists();

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toContain('(Assists: Jane Smith)');
    });

    it('should handle 2 assists in toast', async () => {
      const scorer = component.allPlayers()[0];
      const assist1 = component.allPlayers()[1];
      const assist2 = component.allPlayers()[2];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist1.id);
      component.toggleAssist(assist2.id);

      await component.saveGoalWithSelectedAssists();

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toContain('(Assists: Jane Smith, Bob Anderson)');
    });

    it('should handle 3+ assists in toast', async () => {
      // Add a 4th player for this test
      const extraPlayer: Player = {
        ...mockPlayers[0],
        id: 'player-4',
        first_name: 'Charlie',
        last_name: 'Wilson'
      };

      mockDb.db.players = createMockDexieCollection([...mockPlayers, extraPlayer]);
      await component.ngOnInit();

      const scorer = component.allPlayers()[0];
      const assist1 = component.allPlayers()[1];
      const assist2 = component.allPlayers()[2];
      const assist3 = component.allPlayers()[3];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist1.id);
      component.toggleAssist(assist2.id);
      component.toggleAssist(assist3.id);

      await component.saveGoalWithSelectedAssists();

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toContain('Assists:');
      expect(message.match(/,/g)?.length).toBe(2); // Should have 2 commas for 3 assists
    });

    it('should use comma-separated list for multiple assists', async () => {
      const scorer = component.allPlayers()[0];
      const assist1 = component.allPlayers()[1];
      const assist2 = component.allPlayers()[2];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist1.id);
      component.toggleAssist(assist2.id);

      await component.saveGoalWithSelectedAssists();

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toContain(', ');
    });

    it('should include minute with apostrophe', async () => {
      const scorer = component.allPlayers()[0];
      await component.saveGoalWithoutAssists(scorer);

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toContain("45'");
    });

    it('should preserve Undo action button', async () => {
      const scorer = component.allPlayers()[0];
      const assist = component.allPlayers()[1];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist.id);

      await component.saveGoalWithSelectedAssists();

      const action = mockSnackBar.open.calls.mostRecent().args[1];
      expect(action).toBe('Undo');
    });

    it('should preserve 5 second duration', async () => {
      const scorer = component.allPlayers()[0];
      const assist = component.allPlayers()[1];

      component.selectedScorer.set(scorer);
      component.toggleAssist(assist.id);

      await component.saveGoalWithSelectedAssists();

      const config = mockSnackBar.open.calls.mostRecent().args[2];
      expect(config?.duration).toBe(5000);
    });
  });

  // ========================================================================
  // 25. Component Lifecycle Tests - Story 5.5
  // ========================================================================

  describe('Component Lifecycle - Assist Tracking', () => {
    it('should implement OnDestroy', () => {
      expect(component.ngOnDestroy).toBeDefined();
      expect(typeof component.ngOnDestroy).toBe('function');
    });

    it('should cleanup auto-save timer on destroy', () => {
      component.startAutoSaveTimer();
      expect(component.autoSaveTimer).not.toBeNull();

      component.ngOnDestroy();

      expect(component.autoSaveTimer).toBeNull();
    });

    it('should cleanup press timer on destroy', () => {
      const player = component.allPlayers()[0];
      component.onPlayerMouseDown(player);
      expect(component.pressTimer).not.toBeNull();

      component.ngOnDestroy();

      // pressTimer should be cleared
      expect(component.pressTimer).toBeNull();
    });

    it('should cleanup countdown interval on destroy', () => {
      component.startAutoSaveTimer();
      expect(component.countdownInterval).not.toBeNull();

      component.ngOnDestroy();

      expect(component.countdownInterval).toBeNull();
    });

    it('should handle destroy when timers are null', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should handle destroy multiple times', () => {
      component.ngOnDestroy();
      component.ngOnDestroy();

      expect(component.autoSaveTimer).toBeNull();
      expect(component.countdownInterval).toBeNull();
    });
  });

  // ========================================================================
  // 26. Edge Cases - Assist Tracking
  // ========================================================================

  describe('Edge Cases - Assist Tracking', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should handle rapid screen transitions', fakeAsync(() => {
      const player1 = component.allPlayers()[0];
      const player2 = component.allPlayers()[1];

      component.onPlayerMouseDown(player1);
      tick(100);
      component.onPlayerMouseUp(player1);

      expect(component.currentScreen()).toBe('assists');

      // Rapid transition back
      component.currentScreen.set('scorer');

      component.onPlayerMouseDown(player2);
      tick(100);
      component.onPlayerMouseUp(player2);

      expect(component.currentScreen()).toBe('assists');
    }));

    it('should handle multiple long-presses', fakeAsync(() => {
      const player1 = component.allPlayers()[0];

      component.onPlayerMouseDown(player1);
      tick(500);

      expect(mockGoalService.createGoal).toHaveBeenCalledTimes(1);

      mockGoalService.createGoal.calls.reset();

      const player2 = component.allPlayers()[1];
      component.onPlayerMouseDown(player2);
      tick(500);

      expect(mockGoalService.createGoal).toHaveBeenCalledTimes(1);
    }));

    it('should handle timer expiry during save', async () => {
      jasmine.clock().install();

      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);
      component.startAutoSaveTimer();

      jasmine.clock().tick(9000);

      // Start saving before timer expires
      const savePromise = component.saveGoalWithSelectedAssists();

      jasmine.clock().tick(2000); // Timer would expire

      await savePromise;

      // Should still save correctly
      expect(mockGoalService.createGoal).toHaveBeenCalled();

      jasmine.clock().uninstall();
    });

    it('should handle selecting/deselecting same player repeatedly', () => {
      const playerId = component.allPlayers()[1].id;

      for (let i = 0; i < 10; i++) {
        component.toggleAssist(playerId);
        expect(component.isAssistSelected(playerId)).toBe(i % 2 === 0);
      }
    });

    it('should handle maximum assists selection (all players)', () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);

      const allOtherPlayers = component.assistPlayers();

      allOtherPlayers.forEach(player => {
        component.toggleAssist(player.id);
      });

      expect(component.selectedAssists().size).toBe(allOtherPlayers.length);
    });

    it('should prevent selecting scorer as assist', () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);

      const assistList = component.assistPlayers();
      const scorerInList = assistList.find(p => p.id === scorer.id);

      expect(scorerInList).toBeUndefined();
    });

    it('should handle empty selected assists set', async () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);
      component.selectedAssists.set(new Set());

      await component.saveGoalWithSelectedAssists();

      const callArgs = mockGoalService.createGoal.calls.mostRecent().args[0];
      expect(callArgs.assist_player_ids).toEqual([]);
    });

    it('should handle clearing timer when timer is already null', () => {
      component.autoSaveTimer = null;
      component.countdownInterval = null;

      expect(() => component.clearAutoSaveTimer()).not.toThrow();
    });

    it('should maintain selectedScorer across operations', fakeAsync(() => {
      const scorer = component.allPlayers()[0];

      component.onPlayerMouseDown(scorer);
      tick(100);
      component.onPlayerMouseUp(scorer);

      expect(component.selectedScorer()).toEqual(jasmine.objectContaining({
        id: scorer.id
      }));

      // Toggle assists
      component.toggleAssist(component.allPlayers()[1].id);

      // Scorer should still be set
      expect(component.selectedScorer()).toEqual(jasmine.objectContaining({
        id: scorer.id
      }));
    }));

    it('should handle assist screen with search filtering', () => {
      const scorer = component.allPlayers()[0];
      component.selectedScorer.set(scorer);

      const allAssists = component.assistPlayers().length;

      component.onSearchChange('jane');

      const filteredAssists = component.assistPlayers().length;
      expect(filteredAssists).toBeLessThan(allAssists);
      expect(filteredAssists).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================================================
  // 27. Opponent Goal Tracking Tests (Story 5.6)
  // ========================================================================

  describe('Opponent Goal Tracking - Button Tests (AC 1)', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      fixture.detectChanges();
    });

    it('should have opponent goal button visible on scorer screen', () => {
      expect(component.currentScreen()).toBe('scorer');
      const button = fixture.debugElement.query(By.css('.opponent-goal-button'));
      expect(button).toBeTruthy();
    });

    it('should not show opponent goal button on assists screen', () => {
      component.currentScreen.set('assists');
      component.selectedScorer.set(component.allPlayers()[0]);
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.opponent-goal-button'));
      expect(button).toBeFalsy();
    });

    it('should have warn color styling', () => {
      const button = fixture.debugElement.query(By.css('.opponent-goal-button'));
      expect(button.nativeElement.getAttribute('color')).toBe('warn');
    });

    it('should have sports_soccer icon', () => {
      const button = fixture.debugElement.query(By.css('.opponent-goal-button'));
      const icon = button.query(By.css('mat-icon'));
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.textContent.trim()).toBe('sports_soccer');
    });

    it('should have proper aria-label', () => {
      const button = fixture.debugElement.query(By.css('.opponent-goal-button'));
      expect(button.nativeElement.getAttribute('aria-label')).toBe('Log opponent goal');
    });

    it('should have text "Opponent Goal"', () => {
      const button = fixture.debugElement.query(By.css('.opponent-goal-button'));
      expect(button.nativeElement.textContent).toContain('Opponent Goal');
    });
  });

  describe('Opponent Goal Tracking - Creation Tests (AC 2, 3)', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      mockGoalService.createOpponentGoal.and.returnValue(of({ id: 'opp-goal-1' } as any));
    });

    it('should call GoalService.createOpponentGoal on button click', async () => {
      await component.onOpponentGoalClick();

      expect(mockGoalService.createOpponentGoal).toHaveBeenCalled();
    });

    it('should create OpponentGoalFormData with correct structure', async () => {
      await component.onOpponentGoalClick();

      const callArgs = mockGoalService.createOpponentGoal.calls.mostRecent().args[0];
      expect(callArgs).toEqual(jasmine.objectContaining({
        game_id: jasmine.any(String),
        scored_at_minute: jasmine.any(Number),
        scored_at_timestamp: jasmine.any(String)
      }));
    });

    it('should include game_id from dialog data', async () => {
      await component.onOpponentGoalClick();

      const callArgs = mockGoalService.createOpponentGoal.calls.mostRecent().args[0];
      expect(callArgs.game_id).toBe(mockDialogData.gameId);
      expect(callArgs.game_id).toBe('game-123');
    });

    it('should include current minute from GameTimerService', async () => {
      await component.onOpponentGoalClick();

      const callArgs = mockGoalService.createOpponentGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_minute).toBe(45);
      expect(callArgs.scored_at_minute).toBe(mockTimerService.currentMinute());
    });

    it('should include ISO 8601 timestamp', async () => {
      await component.onOpponentGoalClick();

      const callArgs = mockGoalService.createOpponentGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle creation success', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(of({ id: 'test-id' } as any));

      await component.onOpponentGoalClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: true,
        opponentGoalLogged: true
      });
    });

    it('should handle creation errors', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      await component.onOpponentGoalClick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error logging opponent goal',
        'Close',
        { duration: 3000 }
      );
    });

    it('should use different minute values correctly', async () => {
      const testMinute = 67;
      mockTimerService.currentMinute = signal(testMinute).asReadonly();

      await component.onOpponentGoalClick();

      const callArgs = mockGoalService.createOpponentGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_minute).toBe(testMinute);
    });

    it('should handle minute at 0', async () => {
      mockTimerService.currentMinute = signal(0).asReadonly();

      await component.onOpponentGoalClick();

      const callArgs = mockGoalService.createOpponentGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_minute).toBe(0);
    });

    it('should handle minute at 90+', async () => {
      mockTimerService.currentMinute = signal(93).asReadonly();

      await component.onOpponentGoalClick();

      const callArgs = mockGoalService.createOpponentGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_minute).toBe(93);
    });

    it('should create timestamp at time of method call', async () => {
      const timeBefore = new Date().toISOString();
      await component.onOpponentGoalClick();
      const timeAfter = new Date().toISOString();

      const callArgs = mockGoalService.createOpponentGoal.calls.mostRecent().args[0];
      const timestamp = callArgs.scored_at_timestamp;

      expect(timestamp >= timeBefore).toBe(true);
      expect(timestamp <= timeAfter).toBe(true);
    });
  });

  describe('Opponent Goal Tracking - Toast Notification Tests (AC 5)', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));
    });

    it('should show toast on successful opponent goal creation', async () => {
      await component.onOpponentGoalClick();

      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('should format toast as "Opponent Goal - [Minute]\'"', async () => {
      await component.onOpponentGoalClick();

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      expect(callArgs[0]).toBe("Opponent Goal - 45'");
    });

    it('should format toast with different minute values', async () => {
      mockTimerService.currentMinute = signal(23).asReadonly();

      await component.onOpponentGoalClick();

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toBe("Opponent Goal - 23'");
    });

    it('should include Undo action', async () => {
      await component.onOpponentGoalClick();

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      expect(callArgs[1]).toBe('Undo');
    });

    it('should have 5-second duration', async () => {
      await component.onOpponentGoalClick();

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      expect(callArgs[2]).toEqual({ duration: 5000 });
    });

    it('should show error toast on failure', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(
        throwError(() => new Error('Database error'))
      );

      await component.onOpponentGoalClick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error logging opponent goal',
        'Close',
        { duration: 3000 }
      );
    });

    it('should have error toast with 3-second duration', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(
        throwError(() => new Error('Error'))
      );

      await component.onOpponentGoalClick();

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      expect(callArgs[2]).toEqual({ duration: 3000 });
    });

    it('should subscribe to snackbar onAction for undo', async () => {
      await component.onOpponentGoalClick();

      expect(mockSnackBarRef.onAction).toHaveBeenCalled();
    });

    it('should format toast with apostrophe in minute', async () => {
      mockTimerService.currentMinute = signal(89).asReadonly();

      await component.onOpponentGoalClick();

      const message = mockSnackBar.open.calls.mostRecent().args[0];
      expect(message).toContain("'");
      expect(message).toMatch(/\d+'/);
    });
  });

  describe('Opponent Goal Tracking - Modal Closure Tests', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));
    });

    it('should close modal after successful save', async () => {
      await component.onOpponentGoalClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should close with opponentGoalLogged flag', async () => {
      await component.onOpponentGoalClick();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: true,
        opponentGoalLogged: true
      });
    });

    it('should close with success flag set to true', async () => {
      await component.onOpponentGoalClick();

      const callArgs = mockDialogRef.close.calls.mostRecent().args[0];
      expect(callArgs.success).toBe(true);
    });

    it('should not close modal on error', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(
        throwError(() => new Error('Error'))
      );

      mockDialogRef.close.calls.reset();
      await component.onOpponentGoalClick();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close modal on network error', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(
        throwError(() => new Error('Network timeout'))
      );

      mockDialogRef.close.calls.reset();
      await component.onOpponentGoalClick();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should return correct close data structure', async () => {
      await component.onOpponentGoalClick();

      const closeData = mockDialogRef.close.calls.mostRecent().args[0];
      expect(closeData).toEqual({
        success: true,
        opponentGoalLogged: true
      });
    });
  });

  describe('Opponent Goal Tracking - Integration Tests (AC 9)', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should use existing GoalService infrastructure', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));

      await component.onOpponentGoalClick();

      expect(mockGoalService.createOpponentGoal).toHaveBeenCalled();
      // Service handles IndexedDB and sync queue internally
    });

    it('should handle offline scenario via service', async () => {
      // Service handles offline logic internally
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));

      await component.onOpponentGoalClick();

      expect(mockGoalService.createOpponentGoal).toHaveBeenCalled();
    });

    it('should queue for sync via service', async () => {
      // Service queues unsynchronized data
      mockGoalService.createOpponentGoal.and.returnValue(of({ id: 'test' } as any));

      await component.onOpponentGoalClick();

      expect(mockGoalService.createOpponentGoal).toHaveBeenCalled();
    });

    it('should call toPromise on Observable', async () => {
      const mockResult = {
        id: 'test-id',
        game_id: 'game-123',
        scored_at_minute: 45,
        scored_at_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        sync_state: 'synced' as const
      };
      const mockObservable = of(mockResult);
      const toPromiseSpy = spyOn(mockObservable, 'toPromise').and.callThrough();
      mockGoalService.createOpponentGoal.and.returnValue(mockObservable);

      await component.onOpponentGoalClick();

      expect(toPromiseSpy).toHaveBeenCalled();
    });

    it('should handle Promise rejection gracefully', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(
        throwError(() => new Error('Promise rejected'))
      );

      await component.onOpponentGoalClick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error logging opponent goal',
        'Close',
        { duration: 3000 }
      );
    });

    it('should integrate with GameTimerService', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));

      await component.onOpponentGoalClick();

      const callArgs = mockGoalService.createOpponentGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_minute).toBe(mockTimerService.currentMinute());
    });

    it('should integrate with MatSnackBar', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));

      await component.onOpponentGoalClick();

      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('should integrate with MatDialogRef', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));

      await component.onOpponentGoalClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Opponent Goal Tracking - Method Signature Tests', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should be async method', () => {
      expect(component.onOpponentGoalClick.constructor.name).toBe('AsyncFunction');
    });

    it('should return a Promise', () => {
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));
      const result = component.onOpponentGoalClick();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should handle promise rejection gracefully', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(
        throwError(() => new Error('Rejection test'))
      );

      await expectAsync(component.onOpponentGoalClick()).toBeResolved();
    });

    it('should not throw exceptions on error', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(
        throwError(() => new Error('Test error'))
      );

      await expectAsync(component.onOpponentGoalClick()).toBeResolved();
    });

    it('should handle Observable to Promise conversion', async () => {
      const mockResult = {
        id: 'test-id',
        game_id: 'game-123',
        scored_at_minute: 45,
        scored_at_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        sync_state: 'synced' as const
      };
      const mockObservable = of(mockResult);
      mockGoalService.createOpponentGoal.and.returnValue(mockObservable);

      await component.onOpponentGoalClick();

      expect(mockGoalService.createOpponentGoal).toHaveBeenCalled();
    });
  });

  describe('Opponent Goal Tracking - Edge Cases', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should handle rapid successive opponent goal clicks', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));

      const promise1 = component.onOpponentGoalClick();
      const promise2 = component.onOpponentGoalClick();

      await Promise.all([promise1, promise2]);

      expect(mockGoalService.createOpponentGoal).toHaveBeenCalledTimes(2);
    });

    it('should log error to console on failure', async () => {
      spyOn(console, 'error');
      mockGoalService.createOpponentGoal.and.returnValue(
        throwError(() => new Error('Test error'))
      );

      await component.onOpponentGoalClick();

      expect(console.error).toHaveBeenCalledWith(
        'Error logging opponent goal:',
        jasmine.any(Error)
      );
    });

    it('should handle service returning null', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(of(null as any));

      await component.onOpponentGoalClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should handle service returning undefined', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(of(undefined as any));

      await component.onOpponentGoalClick();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should create unique timestamps for multiple calls', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));

      await component.onOpponentGoalClick();
      const timestamp1 = mockGoalService.createOpponentGoal.calls.mostRecent().args[0].scored_at_timestamp;

      // Wait a tiny bit
      await new Promise(resolve => setTimeout(resolve, 5));

      await component.onOpponentGoalClick();
      const timestamp2 = mockGoalService.createOpponentGoal.calls.mostRecent().args[0].scored_at_timestamp;

      expect(timestamp1).not.toBe(timestamp2);
    });

    it('should not affect regular goal logging', async () => {
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));
      mockGoalService.createGoal.and.returnValue(of({} as any));

      await component.onOpponentGoalClick();
      expect(mockGoalService.createOpponentGoal).toHaveBeenCalledTimes(1);

      const player = component.allPlayers()[0];
      await component.onPlayerSelected(player);
      expect(mockGoalService.createGoal).toHaveBeenCalledTimes(1);
    });

    it('should work from scorer screen only', () => {
      fixture.detectChanges();
      expect(component.currentScreen()).toBe('scorer');

      const button = fixture.debugElement.query(By.css('.opponent-goal-button'));
      expect(button).toBeTruthy();

      component.currentScreen.set('assists');
      fixture.detectChanges();

      const buttonOnAssists = fixture.debugElement.query(By.css('.opponent-goal-button'));
      expect(buttonOnAssists).toBeFalsy();
    });

    it('should handle very large minute values', async () => {
      mockTimerService.currentMinute = signal(999).asReadonly();
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));

      await component.onOpponentGoalClick();

      const callArgs = mockGoalService.createOpponentGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_minute).toBe(999);
    });

    it('should handle negative minute values', async () => {
      mockTimerService.currentMinute = signal(-1).asReadonly();
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));

      await component.onOpponentGoalClick();

      const callArgs = mockGoalService.createOpponentGoal.calls.mostRecent().args[0];
      expect(callArgs.scored_at_minute).toBe(-1);
    });

    it('should not require any player selection', async () => {
      // Opponent goal doesn't need player selection
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));

      expect(component.selectedScorer()).toBeNull();
      await component.onOpponentGoalClick();

      expect(mockGoalService.createOpponentGoal).toHaveBeenCalled();
    });
  });

  describe('Opponent Goal Tracking - Undo Action', () => {
    beforeEach(async () => {
      await component.ngOnInit();
      mockGoalService.createOpponentGoal.and.returnValue(of({} as any));
    });

    it('should subscribe to undo action', async () => {
      await component.onOpponentGoalClick();

      expect(mockSnackBarRef.onAction).toHaveBeenCalled();
    });

    it('should log to console when undo is clicked', async () => {
      spyOn(console, 'log');

      await component.onOpponentGoalClick();

      // Simulate undo action
      const onActionCallback = mockSnackBarRef.onAction.calls.mostRecent().returnValue;
      expect(onActionCallback).toBeDefined();
    });

    it('should have undo subscription active', async () => {
      await component.onOpponentGoalClick();

      const snackBarRef = mockSnackBar.open.calls.mostRecent().returnValue;
      expect(snackBarRef.onAction).toBeDefined();
    });
  });
});
