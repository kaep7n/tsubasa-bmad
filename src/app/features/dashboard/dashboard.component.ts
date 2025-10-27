import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { combineLatest, fromEvent, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { TeamService } from '../../core/services/team.service';
import { GameService } from '../../core/services/game.service';
import { TrainingService } from '../../core/services/training.service';
import { Team } from '../../core/models/team.model';
import { Game, GameResultBadge } from '../../core/models/game.model';
import { TrainingSession } from '../../core/models/training-session.model';

/**
 * DashboardComponent
 * Main landing page displaying team overview, upcoming events, and recent results
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatMenuModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State signals
  team = signal<Team | null>(null);
  upcomingGames = signal<Game[]>([]);
  upcomingTraining = signal<TrainingSession[]>([]);
  recentGames = signal<Game[]>([]);
  isLoading = signal(true);
  isOnline = signal(navigator.onLine);
  isFabOpen = signal(false);

  // Computed signals
  hasUpcomingEvents = computed(
    () => this.upcomingGames().length > 0 || this.upcomingTraining().length > 0,
  );

  hasRecentGames = computed(() => this.recentGames().length > 0);

  constructor(
    private teamService: TeamService,
    private gameService: GameService,
    private trainingService: TrainingService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupOnlineListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.isLoading.set(true);

    this.teamService
      .getUserTeam()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: team => {
          if (team) {
            this.team.set(team);

            combineLatest([
              this.gameService.getUpcomingGames(team.id, 3),
              this.trainingService.getUpcomingTrainingSessions(team.id, 3),
              this.gameService.getRecentGames(team.id, 5),
            ])
              .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isLoading.set(false)),
              )
              .subscribe({
                next: ([upcomingGames, upcomingTraining, recentGames]) => {
                  this.upcomingGames.set(upcomingGames);
                  this.upcomingTraining.set(upcomingTraining);
                  this.recentGames.set(recentGames);
                },
                error: error => {
                  console.error('Error loading dashboard data:', error);
                },
              });
          } else {
            this.isLoading.set(false);
          }
        },
        error: error => {
          console.error('Error loading team:', error);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    fromEvent(window, 'online')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isOnline.set(true);
        this.onRefresh();
      });

    fromEvent(window, 'offline')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isOnline.set(false);
      });
  }

  /**
   * Pull-to-refresh handler
   */
  onRefresh(): void {
    this.loadDashboardData();
  }

  /**
   * Get result badge for a game
   * @param game Game to evaluate
   * @returns GameResultBadge
   */
  getResultBadge(game: Game): GameResultBadge {
    if (game.final_score_team === null || game.final_score_opponent === null) {
      return { label: 'D', color: 'warning' }; // Default if no scores
    }

    if (game.final_score_team > game.final_score_opponent) {
      return { label: 'W', color: 'success' };
    } else if (game.final_score_team < game.final_score_opponent) {
      return { label: 'L', color: 'error' };
    } else {
      return { label: 'D', color: 'warning' };
    }
  }

  /**
   * Get countdown text for event
   * @param eventDate Event date (Date or string)
   * @returns string (e.g., "Today", "Tomorrow", "in 3 days")
   */
  getCountdown(eventDate: Date | string): string {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);

    const diffTime = event.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `in ${diffDays} days`;
    return 'Past event';
  }

  /**
   * Format date to readable string
   * @param date Date to format (Date or string)
   * @returns string (e.g., "Mon, Jan 15")
   */
  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }

  /**
   * Format game time from ISO string
   * @param dateString ISO date string
   * @returns string (e.g., "6:00 PM")
   */
  formatGameTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  /**
   * Format time from ISO string
   * @param dateString ISO date string
   * @returns string (e.g., "6:00 PM")
   */
  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  /**
   * Toggle FAB menu
   */
  toggleFab(): void {
    this.isFabOpen.set(!this.isFabOpen());
  }

  /**
   * Navigate to game detail
   * @param gameId Game ID
   */
  navigateToGame(gameId: string): void {
    this.router.navigate(['/games', gameId]);
  }

  /**
   * Navigate to training detail
   * @param trainingId Training session ID
   */
  navigateToTraining(trainingId: string): void {
    this.router.navigate(['/training', trainingId]);
  }

  /**
   * Navigate to create game
   */
  navigateToCreateGame(): void {
    this.isFabOpen.set(false);
    this.router.navigate(['/games', 'new']);
  }

  /**
   * Navigate to create training
   */
  navigateToCreateTraining(): void {
    this.isFabOpen.set(false);
    this.router.navigate(['/training', 'new']);
  }

  /**
   * Navigate to add player
   */
  navigateToAddPlayer(): void {
    this.isFabOpen.set(false);
    this.router.navigate(['/players', 'new']);
  }
}
