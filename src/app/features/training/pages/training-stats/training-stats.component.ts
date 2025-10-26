import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TrainingSessionService } from '../../services/training-session.service';
import { TrainingAttendanceService } from '../../services/training-attendance.service';
import { PlayerService } from '../../../players/services/player.service';
import { TeamService } from '../../../../core/services/team.service';
import { Team } from '../../../../core/models/team.model';
import { formatSessionDate } from '../../../../core/models/training-session.model';
import { getPlayerFullName } from '../../../../models/player.model';

type DateRange = 'season' | 'month' | 'quarter' | 'all';
type ViewMode = 'sessions' | 'players';

interface SessionStats {
  sessionId: string;
  date: string;
  formattedDate: string;
  location: string | null;
  totalPlayers: number;
  attended: number;
  attendanceRate: number;
}

interface PlayerStats {
  playerId: string;
  playerName: string;
  totalSessions: number;
  attended: number;
  excused: number;
  absent: number;
  attendanceRate: number;
}

/**
 * TrainingStatsComponent
 * Story: 3.6 Training Attendance Statistics
 * Displays attendance statistics per session and per player
 */
@Component({
  selector: 'app-training-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './training-stats.component.html',
  styleUrl: './training-stats.component.scss',
})
export class TrainingStatsComponent implements OnInit {
  teamId = signal<string | null>(null);
  isLoading = signal(true);
  dateRange = signal<DateRange>('all');

  // Raw data
  sessions = this.sessionService.sessions;
  players = signal<any[]>([]);
  allAttendance = signal<any[]>([]);

  // Computed stats
  sessionStats = computed(() => {
    const sessions = this.sessions();
    const range = this.dateRange();
    const filtered = this.filterByDateRange(sessions, range);

    return filtered.map(session => ({
      sessionId: session.id,
      date: session.date,
      formattedDate: formatSessionDate(session.date),
      location: session.location,
      totalPlayers: session.total_players,
      attended: session.attended_count,
      attendanceRate: session.attendance_rate,
    }));
  });

  playerStats = computed(() => {
    const sessions = this.sessions();
    const players = this.players();
    const attendance = this.allAttendance();
    const range = this.dateRange();

    // Filter sessions by date range
    const filteredSessions = this.filterByDateRange(sessions, range);
    const sessionIds = new Set(filteredSessions.map(s => s.id));

    // Calculate stats for each player
    return players
      .map(player => {
        const playerAttendance = attendance.filter(
          a => a.player_id === player.id && sessionIds.has(a.training_session_id),
        );

        const attended = playerAttendance.filter(a => a.status === 'attended').length;
        const excused = playerAttendance.filter(a => a.status === 'excused').length;
        const absent = playerAttendance.filter(a => a.status === 'absent').length;
        const total = playerAttendance.length;

        return {
          playerId: player.id,
          playerName: getPlayerFullName(player),
          totalSessions: total,
          attended,
          excused,
          absent,
          attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.attendanceRate - a.attendanceRate);
  });

  constructor(
    private sessionService: TrainingSessionService,
    private attendanceService: TrainingAttendanceService,
    private playerService: PlayerService,
    private teamService: TeamService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.teamService.currentTeam$.subscribe((team: Team | null) => {
      if (team) {
        this.teamId.set(team.id);
        this.loadData(team.id);
      }
    });
  }

  /**
   * Load all data needed for statistics
   */
  async loadData(teamId: string): Promise<void> {
    this.isLoading.set(true);

    try {
      // Load sessions
      await this.sessionService.getTrainingSessions(teamId).toPromise();

      // Load players
      const players = await this.playerService.getPlayers(teamId).toPromise();
      this.players.set(players || []);

      // Load all attendance records for the team
      const sessions = this.sessions();
      const allAttendance: any[] = [];

      for (const session of sessions) {
        const attendance = await this.attendanceService.getAttendance(session.id).toPromise();
        allAttendance.push(...(attendance || []));
      }

      this.allAttendance.set(allAttendance);
      this.isLoading.set(false);
    } catch (error) {
      console.error('Error loading data:', error);
      this.isLoading.set(false);
      this.snackBar.open('Error loading statistics', 'Close', { duration: 3000 });
    }
  }

  /**
   * Filter sessions by date range
   */
  private filterByDateRange(sessions: any[], range: DateRange): any[] {
    if (range === 'all') return sessions;

    const now = new Date();
    let cutoff: Date;

    switch (range) {
      case 'month':
        cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'season':
        // Assume season starts in September
        const seasonYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        cutoff = new Date(seasonYear, 8, 1); // September 1st
        break;
      default:
        return sessions;
    }

    return sessions.filter(s => new Date(s.date) >= cutoff);
  }

  /**
   * Change date range filter
   */
  onDateRangeChange(range: DateRange): void {
    this.dateRange.set(range);
  }

  /**
   * Export player stats to CSV
   */
  exportToCSV(): void {
    const stats = this.playerStats();

    if (stats.length === 0) {
      this.snackBar.open('No data to export', 'Close', { duration: 2000 });
      return;
    }

    // Create CSV content
    const headers = [
      'Player Name',
      'Total Sessions',
      'Attended',
      'Excused',
      'Absent',
      'Attendance Rate (%)',
    ];
    const rows = stats.map(s => [
      s.playerName,
      s.totalSessions,
      s.attended,
      s.excused,
      s.absent,
      s.attendanceRate,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `training-attendance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Statistics exported', 'Close', { duration: 2000 });
  }

  /**
   * Get attendance rate color class
   */
  getAttendanceRateClass(rate: number): string {
    if (rate >= 90) return 'rate-high';
    if (rate >= 70) return 'rate-medium';
    return 'rate-low';
  }

  /**
   * Get date range label
   */
  getDateRangeLabel(range: DateRange): string {
    switch (range) {
      case 'season':
        return 'Season';
      case 'month':
        return 'Last Month';
      case 'quarter':
        return 'Last 3 Months';
      case 'all':
        return 'All Time';
    }
  }
}
