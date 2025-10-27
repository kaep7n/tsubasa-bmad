import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { EditGoalModalComponent, EditGoalModalData } from './edit-goal-modal.component';
import { DatabaseService } from '../../../../core/services/database.service';
import { GoalService } from '../../../../core/services/goal.service';
import { Player } from '../../../../models/player.model';
import { Goal, GoalAssist } from '../../../../core/models/goal.model';

describe('EditGoalModalComponent - Story 5.8: Edit Goal Functionality', () => {
  let component: EditGoalModalComponent;
  let fixture: ComponentFixture<EditGoalModalComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EditGoalModalComponent>>;
  let mockDb: any;
  let mockGoalService: jasmine.SpyObj<GoalService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<any>>;

  const mockDialogData: EditGoalModalData = {
    goalId: 'goal-123',
    gameId: 'game-456',
    teamId: 'team-789'
  };

  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      team_id: 'team-789',
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
      team_id: 'team-789',
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
      team_id: 'team-789',
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
      team_id: 'team-789',
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

  const mockGoal: Goal = {
    id: 'goal-123',
    game_id: 'game-456',
    player_id: 'player-1',
    scored_at_minute: 23,
    scored_at_timestamp: '2025-01-01T15:23:00Z',
    notes: 'Great shot!',
    created_at: '2025-01-01T15:23:00Z',
    updated_at: '2025-01-01T15:23:00Z',
    deleted_at: null,
    sync_state: 'synced'
  };

  const mockAssists: GoalAssist[] = [
    {
      id: 'assist-1',
      goal_id: 'goal-123',
      player_id: 'player-2',
      created_at: '2025-01-01T15:23:00Z',
      sync_state: 'synced'
    },
    {
      id: 'assist-2',
      goal_id: 'goal-123',
      player_id: 'player-3',
      created_at: '2025-01-01T15:23:00Z',
      sync_state: 'synced'
    }
  ];

  // Helper function to create mock Dexie collection
  function createMockDexieCollection(data: any[]) {
    return {
      get: jasmine.createSpy('get').and.callFake((id: string) => {
        const item = data.find(d => d.id === id);
        return Promise.resolve(item);
      }),
      where: jasmine.createSpy('where').and.returnValue({
        equals: jasmine.createSpy('equals').and.returnValue({
          and: jasmine.createSpy('and').and.callFake((predicate: (item: any) => boolean) => ({
            toArray: jasmine.createSpy('toArray').and.returnValue(
              Promise.resolve(data.filter(predicate))
            ),
            sortBy: jasmine.createSpy('sortBy').and.callFake((field: string) => {
              const filtered = data.filter((item: any) => predicate(item));
              return Promise.resolve(filtered.sort((a: any, b: any) => {
                if (field === 'last_name') {
                  return a.last_name.localeCompare(b.last_name);
                }
                return 0;
              }));
            })
          })),
          toArray: jasmine.createSpy('toArray').and.returnValue(Promise.resolve(data))
        })
      })
    };
  }

  beforeEach(async () => {
    // Mock DatabaseService
    mockDb = {
      db: {
        goals: createMockDexieCollection([mockGoal]),
        players: createMockDexieCollection(mockPlayers),
        goal_assists: createMockDexieCollection(mockAssists)
      }
    };

    // Mock GoalService
    mockGoalService = jasmine.createSpyObj('GoalService', ['updateGoalWithAssists']);
    mockGoalService.updateGoalWithAssists.and.returnValue(of(mockGoal));

    // Mock MatSnackBar
    mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction']);
    mockSnackBarRef.onAction.and.returnValue(of(undefined));
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockSnackBar.open.and.returnValue(mockSnackBarRef);

    // Mock MatDialogRef
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [EditGoalModalComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: DatabaseService, useValue: mockDb },
        { provide: GoalService, useValue: mockGoalService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditGoalModalComponent);
    component = fixture.componentInstance;
  });

  // ========================================================================
  // 1. Component Creation Tests
  // ========================================================================

  describe('Component Creation', () => {
    it('should create successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should receive dialog data with goalId, gameId, and teamId', () => {
      expect(component.data).toEqual(mockDialogData);
      expect(component.data.goalId).toBe('goal-123');
      expect(component.data.gameId).toBe('game-456');
      expect(component.data.teamId).toBe('team-789');
    });

    it('should initialize with empty player list', () => {
      expect(component.allPlayers).toEqual([]);
    });

    it('should initialize with loading state true', () => {
      expect(component.isLoading).toBe(true);
    });

    it('should initialize with null goal', () => {
      expect(component.goal).toBeNull();
    });

    it('should initialize with empty assists array', () => {
      expect(component.existingAssists).toEqual([]);
    });
  });

  // ========================================================================
  // 2. Form Initialization Tests
  // ========================================================================

  describe('Form Initialization', () => {
    it('should create form with required controls', () => {
      expect(component.editForm.get('scorer')).toBeTruthy();
      expect(component.editForm.get('minute')).toBeTruthy();
      expect(component.editForm.get('notes')).toBeTruthy();
      expect(component.editForm.get('assists')).toBeTruthy();
    });

    it('should have scorer field as required', () => {
      const scorerControl = component.editForm.get('scorer');
      scorerControl?.setValue('');
      expect(scorerControl?.hasError('required')).toBe(true);
    });

    it('should have minute field as required', () => {
      const minuteControl = component.editForm.get('minute');
      minuteControl?.setValue(null);
      expect(minuteControl?.hasError('required')).toBe(true);
    });

    it('should validate minute >= 0', () => {
      const minuteControl = component.editForm.get('minute');
      minuteControl?.setValue(-1);
      expect(minuteControl?.hasError('min')).toBe(true);
    });

    it('should validate minute <= 120', () => {
      const minuteControl = component.editForm.get('minute');
      minuteControl?.setValue(121);
      expect(minuteControl?.hasError('max')).toBe(true);
    });

    it('should accept valid minute values', () => {
      const minuteControl = component.editForm.get('minute');

      minuteControl?.setValue(0);
      expect(minuteControl?.valid).toBe(true);

      minuteControl?.setValue(45);
      expect(minuteControl?.valid).toBe(true);

      minuteControl?.setValue(120);
      expect(minuteControl?.valid).toBe(true);
    });

    it('should have notes field as optional', () => {
      const notesControl = component.editForm.get('notes');
      notesControl?.setValue('');
      expect(notesControl?.valid).toBe(true);
    });

    it('should initialize assists as empty array', () => {
      const assistsControl = component.editForm.get('assists');
      expect(assistsControl?.value).toEqual([]);
    });
  });

  // ========================================================================
  // 3. Data Loading Tests
  // ========================================================================

  describe('Data Loading on Init', () => {
    it('should load goal data from database', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockDb.db.goals.get).toHaveBeenCalledWith('goal-123');
      expect(component.goal).toEqual(mockGoal);
    }));

    it('should load all active players for the team', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockDb.db.players.where).toHaveBeenCalledWith('team_id');
      expect(component.allPlayers.length).toBe(3); // Excludes deleted player
      expect(component.allPlayers.find(p => p.id === 'player-deleted')).toBeUndefined();
    }));

    it('should sort players by last name', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.allPlayers[0].last_name).toBe('Anderson');
      expect(component.allPlayers[1].last_name).toBe('Doe');
      expect(component.allPlayers[2].last_name).toBe('Smith');
    }));

    it('should load existing assists for the goal', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockDb.db.goal_assists.where).toHaveBeenCalledWith('goal_id');
      expect(component.existingAssists.length).toBe(2);
      expect(component.existingAssists[0].player_id).toBe('player-2');
      expect(component.existingAssists[1].player_id).toBe('player-3');
    }));

    it('should set loading to false after successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBe(false);
    }));
  });

  // ========================================================================
  // 4. Form Population Tests
  // ========================================================================

  describe('Form Population', () => {
    it('should populate form with goal data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.editForm.get('scorer')?.value).toBe('player-1');
      expect(component.editForm.get('minute')?.value).toBe(23);
      expect(component.editForm.get('notes')?.value).toBe('Great shot!');
    }));

    it('should populate assists with existing assist player IDs', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const assistsValue = component.editForm.get('assists')?.value;
      expect(assistsValue).toEqual(['player-2', 'player-3']);
    }));

    it('should handle goal with no notes', fakeAsync(() => {
      const goalWithoutNotes = { ...mockGoal, notes: null };
      mockDb.db.goals = createMockDexieCollection([goalWithoutNotes]);

      fixture.detectChanges();
      tick();

      expect(component.editForm.get('notes')?.value).toBe('');
    }));

    it('should handle goal with no assists', fakeAsync(() => {
      mockDb.db.goal_assists = createMockDexieCollection([]);

      fixture.detectChanges();
      tick();

      expect(component.editForm.get('assists')?.value).toEqual([]);
    }));
  });

  // ========================================================================
  // 5. Available Assist Players Tests
  // ========================================================================

  describe('Available Assist Players', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should exclude selected scorer from available assists', () => {
      component.editForm.patchValue({ scorer: 'player-1' });
      const availablePlayers = component.availableAssistPlayers;

      expect(availablePlayers.find(p => p.id === 'player-1')).toBeUndefined();
      expect(availablePlayers.length).toBe(2);
    });

    it('should update available assists when scorer changes', () => {
      component.editForm.patchValue({ scorer: 'player-1' });
      let availablePlayers = component.availableAssistPlayers;
      expect(availablePlayers.find(p => p.id === 'player-1')).toBeUndefined();

      component.editForm.patchValue({ scorer: 'player-2' });
      availablePlayers = component.availableAssistPlayers;
      expect(availablePlayers.find(p => p.id === 'player-2')).toBeUndefined();
      expect(availablePlayers.find(p => p.id === 'player-1')).toBeTruthy();
    });

    it('should return all players when no scorer selected', () => {
      component.editForm.patchValue({ scorer: '' });
      const availablePlayers = component.availableAssistPlayers;

      expect(availablePlayers.length).toBe(3);
    });
  });

  // ========================================================================
  // 6. Assist Selection Tests
  // ========================================================================

  describe('Assist Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should check if player is selected as assist', () => {
      component.editForm.patchValue({ assists: ['player-2', 'player-3'] });

      expect(component.isAssistSelected('player-2')).toBe(true);
      expect(component.isAssistSelected('player-3')).toBe(true);
      expect(component.isAssistSelected('player-1')).toBe(false);
    });

    it('should toggle assist selection - add player', () => {
      component.editForm.patchValue({ assists: ['player-2'] });

      component.toggleAssist('player-3');

      const assists = component.editForm.get('assists')?.value;
      expect(assists).toContain('player-2');
      expect(assists).toContain('player-3');
      expect(assists.length).toBe(2);
    });

    it('should toggle assist selection - remove player', () => {
      component.editForm.patchValue({ assists: ['player-2', 'player-3'] });

      component.toggleAssist('player-2');

      const assists = component.editForm.get('assists')?.value;
      expect(assists).not.toContain('player-2');
      expect(assists).toContain('player-3');
      expect(assists.length).toBe(1);
    });

    it('should toggle assist multiple times', () => {
      component.editForm.patchValue({ assists: [] });

      component.toggleAssist('player-2');
      expect(component.editForm.get('assists')?.value).toEqual(['player-2']);

      component.toggleAssist('player-2');
      expect(component.editForm.get('assists')?.value).toEqual([]);

      component.toggleAssist('player-2');
      expect(component.editForm.get('assists')?.value).toEqual(['player-2']);
    });

    it('should handle empty assists array', () => {
      component.editForm.patchValue({ assists: [] });

      expect(component.isAssistSelected('player-1')).toBe(false);
      expect(component.isAssistSelected('player-2')).toBe(false);
    });
  });

  // ========================================================================
  // 7. Player Display Tests
  // ========================================================================

  describe('Player Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display player with jersey number', () => {
      const player = mockPlayers[0];
      const display = component.getPlayerDisplay(player);

      expect(display).toBe('#10 John Doe');
    });

    it('should display player without jersey number', () => {
      const playerNoJersey = { ...mockPlayers[0], jersey_number: null };
      const display = component.getPlayerDisplay(playerNoJersey);

      expect(display).toBe('John Doe');
    });

    it('should format all players correctly', () => {
      const displays = component.allPlayers.map(p => component.getPlayerDisplay(p));

      expect(displays[0]).toBe('#5 Bob Anderson');
      expect(displays[1]).toBe('#10 John Doe');
      expect(displays[2]).toBe('#7 Jane Smith');
    });
  });

  // ========================================================================
  // 8. Save Functionality Tests
  // ========================================================================

  describe('Save Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call updateGoalWithAssists on save', fakeAsync(() => {
      component.editForm.patchValue({
        scorer: 'player-2',
        minute: 30,
        notes: 'Updated note',
        assists: ['player-1']
      });

      component.onSave();
      tick();

      expect(mockGoalService.updateGoalWithAssists).toHaveBeenCalledWith(
        'goal-123',
        {
          player_id: 'player-2',
          scored_at_minute: 30,
          notes: 'Updated note'
        },
        ['player-1']
      );
    }));

    it('should handle empty notes as null', fakeAsync(() => {
      component.editForm.patchValue({
        scorer: 'player-1',
        minute: 23,
        notes: '',
        assists: []
      });

      component.onSave();
      tick();

      const callArgs = mockGoalService.updateGoalWithAssists.calls.argsFor(0);
      expect(callArgs[1].notes).toBeNull();
    }));

    it('should handle empty assists array', fakeAsync(() => {
      component.editForm.patchValue({
        scorer: 'player-1',
        minute: 23,
        notes: 'No assists',
        assists: []
      });

      component.onSave();
      tick();

      expect(mockGoalService.updateGoalWithAssists).toHaveBeenCalledWith(
        'goal-123',
        jasmine.any(Object),
        []
      );
    }));

    it('should show success snackbar after save', fakeAsync(() => {
      component.editForm.patchValue({
        scorer: 'player-1',
        minute: 23,
        notes: 'Test',
        assists: []
      });

      component.onSave();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        "Goal updated: John Doe - 23'",
        'Close',
        { duration: 3000 }
      );
    }));

    it('should close dialog with success result after save', fakeAsync(() => {
      component.editForm.patchValue({
        scorer: 'player-1',
        minute: 23,
        notes: 'Test',
        assists: []
      });

      component.onSave();
      tick();

      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
    }));

    it('should not save if form is invalid', fakeAsync(() => {
      component.editForm.patchValue({
        scorer: '', // Invalid - required
        minute: 23,
        notes: 'Test',
        assists: []
      });

      component.onSave();
      tick();

      expect(mockGoalService.updateGoalWithAssists).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));

    it('should not save if goal is null', fakeAsync(() => {
      component.goal = null;
      component.editForm.patchValue({
        scorer: 'player-1',
        minute: 23,
        notes: 'Test',
        assists: []
      });

      component.onSave();
      tick();

      expect(mockGoalService.updateGoalWithAssists).not.toHaveBeenCalled();
    }));
  });

  // ========================================================================
  // 9. Error Handling Tests
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle goal not found', fakeAsync(() => {
      mockDb.db.goals = createMockDexieCollection([]);

      fixture.detectChanges();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Goal not found', 'Close', { duration: 3000 });
      expect(mockDialogRef.close).toHaveBeenCalled();
    }));

    it('should handle database error during load', fakeAsync(() => {
      mockDb.db.goals.get = jasmine.createSpy('get').and.returnValue(
        Promise.reject(new Error('Database error'))
      );
      spyOn(console, 'error');

      fixture.detectChanges();
      tick();

      expect(console.error).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error loading goal data',
        'Close',
        { duration: 3000 }
      );
      expect(mockDialogRef.close).toHaveBeenCalled();
    }));

    it('should handle save error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockGoalService.updateGoalWithAssists.and.returnValue(
        throwError(() => new Error('Update failed'))
      );
      spyOn(console, 'error');

      component.editForm.patchValue({
        scorer: 'player-1',
        minute: 23,
        notes: 'Test',
        assists: []
      });

      component.onSave();
      tick();

      expect(console.error).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error updating goal',
        'Close',
        { duration: 3000 }
      );
      expect(mockDialogRef.close).not.toHaveBeenCalledWith({ success: true });
    }));

    it('should set loading to false after error', fakeAsync(() => {
      mockDb.db.goals.get = jasmine.createSpy('get').and.returnValue(
        Promise.reject(new Error('Database error'))
      );

      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBe(false);
    }));
  });

  // ========================================================================
  // 10. Cancel Functionality Tests
  // ========================================================================

  describe('Cancel Functionality', () => {
    it('should close dialog without result on cancel', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should not save data on cancel', () => {
      component.onCancel();

      expect(mockGoalService.updateGoalWithAssists).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 11. Integration Tests
  // ========================================================================

  describe('Integration Tests', () => {
    it('should complete full edit flow', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Verify initial state
      expect(component.editForm.get('scorer')?.value).toBe('player-1');
      expect(component.editForm.get('minute')?.value).toBe(23);
      expect(component.editForm.get('assists')?.value).toEqual(['player-2', 'player-3']);

      // Make changes
      component.editForm.patchValue({
        scorer: 'player-2',
        minute: 45,
        notes: 'Amazing goal!',
        assists: ['player-1']
      });

      // Save
      component.onSave();
      tick();

      // Verify save was called with correct data
      expect(mockGoalService.updateGoalWithAssists).toHaveBeenCalledWith(
        'goal-123',
        {
          player_id: 'player-2',
          scored_at_minute: 45,
          notes: 'Amazing goal!'
        },
        ['player-1']
      );

      // Verify success feedback
      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
    }));

    it('should handle changing scorer and updating assists', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Start with player-1 as scorer, player-2 and player-3 as assists
      expect(component.editForm.get('scorer')?.value).toBe('player-1');
      expect(component.editForm.get('assists')?.value).toEqual(['player-2', 'player-3']);

      // Change scorer to player-2
      component.editForm.patchValue({ scorer: 'player-2' });

      // Verify player-2 is excluded from available assists
      const availablePlayers = component.availableAssistPlayers;
      expect(availablePlayers.find(p => p.id === 'player-2')).toBeUndefined();

      // Update assists to include player-1
      component.toggleAssist('player-1');
      const assists = component.editForm.get('assists')?.value;
      expect(assists).toContain('player-1');
      expect(assists).toContain('player-2');
      expect(assists).toContain('player-3');
    }));

    it('should validate form before allowing save', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Make form invalid
      component.editForm.patchValue({
        scorer: '',
        minute: 150 // Invalid - exceeds max
      });

      expect(component.editForm.invalid).toBe(true);

      component.onSave();
      tick();

      expect(mockGoalService.updateGoalWithAssists).not.toHaveBeenCalled();
    }));
  });
});
