import { Component, OnInit, signal, computed, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlayerStatsService } from '../../../../core/services/player-stats.service';
import { TeamService } from '../../../../core/services/team.service';
import { PlayerStats, DateRange } from '../../../../core/models/player-stats.model';

type DateRangeOption = 'all' | 'season' | 'month';

/**
 * PlayerStatsComponent
 * Story: 6.2 Player Statistics Dashboard
 * Displays sortable table of player statistics with filters and export
 */
@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.scss',
})
export class PlayerStatsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;

  // Data source for table
  dataSource = new MatTableDataSource<PlayerStats>([]);
  displayedColumns = [
    'player_name',
    'games_played',
    'goals_scored',
    'assists',
    'attendance_rate',
    'training_sessions_attended',
  ];

  // Filters
  searchQuery = signal('');
  dateRangeOption = signal<DateRangeOption>('all');

  // Loading state
  isLoading = this.statsService.isCalculating;

  // Team ID
  teamId = signal<string | null>(null);

  // Top players for badges
  topScorers = signal<string[]>([]);
  topAssisters = signal<string[]>([]);

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

  ngAfterViewInit(): void {
    // Set up sort
    this.dataSource.sort = this.sort;

    // Set default sort
    if (this.sort) {
      this.sort.active = 'goals_scored';
      this.sort.direction = 'desc';
    }

    // Set up custom filter predicate
    this.dataSource.filterPredicate = (data: PlayerStats, filter: string) => {
      return data.player_name.toLowerCase().includes(filter.toLowerCase());
    };
  }

  /**
   * Load player statistics
   */
  loadStats(): void {
    if (!this.teamId()) return;

    const dateRange = this.getDateRange();

    this.statsService.calculatePlayerStats(this.teamId()!, dateRange).subscribe({
      next: stats => {
        this.dataSource.data = stats;
        this.calculateTopPlayers(stats);
      },
      error: error => {
        console.error('Error loading player stats:', error);
        this.snackBar.open('Error loading statistics', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Calculate top 3 players for each metric
   */
  private calculateTopPlayers(stats: PlayerStats[]): void {
    // Top scorers
    const sortedByGoals = [...stats].sort((a, b) => b.goals_scored - a.goals_scored);
    this.topScorers.set(sortedByGoals.slice(0, 3).map(p => p.player_id));

    // Top assisters
    const sortedByAssists = [...stats].sort((a, b) => b.assists - a.assists);
    this.topAssisters.set(sortedByAssists.slice(0, 3).map(p => p.player_id));
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
    } else if (option === 'season') {
      // Assume season starts September 1st
      const currentYear = now.getFullYear();
      const seasonStart = now.getMonth() >= 8 ? currentYear : currentYear - 1; // Sept = month 8 (0-indexed)
      start.setFullYear(seasonStart, 8, 1); // Sept 1st
      start.setHours(0, 0, 0, 0);
    }

    return {
      start: start.toISOString(),
      end: now.toISOString(),
    };
  }

  /**
   * Handle search filter change
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.dataSource.filter = query.trim().toLowerCase();
  }

  /**
   * Handle date range filter change
   */
  onDateRangeChange(option: DateRangeOption): void {
    this.dateRangeOption.set(option);
    this.loadStats();
  }

  /**
   * Get badge rank (1, 2, 3) or 0 if not in top 3
   */
  getGoalsBadgeRank(playerId: string): number {
    const index = this.topScorers().indexOf(playerId);
    return index >= 0 ? index + 1 : 0;
  }

  getAssistsBadgeRank(playerId: string): number {
    const index = this.topAssisters().indexOf(playerId);
    return index >= 0 ? index + 1 : 0;
  }

  /**
   * Get attendance status class
   */
  getAttendanceClass(rate: number): string {
    if (rate >= 70) return 'good';
    if (rate >= 50) return 'warning';
    return 'danger';
  }

  /**
   * Get badge icon based on rank
   */
  getBadgeIcon(rank: number): string {
    switch (rank) {
      case 1:
        return 'emoji_events'; // Gold trophy
      case 2:
        return 'workspace_premium'; // Silver medal
      case 3:
        return 'military_tech'; // Bronze medal
      default:
        return '';
    }
  }

  /**
   * Get badge color based on rank
   */
  getBadgeColor(rank: number): string {
    switch (rank) {
      case 1:
        return 'gold';
      case 2:
        return 'silver';
      case 3:
        return 'bronze';
      default:
        return '';
    }
  }

  /**
   * Export statistics to CSV
   */
  exportToCSV(): void {
    const stats = this.dataSource.filteredData;

    if (stats.length === 0) {
      this.snackBar.open('No statistics to export', 'Close', { duration: 2000 });
      return;
    }

    // Create CSV content
    const headers = [
      'Player Name',
      'Games Played',
      'Goals Scored',
      'Assists',
      'Attendance Rate (%)',
      'Training Sessions Attended',
    ];

    const rows = stats.map(s => [
      s.player_name,
      s.games_played.toString(),
      s.goals_scored.toString(),
      s.assists.toString(),
      s.attendance_rate.toFixed(1),
      s.training_sessions_attended.toString(),
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Excel compatibility
      [headers, ...rows].map(row => row.join(',')).join('\n');

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `tsubasa-player-stats-${new Date().toISOString().split('T')[0]}.csv`,
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.snackBar.open('Statistics exported', 'Close', { duration: 2000 });
  }

  /**
   * Check if table has data
   */
  hasData(): boolean {
    return this.dataSource.data.length > 0;
  }
}
