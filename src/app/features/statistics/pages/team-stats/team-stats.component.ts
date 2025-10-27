import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { PlayerStatsService } from '../../../../core/services/player-stats.service';
import { TeamService } from '../../../../core/services/team.service';
import { TeamStats, DateRange, PlayerStats } from '../../../../core/models/player-stats.model';

type DateRangeOption = 'all' | 'season' | 'month' | 'quarter';

/**
 * TeamStatsComponent
 * Story: 6.3 Team Statistics Dashboard
 * Displays team performance metrics with summary cards and charts
 */
@Component({
  selector: 'app-team-stats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    BaseChartDirective,
  ],
  templateUrl: './team-stats.component.html',
  styleUrl: './team-stats.component.scss',
})
export class TeamStatsComponent implements OnInit {
  // Team stats
  teamStats = signal<TeamStats | null>(null);
  playerStats = signal<PlayerStats[]>([]);

  // Filters
  dateRangeOption = signal<DateRangeOption>('all');

  // Loading state
  isLoading = this.statsService.isCalculating;

  // Team ID
  teamId = signal<string | null>(null);

  // Chart configurations
  goalsTimelineChart: ChartConfiguration<'line'>['data'] | null = null;
  winRateChart: ChartConfiguration<'bar'>['data'] | null = null;
  topScorersChart: ChartConfiguration<'bar'>['data'] | null = null;

  // Chart options
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Goals Per Game Timeline' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: { display: true, position: 'top' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  horizontalBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Top 5 Scorers' },
    },
    scales: {
      x: { beginAtZero: true },
    },
  };

  constructor(
    private statsService: PlayerStatsService,
    private teamService: TeamService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    // Get current team
    this.teamService.currentTeam$.subscribe(team => {
      if (team) {
        this.teamId.set(team.id);
        this.loadStats();
      }
    });
  }

  /**
   * Load team and player statistics
   */
  loadStats(): void {
    if (!this.teamId()) return;

    const dateRange = this.getDateRange();

    // Load team stats
    this.statsService.calculateTeamStats(this.teamId()!, dateRange).subscribe({
      next: stats => {
        this.teamStats.set(stats);
      },
      error: error => {
        console.error('Error loading team stats:', error);
        this.snackBar.open('Error loading team statistics', 'Close', {
          duration: 3000,
        });
      },
    });

    // Load player stats for charts
    this.statsService.calculatePlayerStats(this.teamId()!, dateRange).subscribe({
      next: stats => {
        this.playerStats.set(stats);
        this.buildCharts(stats);
      },
      error: error => {
        console.error('Error loading player stats:', error);
      },
    });
  }

  /**
   * Get date range based on selected option
   */
  private getDateRange(): DateRange | undefined {
    const option = this.dateRangeOption();
    if (option === 'all') return undefined;

    const now = new Date();
    const start = new Date();

    if (option === 'month') {
      start.setMonth(now.getMonth() - 1);
    } else if (option === 'quarter') {
      start.setMonth(now.getMonth() - 3);
    } else if (option === 'season') {
      // Assume season starts September 1st
      const currentYear = now.getFullYear();
      const seasonStart = now.getMonth() >= 8 ? currentYear : currentYear - 1;
      start.setFullYear(seasonStart, 8, 1);
      start.setHours(0, 0, 0, 0);
    }

    return {
      start: start.toISOString(),
      end: now.toISOString(),
    };
  }

  /**
   * Handle date range filter change
   */
  onDateRangeChange(option: DateRangeOption): void {
    this.dateRangeOption.set(option);
    this.loadStats();
  }

  /**
   * Build chart configurations
   */
  private buildCharts(playerStats: PlayerStats[]): void {
    // Top 5 Scorers Chart
    const topScorers = [...playerStats].sort((a, b) => b.goals_scored - a.goals_scored).slice(0, 5);

    this.topScorersChart = {
      labels: topScorers.map(p => p.player_name),
      datasets: [
        {
          label: 'Goals',
          data: topScorers.map(p => p.goals_scored),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };

    // Mock data for goals timeline (would be calculated from games)
    // In a real implementation, this would aggregate goals by game date
    this.goalsTimelineChart = {
      labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'],
      datasets: [
        {
          label: 'Goals Scored',
          data: [3, 2, 4, 1, 3],
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
        },
        {
          label: 'Goals Conceded',
          data: [1, 2, 1, 3, 2],
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.4,
        },
      ],
    };

    // Mock data for win rate (would be calculated from games)
    this.winRateChart = {
      labels: ['Month 1', 'Month 2', 'Month 3'],
      datasets: [
        {
          label: 'Wins',
          data: [3, 4, 2],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
          label: 'Draws',
          data: [1, 0, 2],
          backgroundColor: 'rgba(255, 206, 86, 0.6)',
        },
        {
          label: 'Losses',
          data: [0, 1, 1],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        },
      ],
    };
  }

  /**
   * Get top scorer from player stats
   */
  getTopScorer(): string {
    const players = this.playerStats();
    if (players.length === 0) return 'N/A';

    const topScorer = players.reduce((max, player) =>
      player.goals_scored > max.goals_scored ? player : max,
    );

    return topScorer.goals_scored > 0
      ? `${topScorer.player_name} (${topScorer.goals_scored})`
      : 'N/A';
  }

  /**
   * Get top assister from player stats
   */
  getTopAssister(): string {
    const players = this.playerStats();
    if (players.length === 0) return 'N/A';

    const topAssister = players.reduce((max, player) =>
      player.assists > max.assists ? player : max,
    );

    return topAssister.assists > 0 ? `${topAssister.player_name} (${topAssister.assists})` : 'N/A';
  }

  /**
   * Get average attendance from player stats
   */
  getAverageAttendance(): number {
    const players = this.playerStats();
    if (players.length === 0) return 0;

    const totalAttendance = players.reduce((sum, player) => sum + player.attendance_rate, 0);
    return totalAttendance / players.length;
  }

  /**
   * Check if team has data
   */
  hasData(): boolean {
    const stats = this.teamStats();
    return stats !== null && stats.total_games_played > 0;
  }

  /**
   * Get goal difference indicator class
   */
  getGoalDifferenceClass(diff: number): string {
    if (diff > 0) return 'positive';
    if (diff < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Format goal difference display
   */
  formatGoalDifference(diff: number): string {
    if (diff > 0) return `+${diff}`;
    return diff.toString();
  }
}
