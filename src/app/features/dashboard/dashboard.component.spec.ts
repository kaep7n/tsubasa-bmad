import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { TeamService } from '../../core/services/team.service';
import { GameService } from '../../core/services/game.service';
import { TrainingService } from '../../core/services/training.service';
import { Team } from '../../core/models/team.model';
import { Game } from '../../core/models/game.model';
import { TrainingSession } from '../../core/models/training-session.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockTeamService: jasmine.SpyObj<TeamService>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockTrainingService: jasmine.SpyObj<TrainingService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockTeam: Team = {
    id: 'team-1',
    name: 'Test Team',
    season: '2024-2025',
    logo_url: 'https://example.com/logo.png',
    created_by: 'user-1',
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockUpcomingGame: Game = {
    id: 'game-1',
    coach_id: 'user-1',
    date: new Date(Date.now() + 86400000 * 2), // 2 days from now
    start_time: '15:00',
    opponent: 'Team A',
    location: 'Stadium',
    status: 'scheduled',
    our_score: 0,
    opponent_score: 0,
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockCompletedGame: Game = {
    id: 'game-2',
    coach_id: 'user-1',
    date: new Date(Date.now() - 86400000), // Yesterday
    start_time: '15:00',
    opponent: 'Team B',
    location: 'Stadium',
    status: 'completed',
    our_score: 3,
    opponent_score: 1,
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockTraining: TrainingSession = {
    id: 'training-1',
    coach_id: 'user-1',
    date: new Date(Date.now() + 86400000), // Tomorrow
    start_time: '18:00',
    duration_minutes: 90,
    location: 'Training Ground',
    status: 'scheduled',
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(async () => {
    mockTeamService = jasmine.createSpyObj('TeamService', ['getUserTeam']);
    mockGameService = jasmine.createSpyObj('GameService', ['getUpcomingGames', 'getRecentGames']);
    mockTrainingService = jasmine.createSpyObj('TrainingService', ['getUpcomingTrainingSessions']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Default return values
    mockTeamService.getUserTeam.and.returnValue(of(mockTeam));
    mockGameService.getUpcomingGames.and.returnValue(of([mockUpcomingGame]));
    mockGameService.getRecentGames.and.returnValue(of([mockCompletedGame]));
    mockTrainingService.getUpcomingTrainingSessions.and.returnValue(of([mockTraining]));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: TeamService, useValue: mockTeamService },
        { provide: GameService, useValue: mockGameService },
        { provide: TrainingService, useValue: mockTrainingService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init', () => {
    fixture.detectChanges();

    expect(mockTeamService.getUserTeam).toHaveBeenCalled();
    expect(mockGameService.getUpcomingGames).toHaveBeenCalledWith(3);
    expect(mockGameService.getRecentGames).toHaveBeenCalledWith(5);
    expect(mockTrainingService.getUpcomingTrainingSessions).toHaveBeenCalledWith(3);

    expect(component.team()).toEqual(mockTeam);
    expect(component.upcomingGames().length).toBe(1);
    expect(component.recentGames().length).toBe(1);
    expect(component.upcomingTraining().length).toBe(1);
  });

  it('should show loading state initially', () => {
    expect(component.isLoading()).toBe(true);

    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
  });

  it('should compute hasUpcomingEvents correctly', () => {
    fixture.detectChanges();

    expect(component.hasUpcomingEvents()).toBe(true);

    component.upcomingGames.set([]);
    component.upcomingTraining.set([]);

    expect(component.hasUpcomingEvents()).toBe(false);
  });

  it('should compute hasRecentGames correctly', () => {
    fixture.detectChanges();

    expect(component.hasRecentGames()).toBe(true);

    component.recentGames.set([]);

    expect(component.hasRecentGames()).toBe(false);
  });

  it('should return correct result badge for win', () => {
    const winGame: Game = { ...mockCompletedGame, our_score: 3, opponent_score: 1 };
    const badge = component.getResultBadge(winGame);

    expect(badge.label).toBe('W');
    expect(badge.color).toBe('success');
  });

  it('should return correct result badge for loss', () => {
    const lossGame: Game = { ...mockCompletedGame, our_score: 1, opponent_score: 3 };
    const badge = component.getResultBadge(lossGame);

    expect(badge.label).toBe('L');
    expect(badge.color).toBe('error');
  });

  it('should return correct result badge for draw', () => {
    const drawGame: Game = { ...mockCompletedGame, our_score: 2, opponent_score: 2 };
    const badge = component.getResultBadge(drawGame);

    expect(badge.label).toBe('D');
    expect(badge.color).toBe('warning');
  });

  it('should return correct countdown for today', () => {
    const today = new Date();
    const countdown = component.getCountdown(today);

    expect(countdown).toBe('Today');
  });

  it('should return correct countdown for tomorrow', () => {
    const tomorrow = new Date(Date.now() + 86400000);
    const countdown = component.getCountdown(tomorrow);

    expect(countdown).toBe('Tomorrow');
  });

  it('should return correct countdown for future days', () => {
    const future = new Date(Date.now() + 86400000 * 3); // 3 days from now
    const countdown = component.getCountdown(future);

    expect(countdown).toBe('in 3 days');
  });

  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = component.formatDate(date);

    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
  });

  it('should toggle FAB menu', () => {
    expect(component.isFabOpen()).toBe(false);

    component.toggleFab();
    expect(component.isFabOpen()).toBe(true);

    component.toggleFab();
    expect(component.isFabOpen()).toBe(false);
  });

  it('should navigate to game detail', () => {
    component.navigateToGame('game-1');

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/games', 'game-1']);
  });

  it('should navigate to training detail', () => {
    component.navigateToTraining('training-1');

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/training', 'training-1']);
  });

  it('should navigate to create game and close FAB', () => {
    component.isFabOpen.set(true);
    component.navigateToCreateGame();

    expect(component.isFabOpen()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/games', 'new']);
  });

  it('should navigate to create training and close FAB', () => {
    component.isFabOpen.set(true);
    component.navigateToCreateTraining();

    expect(component.isFabOpen()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/training', 'new']);
  });

  it('should navigate to add player and close FAB', () => {
    component.isFabOpen.set(true);
    component.navigateToAddPlayer();

    expect(component.isFabOpen()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/players', 'new']);
  });

  it('should refresh data when onRefresh is called', () => {
    fixture.detectChanges();

    mockTeamService.getUserTeam.calls.reset();
    mockGameService.getUpcomingGames.calls.reset();
    mockGameService.getRecentGames.calls.reset();
    mockTrainingService.getUpcomingTrainingSessions.calls.reset();

    component.onRefresh();

    expect(mockTeamService.getUserTeam).toHaveBeenCalled();
    expect(mockGameService.getUpcomingGames).toHaveBeenCalled();
    expect(mockGameService.getRecentGames).toHaveBeenCalled();
    expect(mockTrainingService.getUpcomingTrainingSessions).toHaveBeenCalled();
  });

  it('should track online status', () => {
    expect(component.isOnline()).toBe(navigator.onLine);
  });

  it('should display empty state when no upcoming events', () => {
    mockGameService.getUpcomingGames.and.returnValue(of([]));
    mockTrainingService.getUpcomingTrainingSessions.and.returnValue(of([]));

    fixture.detectChanges();

    expect(component.hasUpcomingEvents()).toBe(false);
  });

  it('should display empty state when no recent games', () => {
    mockGameService.getRecentGames.and.returnValue(of([]));

    fixture.detectChanges();

    expect(component.hasRecentGames()).toBe(false);
  });
});