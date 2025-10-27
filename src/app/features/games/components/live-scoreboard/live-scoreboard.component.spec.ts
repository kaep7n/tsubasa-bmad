import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { LiveScoreboardComponent } from './live-scoreboard.component';
import { TimerAdjustDialogComponent } from './timer-adjust-dialog.component';
import { GameTimerService } from '../../../../core/services/game-timer.service';
import { GoalService } from '../../../../core/services/goal.service';
import { Goal, OpponentGoal } from '../../../../core/models/goal.model';

describe('LiveScoreboardComponent', () => {
  let component: LiveScoreboardComponent;
  let fixture: ComponentFixture<LiveScoreboardComponent>;
  let mockTimerService: jasmine.SpyObj<GameTimerService>;
  let mockGoalService: jasmine.SpyObj<GoalService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  // Mock signals that we can update during tests
  let mockCurrentMinute: WritableSignal<number>;
  let mockIsRunning: WritableSignal<boolean>;
  let mockIsHalfTime: WritableSignal<boolean>;
  let mockGoals: WritableSignal<Goal[]>;
  let mockOpponentGoals: WritableSignal<OpponentGoal[]>;

  beforeEach(async () => {
    // Initialize mock signals
    mockCurrentMinute = signal(0);
    mockIsRunning = signal(false);
    mockIsHalfTime = signal(false);
    mockGoals = signal([]);
    mockOpponentGoals = signal([]);

    // Create mock services
    mockTimerService = jasmine.createSpyObj('GameTimerService', ['pauseTimer', 'resumeTimer'], {
      currentMinute: mockCurrentMinute.asReadonly(),
      isRunning: mockIsRunning.asReadonly(),
      isHalfTime: mockIsHalfTime.asReadonly()
    });

    mockGoalService = jasmine.createSpyObj('GoalService',
      ['getGoalsForGame', 'getOpponentGoalsForGame'],
      {
        goals: mockGoals.asReadonly(),
        opponentGoals: mockOpponentGoals.asReadonly()
      }
    );

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    // Setup default return values
    mockGoalService.getGoalsForGame.and.returnValue(of([]));
    mockGoalService.getOpponentGoalsForGame.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [LiveScoreboardComponent, MatDialogModule],
      providers: [
        { provide: GameTimerService, useValue: mockTimerService },
        { provide: GoalService, useValue: mockGoalService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LiveScoreboardComponent);
    component = fixture.componentInstance;
  });

  // =============================================================================
  // 1. Component Creation Tests
  // =============================================================================

  describe('Component Creation', () => {
    it('should create successfully', () => {
      component.gameId = 'test-game-id';
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should require gameId input', () => {
      // gameId is a required input, so it should be defined
      component.gameId = 'test-game-id';
      fixture.detectChanges();
      expect(component.gameId).toBe('test-game-id');
    });
  });

  // =============================================================================
  // 2. Display Tests (AC 2, 4)
  // =============================================================================

  describe('Display Tests', () => {
    beforeEach(() => {
      component.gameId = 'test-game-id';
      fixture.detectChanges();
    });

    it('should render correct team score', () => {
      component.teamScore.set(3);
      fixture.detectChanges();

      const teamScoreElement = fixture.debugElement.queryAll(By.css('.score'))[0];
      expect(teamScoreElement.nativeElement.textContent.trim()).toBe('3');
    });

    it('should render correct opponent score', () => {
      component.opponentScore.set(2);
      fixture.detectChanges();

      const opponentScoreElements = fixture.debugElement.queryAll(By.css('.score'));
      const opponentScoreElement = opponentScoreElements[1]; // Second score element
      expect(opponentScoreElement.nativeElement.textContent.trim()).toBe('2');
    });

    it('should display current minute with correct format', () => {
      mockCurrentMinute.set(23);
      fixture.detectChanges();

      const timerElement = fixture.debugElement.query(By.css('.timer time'));
      expect(timerElement.nativeElement.textContent.trim()).toBe("23'");
    });

    it('should show half-time banner when isHalfTime is true', () => {
      mockIsHalfTime.set(true);
      fixture.detectChanges();

      const halfTimeBanner = fixture.debugElement.query(By.css('.half-time-banner'));
      expect(halfTimeBanner).toBeTruthy();
      expect(halfTimeBanner.nativeElement.textContent.trim()).toBe('HALF TIME');
    });

    it('should hide half-time banner when isHalfTime is false', () => {
      mockIsHalfTime.set(false);
      fixture.detectChanges();

      const halfTimeBanner = fixture.debugElement.query(By.css('.half-time-banner'));
      expect(halfTimeBanner).toBeFalsy();
    });
  });

  // =============================================================================
  // 3. Visual State Tests (AC 5)
  // =============================================================================

  describe('Visual State Tests', () => {
    beforeEach(() => {
      component.gameId = 'test-game-id';
      fixture.detectChanges();
    });

    it("should have 'running' class when timer is running", () => {
      mockIsRunning.set(true);
      mockIsHalfTime.set(false);
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('header'));
      expect(header.nativeElement.classList.contains('running')).toBe(true);
      expect(header.nativeElement.classList.contains('paused')).toBe(false);
      expect(header.nativeElement.classList.contains('half-time')).toBe(false);
    });

    it("should have 'half-time' class when isHalfTime is true", () => {
      mockIsHalfTime.set(true);
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('header'));
      expect(header.nativeElement.classList.contains('half-time')).toBe(true);
    });

    it("should have 'paused' class when timer is paused", () => {
      mockIsRunning.set(false);
      mockIsHalfTime.set(false);
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('header'));
      expect(header.nativeElement.classList.contains('paused')).toBe(true);
      expect(header.nativeElement.classList.contains('running')).toBe(false);
    });

    it('should return correct visual state for running timer', () => {
      mockIsRunning.set(true);
      mockIsHalfTime.set(false);
      expect(component.getVisualState()).toBe('running');
    });

    it('should return correct visual state for half-time', () => {
      mockIsHalfTime.set(true);
      expect(component.getVisualState()).toBe('half-time');
    });

    it('should return correct visual state for paused timer', () => {
      mockIsRunning.set(false);
      mockIsHalfTime.set(false);
      expect(component.getVisualState()).toBe('paused');
    });

    it('should prioritize half-time state over running state', () => {
      mockIsHalfTime.set(true);
      mockIsRunning.set(true);
      expect(component.getVisualState()).toBe('half-time');
    });
  });

  // =============================================================================
  // 4. Score Animation Tests (AC 7)
  // =============================================================================

  describe('Score Animation Tests', () => {
    beforeEach(() => {
      component.gameId = 'test-game-id';
      fixture.detectChanges();
    });

    it('should trigger team score highlight on score change', fakeAsync(() => {
      expect(component.teamScoreHighlight()).toBe(false);

      component.teamScore.set(1);
      tick();

      expect(component.teamScoreHighlight()).toBe(true);
    }));

    it('should trigger opponent score highlight on score change', fakeAsync(() => {
      expect(component.opponentScoreHighlight()).toBe(false);

      component.opponentScore.set(1);
      tick();

      expect(component.opponentScoreHighlight()).toBe(true);
    }));

    it('should remove team highlight after 200ms', fakeAsync(() => {
      component.teamScore.set(1);
      tick();
      expect(component.teamScoreHighlight()).toBe(true);

      tick(200);
      expect(component.teamScoreHighlight()).toBe(false);
    }));

    it('should remove opponent highlight after 200ms', fakeAsync(() => {
      component.opponentScore.set(1);
      tick();
      expect(component.opponentScoreHighlight()).toBe(true);

      tick(200);
      expect(component.opponentScoreHighlight()).toBe(false);
    }));

    it('should apply highlight class to team score element when highlighted', () => {
      component.teamScore.set(1);
      component.teamScoreHighlight.set(true);
      fixture.detectChanges();

      const teamScoreElement = fixture.debugElement.queryAll(By.css('.score'))[0];
      expect(teamScoreElement.nativeElement.classList.contains('highlight')).toBe(true);
    });

    it('should apply highlight class to opponent score element when highlighted', () => {
      component.opponentScore.set(1);
      component.opponentScoreHighlight.set(true);
      fixture.detectChanges();

      const opponentScoreElement = fixture.debugElement.queryAll(By.css('.score'))[1];
      expect(opponentScoreElement.nativeElement.classList.contains('highlight')).toBe(true);
    });

    it('should not trigger animation when score is set to 0', fakeAsync(() => {
      component.teamScore.set(0);
      tick();
      expect(component.teamScoreHighlight()).toBe(false);
    }));
  });

  // =============================================================================
  // 5. Timer Interaction Tests (AC 6)
  // =============================================================================

  describe('Timer Interaction Tests', () => {
    beforeEach(() => {
      component.gameId = 'test-game-id';
      fixture.detectChanges();
    });

    it('should open dialog when timer is clicked', () => {
      const timerContainer = fixture.debugElement.query(By.css('.timer-container'));
      timerContainer.nativeElement.click();

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should pass gameId to dialog', () => {
      component.gameId = 'specific-game-id';
      component.openTimerAdjustDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(
        TimerAdjustDialogComponent,
        jasmine.objectContaining({
          data: { gameId: 'specific-game-id' }
        })
      );
    });

    it('should call MatDialog.open with correct component', () => {
      component.openTimerAdjustDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(
        TimerAdjustDialogComponent,
        jasmine.objectContaining({
          width: '320px',
          data: jasmine.any(Object)
        })
      );
    });

    it('should open dialog with correct width configuration', () => {
      component.openTimerAdjustDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          width: '320px'
        })
      );
    });
  });

  // =============================================================================
  // 6. Accessibility Tests (AC 9)
  // =============================================================================

  describe('Accessibility Tests', () => {
    beforeEach(() => {
      component.gameId = 'test-game-id';
      fixture.detectChanges();
    });

    it('should have role="banner" on header', () => {
      const header = fixture.debugElement.query(By.css('header'));
      expect(header.nativeElement.getAttribute('role')).toBe('banner');
    });

    it('should have role="timer" on timer', () => {
      const timer = fixture.debugElement.query(By.css('.timer'));
      expect(timer.nativeElement.getAttribute('role')).toBe('timer');
    });

    it('should have ARIA live region with role="status"', () => {
      const liveRegion = fixture.debugElement.query(By.css('[role="status"]'));
      expect(liveRegion).toBeTruthy();
    });

    it('should have aria-live="polite" on announcement region', () => {
      const liveRegion = fixture.debugElement.query(By.css('[aria-live="polite"]'));
      expect(liveRegion).toBeTruthy();
    });

    it('should have aria-atomic="true" on announcement region', () => {
      const liveRegion = fixture.debugElement.query(By.css('[role="status"]'));
      expect(liveRegion.nativeElement.getAttribute('aria-atomic')).toBe('true');
    });

    it('should announce team score changes', fakeAsync(() => {
      component.teamScore.set(0);
      component.opponentScore.set(0);
      fixture.detectChanges();

      // Simulate a team goal
      const mockGoalData: Goal[] = [{
        id: 'goal-1',
        game_id: 'test-game-id',
        player_id: 'player-1',
        scored_at_minute: 10,
        scored_at_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_state: 'synced'
      }];

      mockGoalService.getGoalsForGame.and.returnValue(of(mockGoalData));
      component['loadScores']();
      tick();
      fixture.detectChanges();

      expect(component.scoreAnnouncement()).toContain('Team scored!');
      expect(component.scoreAnnouncement()).toContain('Score is now 1 to 0');
    }));

    it('should announce opponent score changes', fakeAsync(() => {
      component.teamScore.set(0);
      component.opponentScore.set(0);
      fixture.detectChanges();

      // Simulate an opponent goal
      const mockOpponentGoalData: OpponentGoal[] = [{
        id: 'opp-goal-1',
        game_id: 'test-game-id',
        scored_at_minute: 15,
        scored_at_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_state: 'synced'
      }];

      mockGoalService.getOpponentGoalsForGame.and.returnValue(of(mockOpponentGoalData));
      component['loadScores']();
      tick();
      fixture.detectChanges();

      expect(component.scoreAnnouncement()).toContain('Opponent scored!');
      expect(component.scoreAnnouncement()).toContain('Score is now 0 to 1');
    }));

    it('should have aria-label on team score', () => {
      const teamScoreElement = fixture.debugElement.queryAll(By.css('.score'))[0];
      expect(teamScoreElement.nativeElement.getAttribute('aria-label')).toBe('Team score');
    });

    it('should have aria-label on opponent score', () => {
      const opponentScoreElement = fixture.debugElement.queryAll(By.css('.score'))[1];
      expect(opponentScoreElement.nativeElement.getAttribute('aria-label')).toBe('Opponent score');
    });

    it('should update ARIA announcement text in the live region', fakeAsync(() => {
      component.scoreAnnouncement.set('Test announcement');
      fixture.detectChanges();

      const liveRegion = fixture.debugElement.query(By.css('[role="status"]'));
      expect(liveRegion.nativeElement.textContent.trim()).toBe('Test announcement');
    }));
  });

  // =============================================================================
  // 7. Service Integration Tests
  // =============================================================================

  describe('Service Integration Tests', () => {
    beforeEach(() => {
      component.gameId = 'test-game-id';
    });

    it('should call GoalService.getGoalsForGame on init', () => {
      fixture.detectChanges();
      expect(mockGoalService.getGoalsForGame).toHaveBeenCalledWith('test-game-id');
    });

    it('should call GoalService.getOpponentGoalsForGame on init', () => {
      fixture.detectChanges();
      expect(mockGoalService.getOpponentGoalsForGame).toHaveBeenCalledWith('test-game-id');
    });

    it('should use GameTimerService currentMinute signal', () => {
      mockCurrentMinute.set(45);
      fixture.detectChanges();

      expect(component.currentMinute()).toBe(45);
    });

    it('should use GameTimerService isRunning signal', () => {
      mockIsRunning.set(true);
      fixture.detectChanges();

      expect(component.isRunning()).toBe(true);
    });

    it('should use GameTimerService isHalfTime signal', () => {
      mockIsHalfTime.set(true);
      fixture.detectChanges();

      expect(component.isHalfTime()).toBe(true);
    });

    it('should update team score when goals change', fakeAsync(() => {
      fixture.detectChanges();

      const mockGoalData: Goal[] = [
        {
          id: 'goal-1',
          game_id: 'test-game-id',
          player_id: 'player-1',
          scored_at_minute: 10,
          scored_at_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_state: 'synced'
        },
        {
          id: 'goal-2',
          game_id: 'test-game-id',
          player_id: 'player-2',
          scored_at_minute: 20,
          scored_at_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_state: 'synced'
        }
      ];

      mockGoalService.getGoalsForGame.and.returnValue(of(mockGoalData));
      component['loadScores']();
      tick();

      expect(component.teamScore()).toBe(2);
    }));

    it('should update opponent score when opponent goals change', fakeAsync(() => {
      fixture.detectChanges();

      const mockOpponentGoalData: OpponentGoal[] = [
        {
          id: 'opp-goal-1',
          game_id: 'test-game-id',
          scored_at_minute: 15,
          scored_at_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_state: 'synced'
        }
      ];

      mockGoalService.getOpponentGoalsForGame.and.returnValue(of(mockOpponentGoalData));
      component['loadScores']();
      tick();

      expect(component.opponentScore()).toBe(1);
    }));

    it('should filter goals by gameId from signal', fakeAsync(() => {
      fixture.detectChanges();

      const allGoals: Goal[] = [
        {
          id: 'goal-1',
          game_id: 'test-game-id',
          player_id: 'player-1',
          scored_at_minute: 10,
          scored_at_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_state: 'synced'
        },
        {
          id: 'goal-2',
          game_id: 'other-game-id',
          player_id: 'player-2',
          scored_at_minute: 20,
          scored_at_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_state: 'synced'
        }
      ];

      mockGoals.set(allGoals);
      tick();

      // The effect should filter and only count goals for this game
      expect(component.teamScore()).toBe(1);
    }));
  });

  // =============================================================================
  // 8. Minute Formatting Tests
  // =============================================================================

  describe('Minute Formatting Tests', () => {
    beforeEach(() => {
      component.gameId = 'test-game-id';
      fixture.detectChanges();
    });

    it('should format minutes correctly with apostrophe', () => {
      expect(component.formatMinute(23)).toBe("23'");
    });

    it('should handle 0 minute', () => {
      expect(component.formatMinute(0)).toBe("0'");
    });

    it('should handle 45 minutes', () => {
      expect(component.formatMinute(45)).toBe("45'");
    });

    it('should format injury time in first half correctly', () => {
      expect(component.formatMinute(47)).toBe("45+2'");
    });

    it('should handle 90 minutes', () => {
      expect(component.formatMinute(90)).toBe("90'");
    });

    it('should format injury time in second half correctly', () => {
      expect(component.formatMinute(93)).toBe("90+3'");
    });

    it('should handle 90+ minutes', () => {
      expect(component.formatMinute(95)).toBe("90+5'");
      expect(component.formatMinute(100)).toBe("90+10'");
      expect(component.formatMinute(120)).toBe("90+30'");
    });

    it('should format regular first half minutes', () => {
      expect(component.formatMinute(1)).toBe("1'");
      expect(component.formatMinute(15)).toBe("15'");
      expect(component.formatMinute(30)).toBe("30'");
    });

    it('should format regular second half minutes', () => {
      expect(component.formatMinute(46)).toBe("45+1'");
      expect(component.formatMinute(60)).toBe("45+15'");
      expect(component.formatMinute(75)).toBe("45+30'");
    });
  });

  // =============================================================================
  // 9. Score Update Logic Tests
  // =============================================================================

  describe('Score Update Logic Tests', () => {
    beforeEach(() => {
      component.gameId = 'test-game-id';
      fixture.detectChanges();
    });

    it('should not announce when score is initialized', () => {
      component.scoreAnnouncement.set('');
      component['updateTeamScore'](0);
      expect(component.scoreAnnouncement()).toBe('');
    });

    it('should only announce when score increases', () => {
      component.teamScore.set(2);
      component.scoreAnnouncement.set('');

      component['updateTeamScore'](1); // Score decrease
      expect(component.scoreAnnouncement()).toBe('');
    });

    it('should update team score value', () => {
      component['updateTeamScore'](5);
      expect(component.teamScore()).toBe(5);
    });

    it('should update opponent score value', () => {
      component['updateOpponentScore'](3);
      expect(component.opponentScore()).toBe(3);
    });

    it('should include both scores in team goal announcement', () => {
      component.teamScore.set(1);
      component.opponentScore.set(2);
      component['updateTeamScore'](2);

      expect(component.scoreAnnouncement()).toBe('Team scored! Score is now 2 to 2');
    });

    it('should include both scores in opponent goal announcement', () => {
      component.teamScore.set(3);
      component.opponentScore.set(1);
      component['updateOpponentScore'](2);

      expect(component.scoreAnnouncement()).toBe('Opponent scored! Score is now 3 to 2');
    });
  });

  // =============================================================================
  // 10. Timer Display Tests
  // =============================================================================

  describe('Timer Display Tests', () => {
    beforeEach(() => {
      component.gameId = 'test-game-id';
      fixture.detectChanges();
    });

    it('should display timer with correct datetime attribute', () => {
      mockCurrentMinute.set(30);
      fixture.detectChanges();

      const timeElement = fixture.debugElement.query(By.css('time'));
      expect(timeElement.nativeElement.getAttribute('datetime')).toBe('PT30M');
    });

    it('should update datetime attribute when minute changes', () => {
      mockCurrentMinute.set(60);
      fixture.detectChanges();

      const timeElement = fixture.debugElement.query(By.css('time'));
      expect(timeElement.nativeElement.getAttribute('datetime')).toBe('PT60M');
    });

    it('should be clickable for timer adjustment', () => {
      const timerContainer = fixture.debugElement.query(By.css('.timer-container'));
      expect(timerContainer).toBeTruthy();

      spyOn(component, 'openTimerAdjustDialog');
      timerContainer.nativeElement.click();

      expect(component.openTimerAdjustDialog).toHaveBeenCalled();
    });
  });
});
