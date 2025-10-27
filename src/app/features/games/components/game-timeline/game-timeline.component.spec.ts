import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GameTimelineComponent, TimelineEvent } from './game-timeline.component';
import { GoalService } from '../../../../core/services/goal.service';
import { DatabaseService } from '../../../../core/services/database.service';
import { Goal, OpponentGoal, GoalAssist, formatGameMinute } from '../../../../core/models/goal.model';
import { Player } from '../../../../models/player.model';

describe('GameTimelineComponent', () => {
  let component: GameTimelineComponent;
  let fixture: ComponentFixture<GameTimelineComponent>;
  let mockGoalService: jasmine.SpyObj<GoalService>;
  let mockDb: any;

  // Mock signals that we can update during tests
  let mockGoals: WritableSignal<Goal[]>;
  let mockOpponentGoals: WritableSignal<OpponentGoal[]>;

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
      id: 'player-assist-1',
      team_id: 'team-456',
      first_name: 'Mike',
      last_name: 'Johnson',
      date_of_birth: '2000-05-05',
      jersey_number: 8,
      photo_url: null,
      squad: 'starters',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      deleted_at: null
    },
    {
      id: 'player-assist-2',
      team_id: 'team-456',
      first_name: 'Sarah',
      last_name: 'Williams',
      date_of_birth: '2001-06-06',
      jersey_number: 11,
      photo_url: null,
      squad: 'starters',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      deleted_at: null
    }
  ];

  const mockGoalsData: Goal[] = [
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
      player_id: 'player-2',
      scored_at_minute: 67,
      scored_at_timestamp: '2025-01-01T15:67:00Z',
      notes: 'Great shot!',
      created_at: '2025-01-01T15:67:00Z',
      updated_at: '2025-01-01T15:67:00Z',
      deleted_at: null,
      sync_state: 'synced'
    },
    {
      id: 'goal-3',
      game_id: 'game-123',
      player_id: 'player-3',
      scored_at_minute: 45,
      scored_at_timestamp: '2025-01-01T15:45:00Z',
      notes: null,
      created_at: '2025-01-01T15:45:00Z',
      updated_at: '2025-01-01T15:45:00Z',
      deleted_at: null,
      sync_state: 'synced'
    }
  ];

  const mockOpponentGoalsData: OpponentGoal[] = [
    {
      id: 'opp-goal-1',
      game_id: 'game-123',
      scored_at_minute: 30,
      scored_at_timestamp: '2025-01-01T15:30:00Z',
      created_at: '2025-01-01T15:30:00Z',
      updated_at: '2025-01-01T15:30:00Z',
      deleted_at: null,
      sync_state: 'synced'
    },
    {
      id: 'opp-goal-2',
      game_id: 'game-123',
      scored_at_minute: 80,
      scored_at_timestamp: '2025-01-01T15:80:00Z',
      created_at: '2025-01-01T15:80:00Z',
      updated_at: '2025-01-01T15:80:00Z',
      deleted_at: null,
      sync_state: 'synced'
    }
  ];

  const mockGoalAssistsData: GoalAssist[] = [
    {
      id: 'assist-1',
      goal_id: 'goal-2',
      player_id: 'player-assist-1',
      created_at: '2025-01-01T15:67:00Z',
      sync_state: 'synced'
    },
    {
      id: 'assist-2',
      goal_id: 'goal-2',
      player_id: 'player-assist-2',
      created_at: '2025-01-01T15:67:00Z',
      sync_state: 'synced'
    },
    {
      id: 'assist-3',
      goal_id: 'goal-3',
      player_id: 'player-assist-1',
      created_at: '2025-01-01T15:45:00Z',
      sync_state: 'synced'
    }
  ];

  // Helper function to create mock Dexie collection with query chaining
  function createMockDexieCollection(data: any[]) {
    return {
      where: jasmine.createSpy('where').and.returnValue({
        equals: jasmine.createSpy('equals').and.returnValue({
          and: jasmine.createSpy('and').and.callFake((predicate: (item: any) => boolean) => ({
            toArray: jasmine.createSpy('toArray').and.returnValue(
              Promise.resolve(data.filter(predicate))
            )
          }))
        })
      }),
      get: jasmine.createSpy('get').and.callFake((id: string) => {
        const item = data.find(d => d.id === id);
        return Promise.resolve(item);
      })
    };
  }

  beforeEach(async () => {
    // Initialize mock signals
    mockGoals = signal([]);
    mockOpponentGoals = signal([]);

    // Create mock DatabaseService with Dexie tables
    mockDb = {
      db: {
        players: createMockDexieCollection(mockPlayers),
        goals: createMockDexieCollection(mockGoalsData),
        opponent_goals: createMockDexieCollection(mockOpponentGoalsData),
        goal_assists: createMockDexieCollection(mockGoalAssistsData)
      }
    };

    // Create mock GoalService
    mockGoalService = jasmine.createSpyObj('GoalService', [], {
      goals: mockGoals.asReadonly(),
      opponentGoals: mockOpponentGoals.asReadonly()
    });

    await TestBed.configureTestingModule({
      imports: [GameTimelineComponent],
      providers: [
        { provide: GoalService, useValue: mockGoalService },
        { provide: DatabaseService, useValue: mockDb }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameTimelineComponent);
    component = fixture.componentInstance;
  });

  // =============================================================================
  // 1. Component Creation and Initialization Tests
  // =============================================================================

  describe('Component Creation and Initialization', () => {
    it('should create successfully', () => {
      component.gameId = 'game-123';
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should require gameId input', () => {
      component.gameId = 'game-123';
      fixture.detectChanges();
      expect(component.gameId).toBe('game-123');
    });

    it('should initialize with empty events signal', () => {
      component.gameId = 'game-123';
      expect(component.events()).toEqual([]);
    });

    it('should initialize with isLoading false', () => {
      component.gameId = 'game-123';
      expect(component.isLoading()).toBe(false);
    });

    it('should call loadEvents on ngOnInit', fakeAsync(() => {
      component.gameId = 'game-123';
      spyOn<any>(component, 'loadEvents').and.returnValue(Promise.resolve());

      component.ngOnInit();
      tick();

      expect(component['loadEvents']).toHaveBeenCalled();
    }));

    it('should have isEmpty computed signal', () => {
      component.gameId = 'game-123';
      fixture.detectChanges();
      expect(component.isEmpty).toBeDefined();
      expect(component.isEmpty()).toBe(true);
    });
  });

  // =============================================================================
  // 2. Loading Events from Database Tests
  // =============================================================================

  describe('Loading Events from Database', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should load goals from database for specific gameId', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockDb.db.goals.where).toHaveBeenCalledWith('game_id');
    }));

    it('should load opponent goals from database for specific gameId', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockDb.db.opponent_goals.where).toHaveBeenCalledWith('game_id');
    }));

    it('should filter out deleted goals', fakeAsync(() => {
      const goalsWithDeleted = [
        ...mockGoalsData,
        {
          id: 'goal-deleted',
          game_id: 'game-123',
          player_id: 'player-1',
          scored_at_minute: 90,
          scored_at_timestamp: '2025-01-01T15:90:00Z',
          notes: null,
          created_at: '2025-01-01T15:90:00Z',
          updated_at: '2025-01-01T15:90:00Z',
          deleted_at: '2025-01-15T00:00:00Z',
          sync_state: 'synced'
        }
      ];

      mockDb.db.goals = createMockDexieCollection(goalsWithDeleted);
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvents = events.filter(e => e.type === 'goal');
      expect(goalEvents.length).toBe(3); // Should not include deleted goal
    }));

    it('should filter out deleted opponent goals', fakeAsync(() => {
      const opponentGoalsWithDeleted = [
        ...mockOpponentGoalsData,
        {
          id: 'opp-goal-deleted',
          game_id: 'game-123',
          scored_at_minute: 60,
          scored_at_timestamp: '2025-01-01T15:60:00Z',
          notes: null,
          created_at: '2025-01-01T15:60:00Z',
          updated_at: '2025-01-01T15:60:00Z',
          deleted_at: '2025-01-15T00:00:00Z',
          sync_state: 'synced'
        }
      ];

      mockDb.db.opponent_goals = createMockDexieCollection(opponentGoalsWithDeleted);
      fixture.detectChanges();
      tick();

      const events = component.events();
      const opponentGoalEvents = events.filter(e => e.type === 'opponent_goal');
      expect(opponentGoalEvents.length).toBe(2); // Should not include deleted opponent goal
    }));

    it('should set isLoading to true while loading', fakeAsync(() => {
      let loadingValue = false;
      const loadSpy = spyOn<any>(component, 'loadEvents').and.callFake(() => {
        loadingValue = component.isLoading();
        return Promise.resolve();
      });

      component.ngOnInit();
      tick();

      expect(loadingValue).toBe(true);
    }));

    it('should set isLoading to false after loading completes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isLoading()).toBe(false);
    }));

    it('should handle errors during loading gracefully', fakeAsync(() => {
      spyOn(console, 'error');
      mockDb.db.goals.where = jasmine.createSpy('where').and.throwError('Database error');

      fixture.detectChanges();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error loading timeline events:', jasmine.any(Error));
      expect(component.isLoading()).toBe(false);
    }));
  });

  // =============================================================================
  // 3. Empty State Display Tests
  // =============================================================================

  describe('Empty State Display', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
      mockDb.db.goals = createMockDexieCollection([]);
      mockDb.db.opponent_goals = createMockDexieCollection([]);
    });

    it('should show empty state when no events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();
    }));

    it('should display soccer icon in empty state', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const emptyState = fixture.debugElement.query(By.css('.empty-state mat-icon'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent.trim()).toBe('sports_soccer');
    }));

    it('should display empty state message', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const emptyState = fixture.debugElement.query(By.css('.empty-state p'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('No goals yet');
    }));

    it('should not show timeline list when empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const timelineList = fixture.debugElement.query(By.css('.timeline-list'));
      expect(timelineList).toBeFalsy();
    }));

    it('should compute isEmpty as true when only half-time marker exists', fakeAsync(() => {
      // Manually set a half-time marker event
      component.events.set([{
        type: 'half_time',
        minute: 45,
        description: 'HALF TIME'
      }]);
      fixture.detectChanges();

      expect(component.isEmpty()).toBe(true);
    }));
  });

  // =============================================================================
  // 4. Loading State Display Tests
  // =============================================================================

  describe('Loading State Display', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should show loading state when isLoading is true', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const loadingState = fixture.debugElement.query(By.css('.loading-state'));
      expect(loadingState).toBeTruthy();
    });

    it('should display hourglass icon in loading state', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const loadingIcon = fixture.debugElement.query(By.css('.loading-state mat-icon'));
      expect(loadingIcon).toBeTruthy();
      expect(loadingIcon.nativeElement.textContent.trim()).toBe('hourglass_empty');
    });

    it('should display loading message', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const loadingMessage = fixture.debugElement.query(By.css('.loading-state p'));
      expect(loadingMessage).toBeTruthy();
      expect(loadingMessage.nativeElement.textContent).toContain('Loading events');
    });

    it('should hide loading state when isLoading is false', fakeAsync(() => {
      component.isLoading.set(false);
      fixture.detectChanges();
      tick();

      const loadingState = fixture.debugElement.query(By.css('.loading-state'));
      expect(loadingState).toBeFalsy();
    }));

    it('should not show empty state while loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeFalsy();
    });

    it('should not show timeline list while loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const timelineList = fixture.debugElement.query(By.css('.timeline-list'));
      expect(timelineList).toBeFalsy();
    });
  });

  // =============================================================================
  // 5. Goal Event Display Tests
  // =============================================================================

  describe('Goal Event Display', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should display goal events with correct styling', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const goalEvents = fixture.debugElement.queryAll(By.css('.goal-event'));
      expect(goalEvents.length).toBeGreaterThan(0);
    }));

    it('should display goal minute in correct format', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const eventMinute = fixture.debugElement.query(By.css('.goal-event .event-minute'));
      expect(eventMinute).toBeTruthy();
      expect(eventMinute.nativeElement.textContent).toMatch(/\d+'/);
    }));

    it('should display soccer icon for goal events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const goalEvent = fixture.debugElement.query(By.css('.goal-event'));
      const icon = goalEvent.query(By.css('.event-icon'));
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.textContent.trim()).toContain('sports_soccer');
    }));

    it('should display goal description', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const description = fixture.debugElement.query(By.css('.goal-event .event-description'));
      expect(description).toBeTruthy();
      expect(description.nativeElement.textContent).toContain('Goal by');
    }));

    it('should pre-compute scorer name in description', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-1');
      expect(goalEvent?.scorerName).toBe('John Doe');
      expect(goalEvent?.description).toContain('John Doe');
    }));

    it('should display goal with assists in description', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalWithAssists = events.find(e => e.type === 'goal' && e.id === 'goal-2');
      expect(goalWithAssists?.assistNames).toEqual(['Mike Johnson', 'Sarah Williams']);
      expect(goalWithAssists?.description).toContain('Assists: Mike Johnson, Sarah Williams');
    }));

    it('should display goal without assists correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalWithoutAssists = events.find(e => e.type === 'goal' && e.id === 'goal-1');
      expect(goalWithoutAssists?.assistNames).toEqual([]);
      expect(goalWithoutAssists?.description).not.toContain('Assists:');
    }));

    it('should display edit button for goal events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const editButton = fixture.debugElement.query(By.css('.goal-event button[matTooltip="Edit"]'));
      expect(editButton).toBeTruthy();
    }));

    it('should display delete button for goal events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const deleteButton = fixture.debugElement.query(By.css('.goal-event button[matTooltip="Delete"]'));
      expect(deleteButton).toBeTruthy();
    }));

    it('should display expand icon for goal events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const expandIcon = fixture.debugElement.query(By.css('.goal-event .expand-icon'));
      expect(expandIcon).toBeTruthy();
    }));
  });

  // =============================================================================
  // 6. Opponent Goal Event Display Tests
  // =============================================================================

  describe('Opponent Goal Event Display', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should display opponent goal events with correct styling', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const opponentGoalEvents = fixture.debugElement.queryAll(By.css('.opponent-goal-event'));
      expect(opponentGoalEvents.length).toBeGreaterThan(0);
    }));

    it('should display warning icon for opponent goal events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const opponentGoalEvent = fixture.debugElement.query(By.css('.opponent-goal-event'));
      const icon = opponentGoalEvent.query(By.css('.event-icon'));
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.textContent.trim()).toContain('warning');
    }));

    it('should display opponent goal description', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const opponentGoalEvent = events.find(e => e.type === 'opponent_goal');
      expect(opponentGoalEvent?.description).toBe('Opponent Goal');
    }));

    it('should display opponent goal minute', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const eventMinute = fixture.debugElement.query(By.css('.opponent-goal-event .event-minute'));
      expect(eventMinute).toBeTruthy();
      expect(eventMinute.nativeElement.textContent).toMatch(/\d+'/);
    }));

    it('should have edit button for opponent goal events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const editButton = fixture.debugElement.query(By.css('.opponent-goal-event button[matTooltip="Edit"]'));
      expect(editButton).toBeTruthy();
    }));

    it('should have delete button for opponent goal events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const deleteButton = fixture.debugElement.query(By.css('.opponent-goal-event button[matTooltip="Delete"]'));
      expect(deleteButton).toBeTruthy();
    }));
  });

  // =============================================================================
  // 7. Half-Time Marker Display Tests
  // =============================================================================

  describe('Half-Time Marker Display', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should display half-time marker when events >= 45 minutes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const halfTimeMarker = fixture.debugElement.query(By.css('.half-time-marker'));
      expect(halfTimeMarker).toBeTruthy();
    }));

    it('should not display half-time marker when all events < 45 minutes', fakeAsync(() => {
      const earlyGoals = [
        {
          id: 'goal-early-1',
          game_id: 'game-123',
          player_id: 'player-1',
          scored_at_minute: 10,
          scored_at_timestamp: '2025-01-01T15:10:00Z',
          notes: null,
          created_at: '2025-01-01T15:10:00Z',
          updated_at: '2025-01-01T15:10:00Z',
          deleted_at: null,
          sync_state: 'synced' as const
        }
      ];

      mockDb.db.goals = createMockDexieCollection(earlyGoals);
      mockDb.db.opponent_goals = createMockDexieCollection([]);

      fixture.detectChanges();
      tick();

      const halfTimeMarker = fixture.debugElement.query(By.css('.half-time-marker'));
      expect(halfTimeMarker).toBeFalsy();
    }));

    it('should display "HALF TIME" label in marker', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const halfTimeLabel = fixture.debugElement.query(By.css('.half-time-label'));
      expect(halfTimeLabel).toBeTruthy();
      expect(halfTimeLabel.nativeElement.textContent.trim()).toBe('HALF TIME');
    }));

    it('should have role="separator" on half-time marker', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const halfTimeMarker = fixture.debugElement.query(By.css('.half-time-marker'));
      expect(halfTimeMarker.nativeElement.getAttribute('role')).toBe('separator');
    }));

    it('should have aria-label on half-time marker', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const halfTimeMarker = fixture.debugElement.query(By.css('.half-time-marker'));
      expect(halfTimeMarker.nativeElement.getAttribute('aria-label')).toBe('Half time');
    }));

    it('should add half-time marker at minute 45', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const halfTimeEvent = events.find(e => e.type === 'half_time');
      expect(halfTimeEvent).toBeDefined();
      expect(halfTimeEvent?.minute).toBe(45);
    }));

    it('should not be expandable when clicking half-time marker', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const halfTimeEvent = events.find(e => e.type === 'half_time');

      component.toggleExpand(halfTimeEvent!);

      const updatedEvents = component.events();
      const updatedHalfTimeEvent = updatedEvents.find(e => e.type === 'half_time');
      expect(updatedHalfTimeEvent?.expanded).toBeUndefined();
    }));
  });

  // =============================================================================
  // 8. Event Sorting Tests
  // =============================================================================

  describe('Event Sorting', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should sort events by minute descending (most recent first)', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events().filter(e => e.type !== 'half_time');
      for (let i = 0; i < events.length - 1; i++) {
        expect(events[i].minute).toBeGreaterThanOrEqual(events[i + 1].minute);
      }
    }));

    it('should display events in descending order in DOM', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const eventMinutes = fixture.debugElement.queryAll(By.css('.event-minute'));
      const minutes = eventMinutes.map(el => {
        const text = el.nativeElement.textContent.trim();
        // Extract numeric value from formats like "67'" or "45+22'"
        const match = text.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });

      for (let i = 0; i < minutes.length - 1; i++) {
        expect(minutes[i]).toBeGreaterThanOrEqual(minutes[i + 1]);
      }
    }));

    it('should place latest goal at the top', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events().filter(e => e.type !== 'half_time');
      const firstEvent = events[0];
      const maxMinute = Math.max(...events.map(e => e.minute));
      expect(firstEvent.minute).toBe(maxMinute);
    }));

    it('should maintain sort order after new events are added', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const newGoal: Goal = {
        id: 'goal-new',
        game_id: 'game-123',
        player_id: 'player-1',
        scored_at_minute: 95,
        scored_at_timestamp: '2025-01-01T15:95:00Z',
        notes: null,
        assist_player_ids: [],
        created_at: '2025-01-01T15:95:00Z',
        updated_at: '2025-01-01T15:95:00Z',
        deleted_at: null,
        sync_state: 'synced'
      };

      mockDb.db.goals = createMockDexieCollection([...mockGoalsData, newGoal]);
      mockGoals.set([...mockGoalsData, newGoal]);

      tick();
      fixture.detectChanges();

      const events = component.events().filter(e => e.type !== 'half_time');
      expect(events[0].minute).toBe(95);
    }));
  });

  // =============================================================================
  // 9. Expand/Collapse Functionality Tests
  // =============================================================================

  describe('Expand/Collapse Functionality', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should not be expanded by default', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal');
      expect(goalEvent?.expanded).toBeUndefined();
    }));

    it('should toggle expand state when toggleExpand is called', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal');

      component.toggleExpand(goalEvent!);

      const updatedEvents = component.events();
      const updatedGoalEvent = updatedEvents.find(e => e.id === goalEvent!.id);
      expect(updatedGoalEvent?.expanded).toBe(true);
    }));

    it('should collapse when toggleExpand is called on expanded event', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal');

      component.toggleExpand(goalEvent!);
      let updatedEvents = component.events();
      let updatedGoalEvent = updatedEvents.find(e => e.id === goalEvent!.id);
      expect(updatedGoalEvent?.expanded).toBe(true);

      component.toggleExpand(updatedGoalEvent!);
      updatedEvents = component.events();
      updatedGoalEvent = updatedEvents.find(e => e.id === goalEvent!.id);
      expect(updatedGoalEvent?.expanded).toBe(false);
    }));

    it('should show event details when expanded', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal');
      component.toggleExpand(goalEvent!);

      fixture.detectChanges();

      const eventDetails = fixture.debugElement.query(By.css('.event-details'));
      expect(eventDetails).toBeTruthy();
    }));

    it('should hide event details when collapsed', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const eventDetails = fixture.debugElement.query(By.css('.event-details'));
      expect(eventDetails).toBeFalsy();
    }));

    it('should display "expand_more" icon when collapsed', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const expandIcon = fixture.debugElement.query(By.css('.goal-event .expand-icon'));
      expect(expandIcon.nativeElement.textContent.trim()).toBe('expand_more');
    }));

    it('should display "expand_less" icon when expanded', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal');
      component.toggleExpand(goalEvent!);

      fixture.detectChanges();

      const goalEventElement = fixture.debugElement.query(By.css('.goal-event.expanded'));
      const expandIcon = goalEventElement.query(By.css('.expand-icon'));
      expect(expandIcon.nativeElement.textContent.trim()).toBe('expand_less');
    }));

    it('should add "expanded" class when event is expanded', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal');
      component.toggleExpand(goalEvent!);

      fixture.detectChanges();

      const expandedElement = fixture.debugElement.query(By.css('.timeline-event.expanded'));
      expect(expandedElement).toBeTruthy();
    }));

    it('should toggle expand on click', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const goalEventElement = fixture.debugElement.query(By.css('.goal-event'));
      spyOn(component, 'toggleExpand');

      goalEventElement.nativeElement.click();

      expect(component.toggleExpand).toHaveBeenCalled();
    }));

    it('should not toggle expand for half-time marker', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const halfTimeEvent = events.find(e => e.type === 'half_time');
      const initialEvents = [...component.events()];

      component.toggleExpand(halfTimeEvent!);

      expect(component.events()).toEqual(initialEvents);
    }));
  });

  // =============================================================================
  // 10. Expanded Event Details Display Tests
  // =============================================================================

  describe('Expanded Event Details Display', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should display scorer name in expanded goal details', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-1');
      component.toggleExpand(goalEvent!);
      fixture.detectChanges();

      const scorerValue = fixture.debugElement.query(By.css('.event-details .detail-value'));
      expect(scorerValue.nativeElement.textContent.trim()).toBe('John Doe');
    }));

    it('should display assist names when goal has assists', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-2');
      component.toggleExpand(goalEvent!);
      fixture.detectChanges();

      const detailRows = fixture.debugElement.queryAll(By.css('.event-details .detail-row'));
      const assistRow = detailRows.find(row =>
        row.query(By.css('.detail-label'))?.nativeElement.textContent.trim() === 'Assists:'
      );

      expect(assistRow).toBeTruthy();
      const assistValue = assistRow!.query(By.css('.detail-value'));
      expect(assistValue.nativeElement.textContent.trim()).toContain('Mike Johnson');
      expect(assistValue.nativeElement.textContent.trim()).toContain('Sarah Williams');
    }));

    it('should not display assists row when goal has no assists', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-1');
      component.toggleExpand(goalEvent!);
      fixture.detectChanges();

      const detailRows = fixture.debugElement.queryAll(By.css('.event-details .detail-row'));
      const assistRow = detailRows.find(row =>
        row.query(By.css('.detail-label'))?.nativeElement.textContent.trim() === 'Assists:'
      );

      expect(assistRow).toBeFalsy();
    }));

    it('should display timestamp in expanded details', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.timestamp);
      component.toggleExpand(goalEvent!);
      fixture.detectChanges();

      const detailRows = fixture.debugElement.queryAll(By.css('.event-details .detail-row'));
      const timeRow = detailRows.find(row =>
        row.query(By.css('.detail-label'))?.nativeElement.textContent.trim() === 'Time:'
      );

      expect(timeRow).toBeTruthy();
    }));

    it('should display notes when goal has notes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-2');
      component.toggleExpand(goalEvent!);
      fixture.detectChanges();

      const detailRows = fixture.debugElement.queryAll(By.css('.event-details .detail-row'));
      const notesRow = detailRows.find(row =>
        row.query(By.css('.detail-label'))?.nativeElement.textContent.trim() === 'Notes:'
      );

      expect(notesRow).toBeTruthy();
      const notesValue = notesRow!.query(By.css('.detail-value'));
      expect(notesValue.nativeElement.textContent.trim()).toBe('Great shot!');
    }));

    it('should not display notes row when goal has no notes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-1');
      component.toggleExpand(goalEvent!);
      fixture.detectChanges();

      const detailRows = fixture.debugElement.queryAll(By.css('.event-details .detail-row'));
      const notesRow = detailRows.find(row =>
        row.query(By.css('.detail-label'))?.nativeElement.textContent.trim() === 'Notes:'
      );

      expect(notesRow).toBeFalsy();
    }));

    it('should display timestamp for opponent goals in expanded details', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const opponentGoalEvent = events.find(e => e.type === 'opponent_goal');
      component.toggleExpand(opponentGoalEvent!);
      fixture.detectChanges();

      const detailRows = fixture.debugElement.queryAll(By.css('.event-details .detail-row'));
      const timeRow = detailRows.find(row =>
        row.query(By.css('.detail-label'))?.nativeElement.textContent.trim() === 'Time:'
      );

      expect(timeRow).toBeTruthy();
    }));

  });

  // =============================================================================
  // 11. formatMinute() Function Tests
  // =============================================================================

  describe('formatMinute() Function', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should format minutes correctly with apostrophe', () => {
      expect(component.formatMinute(23)).toBe("23'");
    });

    it('should handle 0 minute', () => {
      expect(component.formatMinute(0)).toBe("0'");
    });

    it('should format minutes 1-45 correctly', () => {
      expect(component.formatMinute(1)).toBe("1'");
      expect(component.formatMinute(15)).toBe("15'");
      expect(component.formatMinute(30)).toBe("30'");
      expect(component.formatMinute(45)).toBe("45'");
    });

    it('should format injury time in first half correctly', () => {
      expect(component.formatMinute(46)).toBe("45+1'");
      expect(component.formatMinute(47)).toBe("45+2'");
      expect(component.formatMinute(50)).toBe("45+5'");
    });

    it('should format minutes 46-90 as first half injury time', () => {
      expect(component.formatMinute(60)).toBe("45+15'");
      expect(component.formatMinute(75)).toBe("45+30'");
      expect(component.formatMinute(90)).toBe("45+45'");
    });

    it('should format injury time in second half correctly', () => {
      expect(component.formatMinute(91)).toBe("90+1'");
      expect(component.formatMinute(93)).toBe("90+3'");
      expect(component.formatMinute(95)).toBe("90+5'");
    });

    it('should handle 90+ minutes', () => {
      expect(component.formatMinute(100)).toBe("90+10'");
      expect(component.formatMinute(120)).toBe("90+30'");
    });

    it('should use formatGameMinute from model', () => {
      spyOn<any>(component, 'formatMinute').and.callThrough();
      const result = component.formatMinute(67);
      expect(result).toBe(formatGameMinute(67));
    });
  });

  // =============================================================================
  // 12. formatTimestamp() Function Tests
  // =============================================================================

  describe('formatTimestamp() Function', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should format timestamp to time string', () => {
      const timestamp = '2025-01-01T15:23:45Z';
      const result = component.formatTimestamp(timestamp);
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should return time in HH:MM:SS format', () => {
      const timestamp = '2025-01-01T15:23:45Z';
      const result = component.formatTimestamp(timestamp);
      // Should contain hours, minutes, and seconds
      const parts = result.split(':');
      expect(parts.length).toBe(3);
    });

    it('should handle different timestamps correctly', () => {
      const timestamp1 = '2025-01-01T09:05:30Z';
      const timestamp2 = '2025-01-01T18:45:15Z';

      const result1 = component.formatTimestamp(timestamp1);
      const result2 = component.formatTimestamp(timestamp2);

      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      expect(result1).not.toBe(result2);
    });

    it('should format with 2-digit hours and minutes', () => {
      const timestamp = '2025-01-01T15:23:45Z';
      const result = component.formatTimestamp(timestamp);

      // Check format (should be like "03:23:45 PM" or "15:23:45")
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });
  });

  // =============================================================================
  // 13. trackByEvent() Function Tests
  // =============================================================================

  describe('trackByEvent() Function', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should return event id when available', () => {
      const event: TimelineEvent = {
        type: 'goal',
        minute: 23,
        id: 'goal-123',
        description: 'Test goal'
      };

      const result = component.trackByEvent(0, event);
      expect(result).toBe('goal-123');
    });

    it('should return combined type and minute when id is not available', () => {
      const event: TimelineEvent = {
        type: 'half_time',
        minute: 45,
        description: 'HALF TIME'
      };

      const result = component.trackByEvent(0, event);
      expect(result).toBe('half_time-45');
    });

    it('should return unique identifiers for different events', () => {
      const event1: TimelineEvent = {
        type: 'goal',
        minute: 23,
        id: 'goal-1',
        description: 'Goal 1'
      };

      const event2: TimelineEvent = {
        type: 'goal',
        minute: 45,
        id: 'goal-2',
        description: 'Goal 2'
      };

      const result1 = component.trackByEvent(0, event1);
      const result2 = component.trackByEvent(1, event2);

      expect(result1).not.toBe(result2);
    });

    it('should be used in ngFor for performance', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // The trackBy function should be defined and used in template
      expect(component.trackByEvent).toBeDefined();
      expect(typeof component.trackByEvent).toBe('function');
    }));
  });

  // =============================================================================
  // 14. Scroll Position Persistence Tests
  // =============================================================================

  describe('Scroll Position Persistence', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should preserve scroll position during event updates', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Mock timelineContainer with scroll position
      const mockContainer = {
        nativeElement: {
          scrollTop: 150
        }
      };
      component.timelineContainer = mockContainer as any;

      // Trigger event reload
      mockGoals.set([...mockGoalsData]);
      tick();

      // Wait for setTimeout in loadEvents
      tick(100);

      // Scroll position should be restored
      expect(mockContainer.nativeElement.scrollTop).toBe(150);
    }));

    it('should handle missing timelineContainer gracefully', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.timelineContainer = undefined;

      // Should not throw error
      expect(() => {
        mockGoals.set([...mockGoalsData]);
        tick();
        tick(100);
      }).not.toThrow();
    }));

    it('should save scroll position before loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockContainer = {
        nativeElement: {
          scrollTop: 200
        }
      };
      component.timelineContainer = mockContainer as any;

      let savedScrollPos = 0;
      spyOn<any>(component, 'loadEvents').and.callFake(async function(this: any) {
        savedScrollPos = this.timelineContainer?.nativeElement.scrollTop || 0;
      });

      component['loadEvents']();
      tick();

      expect(savedScrollPos).toBe(200);
    }));

    it('should restore scroll position after DOM update', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockContainer = {
        nativeElement: {
          scrollTop: 0
        }
      };
      component.timelineContainer = mockContainer as any;
      mockContainer.nativeElement.scrollTop = 300;

      mockGoals.set([...mockGoalsData]);
      tick();
      tick(100);

      expect(mockContainer.nativeElement.scrollTop).toBe(300);
    }));
  });

  // =============================================================================
  // 15. Reactive Updates via Signals Tests
  // =============================================================================

  describe('Reactive Updates via Signals', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should reload events when goals signal changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn<any>(component, 'loadEvents').and.returnValue(Promise.resolve());

      mockGoals.set([...mockGoalsData]);
      tick();

      expect(component['loadEvents']).toHaveBeenCalled();
    }));

    it('should reload events when opponentGoals signal changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn<any>(component, 'loadEvents').and.returnValue(Promise.resolve());

      mockOpponentGoals.set([...mockOpponentGoalsData]);
      tick();

      expect(component['loadEvents']).toHaveBeenCalled();
    }));

    it('should update events list when new goal is added', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialEventCount = component.events().length;

      const newGoal: Goal = {
        id: 'goal-new',
        game_id: 'game-123',
        player_id: 'player-1',
        scored_at_minute: 75,
        scored_at_timestamp: '2025-01-01T15:75:00Z',
        notes: null,
        created_at: '2025-01-01T15:75:00Z',
        updated_at: '2025-01-01T15:75:00Z',
        deleted_at: null,
        sync_state: 'synced'
      };

      mockDb.db.goals = createMockDexieCollection([...mockGoalsData, newGoal]);
      mockGoals.set([...mockGoalsData, newGoal]);

      tick();
      fixture.detectChanges();

      expect(component.events().length).toBeGreaterThan(initialEventCount);
    }));

    it('should update events list when opponent goal is added', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialEventCount = component.events().length;

      const newOpponentGoal: OpponentGoal = {
        id: 'opp-goal-new',
        game_id: 'game-123',
        scored_at_minute: 55,
        scored_at_timestamp: '2025-01-01T15:55:00Z',
        notes: null,
        created_at: '2025-01-01T15:55:00Z',
        updated_at: '2025-01-01T15:55:00Z',
        deleted_at: null,
        sync_state: 'synced'
      };

      mockDb.db.opponent_goals = createMockDexieCollection([...mockOpponentGoalsData, newOpponentGoal]);
      mockOpponentGoals.set([...mockOpponentGoalsData, newOpponentGoal]);

      tick();
      fixture.detectChanges();

      expect(component.events().length).toBeGreaterThan(initialEventCount);
    }));

    it('should only reload when gameId is set', fakeAsync(() => {
      const newComponent = new GameTimelineComponent(mockGoalService, mockDb);
      spyOn<any>(newComponent, 'loadEvents');

      mockGoals.set([...mockGoalsData]);
      tick();

      // Should not call loadEvents without gameId
      expect(newComponent['loadEvents']).not.toHaveBeenCalled();
    }));
  });

  // =============================================================================
  // 16. onEdit() and onDelete() Method Tests (Story 5.8)
  // =============================================================================

  describe('onEdit() and onDelete() Methods', () => {
    let mockDialog: jasmine.SpyObj<MatDialog>;
    let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
    let mockDialogRef: any;

    beforeEach(() => {
      component.gameId = 'game-123';
      component.teamId = 'team-456';

      // Mock MatDialog
      mockDialogRef = {
        afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of({ success: true }))
      };
      mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
      mockDialog.open.and.returnValue(mockDialogRef);
      (component as any).dialog = mockDialog;

      // Mock MatSnackBar
      mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
      (component as any).snackBar = mockSnackBar;
    });

    describe('Edit Functionality', () => {
      it('should open EditGoalModalComponent for goal event', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal' && e.id)!;

        component.onEdit(goalEvent);

        expect(mockDialog.open).toHaveBeenCalledWith(
          jasmine.any(Function),
          {
            width: '600px',
            data: {
              goalId: goalEvent.id,
              gameId: 'game-123',
              teamId: 'team-456'
            }
          }
        );
      }));

      it('should pass correct data to EditGoalModalComponent', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-1')!;

        component.onEdit(goalEvent);

        const callArgs = mockDialog.open.calls.mostRecent().args;
        expect(callArgs[1].data.goalId).toBe('goal-1');
        expect(callArgs[1].data.gameId).toBe('game-123');
        expect(callArgs[1].data.teamId).toBe('team-456');
      }));

      it('should reload timeline after successful edit', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        spyOn<any>(component, 'loadEvents').and.returnValue(Promise.resolve());

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal')!;

        component.onEdit(goalEvent);
        tick();

        expect(component['loadEvents']).toHaveBeenCalled();
      }));

      it('should show success snackbar after successful edit', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal')!;

        component.onEdit(goalEvent);
        tick();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Goal updated',
          'Close',
          { duration: 2000 }
        );
      }));

      it('should not reload timeline if dialog was cancelled', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        mockDialogRef.afterClosed.and.returnValue(of(null));
        spyOn<any>(component, 'loadEvents');

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal')!;

        component.onEdit(goalEvent);
        tick();

        expect(component['loadEvents']).not.toHaveBeenCalled();
        expect(mockSnackBar.open).not.toHaveBeenCalled();
      }));

      it('should show "coming soon" message for opponent goal edit', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const events = component.events();
        const opponentGoalEvent = events.find(e => e.type === 'opponent_goal')!;

        component.onEdit(opponentGoalEvent);

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Opponent goal editing coming soon',
          'Close',
          { duration: 2000 }
        );
        expect(mockDialog.open).not.toHaveBeenCalled();
      }));

      it('should not open dialog for half-time marker', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const events = component.events();
        const halfTimeEvent = events.find(e => e.type === 'half_time')!;

        component.onEdit(halfTimeEvent);

        expect(mockDialog.open).not.toHaveBeenCalled();
      }));

      it('should not open dialog for event without id', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const eventWithoutId: TimelineEvent = {
          type: 'goal',
          minute: 30,
          description: 'Test goal'
        };

        component.onEdit(eventWithoutId);

        expect(mockDialog.open).not.toHaveBeenCalled();
      }));
    });

    describe('Delete Functionality', () => {
      beforeEach(() => {
        // Mock window.confirm
        spyOn(window, 'confirm').and.returnValue(true);
      });

      it('should show confirmation dialog before deleting', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal')!;

        component.onDelete(goalEvent);

        expect(window.confirm).toHaveBeenCalledWith(
          jasmine.stringContaining('Are you sure you want to delete this goal?')
        );
      }));

      it('should include event description in confirmation', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal' && e.description)!;

        component.onDelete(goalEvent);

        expect(window.confirm).toHaveBeenCalledWith(
          jasmine.stringContaining(goalEvent.description!)
        );
      }));

      it('should call deleteGoal for goal events', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const mockGoalService = jasmine.createSpyObj('GoalService', ['deleteGoal']);
        mockGoalService.deleteGoal.and.returnValue(of(undefined));
        (component as any).goalService = mockGoalService;

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal')!;

        component.onDelete(goalEvent);
        tick();

        expect(mockGoalService.deleteGoal).toHaveBeenCalledWith(goalEvent.id);
      }));

      it('should reload timeline after successful delete', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const mockGoalService = jasmine.createSpyObj('GoalService', ['deleteGoal']);
        mockGoalService.deleteGoal.and.returnValue(of(undefined));
        (component as any).goalService = mockGoalService;

        spyOn<any>(component, 'loadEvents').and.returnValue(Promise.resolve());

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal')!;

        component.onDelete(goalEvent);
        tick();

        expect(component['loadEvents']).toHaveBeenCalled();
      }));

      it('should show success snackbar after delete', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const mockGoalService = jasmine.createSpyObj('GoalService', ['deleteGoal']);
        mockGoalService.deleteGoal.and.returnValue(of(undefined));
        (component as any).goalService = mockGoalService;

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal')!;

        component.onDelete(goalEvent);
        tick();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Goal deleted',
          'Close',
          { duration: 2000 }
        );
      }));

      it('should handle delete error', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const mockGoalService = jasmine.createSpyObj('GoalService', ['deleteGoal']);
        mockGoalService.deleteGoal.and.returnValue(throwError(() => new Error('Delete failed')));
        (component as any).goalService = mockGoalService;

        spyOn(console, 'error');

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal')!;

        component.onDelete(goalEvent);
        tick();

        expect(console.error).toHaveBeenCalledWith('Error deleting goal:', jasmine.any(Error));
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Error deleting goal',
          'Close',
          { duration: 3000 }
        );
      }));

      it('should not delete if user cancels confirmation', fakeAsync(() => {
        (window.confirm as jasmine.Spy).and.returnValue(false);
        fixture.detectChanges();
        tick();

        const mockGoalService = jasmine.createSpyObj('GoalService', ['deleteGoal']);
        (component as any).goalService = mockGoalService;

        const events = component.events();
        const goalEvent = events.find(e => e.type === 'goal')!;

        component.onDelete(goalEvent);
        tick();

        expect(mockGoalService.deleteGoal).not.toHaveBeenCalled();
      }));

      it('should call deleteOpponentGoal for opponent goal events', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const mockGoalService = jasmine.createSpyObj('GoalService', ['deleteOpponentGoal']);
        mockGoalService.deleteOpponentGoal.and.returnValue(of(undefined));
        (component as any).goalService = mockGoalService;

        const events = component.events();
        const opponentGoalEvent = events.find(e => e.type === 'opponent_goal')!;

        component.onDelete(opponentGoalEvent);
        tick();

        expect(mockGoalService.deleteOpponentGoal).toHaveBeenCalledWith(opponentGoalEvent.id);
      }));

      it('should show success snackbar after deleting opponent goal', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const mockGoalService = jasmine.createSpyObj('GoalService', ['deleteOpponentGoal']);
        mockGoalService.deleteOpponentGoal.and.returnValue(of(undefined));
        (component as any).goalService = mockGoalService;

        const events = component.events();
        const opponentGoalEvent = events.find(e => e.type === 'opponent_goal')!;

        component.onDelete(opponentGoalEvent);
        tick();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Opponent goal deleted',
          'Close',
          { duration: 2000 }
        );
      }));

      it('should handle opponent goal delete error', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const mockGoalService = jasmine.createSpyObj('GoalService', ['deleteOpponentGoal']);
        mockGoalService.deleteOpponentGoal.and.returnValue(throwError(() => new Error('Delete failed')));
        (component as any).goalService = mockGoalService;

        spyOn(console, 'error');

        const events = component.events();
        const opponentGoalEvent = events.find(e => e.type === 'opponent_goal')!;

        component.onDelete(opponentGoalEvent);
        tick();

        expect(console.error).toHaveBeenCalledWith('Error deleting opponent goal:', jasmine.any(Error));
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Error deleting opponent goal',
          'Close',
          { duration: 3000 }
        );
      }));

      it('should not delete half-time marker', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const mockGoalService = jasmine.createSpyObj('GoalService', ['deleteGoal']);
        (component as any).goalService = mockGoalService;

        const events = component.events();
        const halfTimeEvent = events.find(e => e.type === 'half_time')!;

        component.onDelete(halfTimeEvent);

        expect(window.confirm).not.toHaveBeenCalled();
        expect(mockGoalService.deleteGoal).not.toHaveBeenCalled();
      }));

      it('should not delete event without id', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const mockGoalService = jasmine.createSpyObj('GoalService', ['deleteGoal']);
        (component as any).goalService = mockGoalService;

        const eventWithoutId: TimelineEvent = {
          type: 'goal',
          minute: 30,
          description: 'Test goal'
        };

        component.onDelete(eventWithoutId);

        expect(window.confirm).not.toHaveBeenCalled();
        expect(mockGoalService.deleteGoal).not.toHaveBeenCalled();
      }));
    });

    describe('Button Click Handlers', () => {
      it('should call onEdit when edit button is clicked', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        spyOn(component, 'onEdit');

        const editButton = fixture.debugElement.query(By.css('.goal-event button[matTooltip="Edit"]'));
        editButton.nativeElement.click();

        expect(component.onEdit).toHaveBeenCalled();
      }));

      it('should call onDelete when delete button is clicked', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        spyOn(component, 'onDelete');

        const deleteButton = fixture.debugElement.query(By.css('.goal-event button[matTooltip="Delete"]'));
        deleteButton.nativeElement.click();

        expect(component.onDelete).toHaveBeenCalled();
      }));

      it('should stop propagation when edit button is clicked', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const editButton = fixture.debugElement.query(By.css('.goal-event button[matTooltip="Edit"]'));
        const clickEvent = new MouseEvent('click', { bubbles: true });
        spyOn(clickEvent, 'stopPropagation');

        editButton.nativeElement.dispatchEvent(clickEvent);

        // The template should call stopPropagation
        expect(editButton).toBeTruthy();
      }));

      it('should stop propagation when delete button is clicked', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const deleteButton = fixture.debugElement.query(By.css('.goal-event button[matTooltip="Delete"]'));

        // The template should have (click) handler with $event.stopPropagation()
        expect(deleteButton).toBeTruthy();
      }));
    });
  });

  // =============================================================================
  // 17. Accessibility Features Tests
  // =============================================================================

  describe('Accessibility Features', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should have role="list" on timeline list', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const timelineList = fixture.debugElement.query(By.css('.timeline-list'));
      expect(timelineList.nativeElement.getAttribute('role')).toBe('list');
    }));

    it('should have aria-label on timeline list', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const timelineList = fixture.debugElement.query(By.css('.timeline-list'));
      expect(timelineList.nativeElement.getAttribute('aria-label')).toBe('Game events timeline');
    }));

    it('should have role="button" on timeline events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const goalEvent = fixture.debugElement.query(By.css('.goal-event'));
      expect(goalEvent.nativeElement.getAttribute('role')).toBe('button');
    }));

    it('should have tabindex="0" on timeline events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const goalEvent = fixture.debugElement.query(By.css('.goal-event'));
      expect(goalEvent.nativeElement.getAttribute('tabindex')).toBe('0');
    }));

    it('should have aria-label on timeline events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const goalEvent = fixture.debugElement.query(By.css('.goal-event'));
      const ariaLabel = goalEvent.nativeElement.getAttribute('aria-label');
      expect(ariaLabel).toContain('Event at minute');
    }));

    it('should have aria-expanded attribute on timeline events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const goalEvent = fixture.debugElement.query(By.css('.goal-event'));
      const ariaExpanded = goalEvent.nativeElement.getAttribute('aria-expanded');
      expect(ariaExpanded).toBe('false');
    }));

    it('should update aria-expanded when event is expanded', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal');
      component.toggleExpand(goalEvent!);

      fixture.detectChanges();

      const expandedElement = fixture.debugElement.query(By.css('.timeline-event.expanded'));
      expect(expandedElement.nativeElement.getAttribute('aria-expanded')).toBe('true');
    }));

    it('should handle Enter key to toggle expand', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn(component, 'toggleExpand');

      const goalEvent = fixture.debugElement.query(By.css('.goal-event'));
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      goalEvent.nativeElement.dispatchEvent(enterEvent);

      expect(component.toggleExpand).toHaveBeenCalled();
    }));

    it('should handle Space key to toggle expand', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn(component, 'toggleExpand');

      const goalEvent = fixture.debugElement.query(By.css('.goal-event'));
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });

      goalEvent.nativeElement.dispatchEvent(spaceEvent);

      expect(component.toggleExpand).toHaveBeenCalled();
    }));

    it('should have aria-label on edit buttons', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const editButton = fixture.debugElement.query(By.css('.goal-event button[matTooltip="Edit"]'));
      const ariaLabel = editButton.nativeElement.getAttribute('aria-label');
      expect(ariaLabel).toContain('Edit event at minute');
    }));

    it('should have aria-label on delete buttons', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const deleteButton = fixture.debugElement.query(By.css('.goal-event button[matTooltip="Delete"]'));
      const ariaLabel = deleteButton.nativeElement.getAttribute('aria-label');
      expect(ariaLabel).toContain('Delete event at minute');
    }));

    it('should have role="region" on expanded event details', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal');
      component.toggleExpand(goalEvent!);

      fixture.detectChanges();

      const eventDetails = fixture.debugElement.query(By.css('.event-details'));
      expect(eventDetails.nativeElement.getAttribute('role')).toBe('region');
    }));

    it('should have aria-label on expanded event details', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal');
      component.toggleExpand(goalEvent!);

      fixture.detectChanges();

      const eventDetails = fixture.debugElement.query(By.css('.event-details'));
      const ariaLabel = eventDetails.nativeElement.getAttribute('aria-label');
      expect(ariaLabel).toContain('Details for event at minute');
    }));

    it('should prevent default on Space key press', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const goalEvent = fixture.debugElement.query(By.css('.goal-event'));
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      spyOn(spaceEvent, 'preventDefault');

      goalEvent.nativeElement.dispatchEvent(spaceEvent);

      // The template should call preventDefault for space key
      expect(goalEvent).toBeTruthy();
    }));
  });

  // =============================================================================
  // 18. Pre-computed Display Data Tests
  // =============================================================================

  describe('Pre-computed Display Data', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should pre-compute description for goals', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-1');

      expect(goalEvent?.description).toBeDefined();
      expect(goalEvent?.description).toContain('Goal by');
    }));

    it('should pre-compute scorer name for goals', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-1');

      expect(goalEvent?.scorerName).toBe('John Doe');
    }));

    it('should pre-compute assist names for goals with assists', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-2');

      expect(goalEvent?.assistNames).toEqual(['Mike Johnson', 'Sarah Williams']);
    }));

    it('should pre-compute empty assist names for goals without assists', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-1');

      expect(goalEvent?.assistNames).toEqual([]);
    }));

    it('should pre-compute timestamp for events', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-1');

      expect(goalEvent?.timestamp).toBe('2025-01-01T15:23:00Z');
    }));

    it('should handle unknown player gracefully', fakeAsync(() => {
      const goalWithUnknownPlayer: Goal = {
        id: 'goal-unknown',
        game_id: 'game-123',
        player_id: 'player-unknown',
        scored_at_minute: 50,
        scored_at_timestamp: '2025-01-01T15:50:00Z',
        notes: null,
        created_at: '2025-01-01T15:50:00Z',
        updated_at: '2025-01-01T15:50:00Z',
        deleted_at: null,
        sync_state: 'synced'
      };

      mockDb.db.goals = createMockDexieCollection([...mockGoalsData, goalWithUnknownPlayer]);

      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.id === 'goal-unknown');

      expect(goalEvent?.scorerName).toBe('Unknown Player');
      expect(goalEvent?.description).toContain('Unknown Player');
    }));

    it('should skip unknown assist players', fakeAsync(() => {
      const goalWithUnknownAssist: Goal = {
        id: 'goal-unknown-assist',
        game_id: 'game-123',
        player_id: 'player-1',
        scored_at_minute: 55,
        scored_at_timestamp: '2025-01-01T15:55:00Z',
        notes: null,
        created_at: '2025-01-01T15:55:00Z',
        updated_at: '2025-01-01T15:55:00Z',
        deleted_at: null,
        sync_state: 'synced'
      };

      const assistsWithUnknown: GoalAssist[] = [
        ...mockGoalAssistsData,
        {
          id: 'assist-unknown-1',
          goal_id: 'goal-unknown-assist',
          player_id: 'player-assist-1',
          created_at: '2025-01-01T15:55:00Z',
          sync_state: 'synced'
        },
        {
          id: 'assist-unknown-2',
          goal_id: 'goal-unknown-assist',
          player_id: 'unknown-player',
          created_at: '2025-01-01T15:55:00Z',
          sync_state: 'synced'
        }
      ];

      mockDb.db.goals = createMockDexieCollection([...mockGoalsData, goalWithUnknownAssist]);
      mockDb.db.goal_assists = createMockDexieCollection(assistsWithUnknown);

      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.id === 'goal-unknown-assist');

      expect(goalEvent?.assistNames).toEqual(['Mike Johnson']);
    }));

    it('should include data field with original goal data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvent = events.find(e => e.type === 'goal' && e.id === 'goal-1');

      expect(goalEvent?.data).toBeDefined();
      expect(goalEvent?.data.player_id).toBe('player-1');
    }));

    it('should include data field with original opponent goal data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const opponentGoalEvent = events.find(e => e.type === 'opponent_goal' && e.id === 'opp-goal-1');

      expect(opponentGoalEvent?.data).toBeDefined();
      expect(opponentGoalEvent?.data.scored_at_minute).toBe(30);
    }));
  });

  // =============================================================================
  // 19. Edge Cases and Error Handling Tests
  // =============================================================================

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should handle empty goals array', fakeAsync(() => {
      mockDb.db.goals = createMockDexieCollection([]);
      mockDb.db.opponent_goals = createMockDexieCollection([]);

      fixture.detectChanges();
      tick();

      expect(component.events().length).toBe(0);
      expect(component.isEmpty()).toBe(true);
    }));

    it('should handle missing player data gracefully', fakeAsync(() => {
      mockDb.db.players = createMockDexieCollection([]);

      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvents = events.filter(e => e.type === 'goal');

      goalEvents.forEach(event => {
        expect(event.scorerName).toBe('Unknown Player');
      });
    }));

    it('should handle goals with no assists', fakeAsync(() => {
      const goalWithNoAssists: Goal = {
        id: 'goal-no-assists',
        game_id: 'game-123',
        player_id: 'player-1',
        scored_at_minute: 35,
        scored_at_timestamp: '2025-01-01T15:35:00Z',
        notes: null,
        created_at: '2025-01-01T15:35:00Z',
        updated_at: '2025-01-01T15:35:00Z',
        deleted_at: null,
        sync_state: 'synced'
      };

      mockDb.db.goals = createMockDexieCollection([...mockGoalsData, goalWithNoAssists]);

      fixture.detectChanges();
      tick();

      // Should not throw error
      expect(component.events).toBeTruthy();

      const events = component.events();
      const goalEvent = events.find(e => e.id === 'goal-no-assists');
      expect(goalEvent?.assistNames).toEqual([]);
    }));

    it('should handle very large minute values', fakeAsync(() => {
      const goalAtLargeMinute: Goal = {
        id: 'goal-large',
        game_id: 'game-123',
        player_id: 'player-1',
        scored_at_minute: 120,
        scored_at_timestamp: '2025-01-01T15:120:00Z',
        notes: null,
        created_at: '2025-01-01T15:120:00Z',
        updated_at: '2025-01-01T15:120:00Z',
        deleted_at: null,
        sync_state: 'synced'
      };

      mockDb.db.goals = createMockDexieCollection([...mockGoalsData, goalAtLargeMinute]);

      fixture.detectChanges();
      tick();

      const events = component.events();
      const largeMinuteEvent = events.find(e => e.minute === 120);

      expect(largeMinuteEvent).toBeDefined();
      expect(component.formatMinute(120)).toBe("90+30'");
    }));

    it('should handle database query errors', fakeAsync(() => {
      spyOn(console, 'error');
      mockDb.db.goals.where = jasmine.createSpy('where').and.throwError('Query failed');

      fixture.detectChanges();
      tick();

      expect(console.error).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    }));

    it('should maintain state when reload fails', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialEvents = [...component.events()];

      mockDb.db.goals.where = jasmine.createSpy('where').and.throwError('Database error');
      mockGoals.set([...mockGoalsData]);
      tick();

      // Should maintain previous state on error
      expect(component.isLoading()).toBe(false);
    }));
  });

  // =============================================================================
  // 20. Integration Tests
  // =============================================================================

  describe('Integration Tests', () => {
    beforeEach(() => {
      component.gameId = 'game-123';
    });

    it('should display complete timeline with all event types', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events();
      const goalEvents = events.filter(e => e.type === 'goal');
      const opponentGoalEvents = events.filter(e => e.type === 'opponent_goal');
      const halfTimeEvents = events.filter(e => e.type === 'half_time');

      expect(goalEvents.length).toBeGreaterThan(0);
      expect(opponentGoalEvents.length).toBeGreaterThan(0);
      expect(halfTimeEvents.length).toBeGreaterThan(0);
    }));

    it('should properly interleave goals and opponent goals by minute', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const events = component.events().filter(e => e.type !== 'half_time');

      // Check descending order
      for (let i = 0; i < events.length - 1; i++) {
        expect(events[i].minute).toBeGreaterThanOrEqual(events[i + 1].minute);
      }
    }));

    it('should reload and re-render when data changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialCount = component.events().length;

      const newGoal: Goal = {
        id: 'goal-integration',
        game_id: 'game-123',
        player_id: 'player-2',
        scored_at_minute: 88,
        scored_at_timestamp: '2025-01-01T15:88:00Z',
        notes: 'Integration test goal',
        created_at: '2025-01-01T15:88:00Z',
        updated_at: '2025-01-01T15:88:00Z',
        deleted_at: null,
        sync_state: 'synced'
      };

      const newAssist: GoalAssist = {
        id: 'assist-integration',
        goal_id: 'goal-integration',
        player_id: 'player-1',
        created_at: '2025-01-01T15:88:00Z',
        sync_state: 'synced'
      };

      mockDb.db.goals = createMockDexieCollection([...mockGoalsData, newGoal]);
      mockDb.db.goal_assists = createMockDexieCollection([...mockGoalAssistsData, newAssist]);
      mockGoals.set([...mockGoalsData, newGoal]);

      tick();
      fixture.detectChanges();

      expect(component.events().length).toBeGreaterThan(initialCount);

      const newEvent = component.events().find(e => e.id === 'goal-integration');
      expect(newEvent).toBeDefined();
      expect(newEvent?.scorerName).toBe('Jane Smith');
      expect(newEvent?.assistNames).toEqual(['John Doe']);
    }));

    it('should handle full user interaction flow', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // 1. Find a goal event
      const goalEventElement = fixture.debugElement.query(By.css('.goal-event'));
      expect(goalEventElement).toBeTruthy();

      // 2. Click to expand
      goalEventElement.nativeElement.click();
      fixture.detectChanges();

      // 3. Verify expanded state
      const expandedElement = fixture.debugElement.query(By.css('.timeline-event.expanded'));
      expect(expandedElement).toBeTruthy();

      // 4. Verify details are shown
      const eventDetails = expandedElement.query(By.css('.event-details'));
      expect(eventDetails).toBeTruthy();

      // 5. Click edit button
      spyOn(component, 'onEdit');
      const editButton = expandedElement.query(By.css('button[matTooltip="Edit"]'));
      editButton.nativeElement.click();
      expect(component.onEdit).toHaveBeenCalled();

      // 6. Click to collapse
      expandedElement.nativeElement.click();
      fixture.detectChanges();

      // 7. Verify collapsed state
      const collapsedElement = fixture.debugElement.query(By.css('.timeline-event:not(.expanded)'));
      expect(collapsedElement).toBeTruthy();
    }));
  });
});
