import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TrainingAttendanceService } from '../../services/training-attendance.service';
import { PlayerService } from '../../../players/services/player.service';
import { Player, getPlayerFullName } from '../../../../models/player.model';
import {
  AttendanceStatus,
  getStatusDisplayText,
  getStatusColorClass,
} from '../../../../core/models/training-attendance.model';

interface PlayerWithAttendance extends Player {
  attendance_status: AttendanceStatus | null;
}

/**
 * TrainingAttendanceComponent
 * Story: 3.5 Mark Training Attendance
 * Component for marking player attendance in training sessions
 */
@Component({
  selector: 'app-training-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './training-attendance.component.html',
  styleUrl: './training-attendance.component.scss',
})
export class TrainingAttendanceComponent implements OnInit {
  @Input({ required: true }) sessionId!: string;
  @Input({ required: true }) teamId!: string;

  players = signal<PlayerWithAttendance[]>([]);
  searchQuery = signal('');
  isLoading = signal(true);

  // Computed filtered players
  filteredPlayers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.players();

    return this.players().filter(player => {
      const fullName = getPlayerFullName(player).toLowerCase();
      return fullName.includes(query);
    });
  });

  // Computed attendance summary
  attendanceSummary = computed(() => {
    const players = this.players();
    const total = players.length;
    const attended = players.filter(p => p.attendance_status === 'attended').length;
    const excused = players.filter(p => p.attendance_status === 'excused').length;
    const absent = players.filter(p => p.attendance_status === 'absent').length;
    const unmarked = players.filter(p => !p.attendance_status).length;

    return {
      total,
      attended,
      excused,
      absent,
      unmarked,
      rate: total > 0 ? Math.round((attended / total) * 100) : 0,
    };
  });

  constructor(
    private attendanceService: TrainingAttendanceService,
    private playerService: PlayerService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadPlayersAndAttendance();
  }

  /**
   * Load players and their attendance status
   */
  loadPlayersAndAttendance(): void {
    this.isLoading.set(true);

    // Load players for the team
    this.playerService.getPlayers(this.teamId).subscribe({
      next: async players => {
        // Get attendance records for this session
        const attendance = await this.attendanceService.getAttendance(this.sessionId).toPromise();

        // Merge player data with attendance status
        const playersWithAttendance: PlayerWithAttendance[] = players.map(player => {
          const record = attendance?.find(a => a.player_id === player.id);
          return {
            ...player,
            attendance_status: record?.status || null,
          };
        });

        this.players.set(playersWithAttendance);
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error loading players:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error loading players', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Toggle attendance status for a player
   * Cycles through: null -> attended -> excused -> absent -> null
   */
  toggleAttendance(player: PlayerWithAttendance): void {
    const currentStatus = player.attendance_status;
    let newStatus: AttendanceStatus;

    // Cycle through statuses
    if (!currentStatus) {
      newStatus = 'attended';
    } else if (currentStatus === 'attended') {
      newStatus = 'excused';
    } else if (currentStatus === 'excused') {
      newStatus = 'absent';
    } else {
      // absent -> back to attended (most common case)
      newStatus = 'attended';
    }

    this.updateAttendance(player, newStatus);
  }

  /**
   * Set specific attendance status for a player
   */
  setAttendance(player: PlayerWithAttendance, status: AttendanceStatus): void {
    this.updateAttendance(player, status);
  }

  /**
   * Update attendance status for a player
   */
  private updateAttendance(player: PlayerWithAttendance, status: AttendanceStatus): void {
    // Optimistic update
    const currentPlayers = this.players();
    const index = currentPlayers.findIndex(p => p.id === player.id);
    if (index !== -1) {
      const updated = [...currentPlayers];
      updated[index] = { ...updated[index], attendance_status: status };
      this.players.set(updated);
    }

    // Save to backend
    this.attendanceService.markAttendance(this.sessionId, player.id, status).subscribe({
      next: () => {
        // Success - optimistic update already applied
      },
      error: error => {
        console.error('Error updating attendance:', error);
        // Revert optimistic update
        this.loadPlayersAndAttendance();
        this.snackBar.open('Error updating attendance', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Mark all players as attended
   */
  markAllAttended(): void {
    const playerIds = this.players().map(p => p.id);

    this.attendanceService.markAllAttended(this.sessionId, playerIds).subscribe({
      next: () => {
        this.loadPlayersAndAttendance();
        this.snackBar.open('All players marked as attended', 'Close', { duration: 2000 });
      },
      error: error => {
        console.error('Error marking all attended:', error);
        this.snackBar.open('Error marking all attended', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Reset all attendance records
   */
  resetAttendance(): void {
    const confirmed = confirm('Reset all attendance? This will clear all attendance records.');
    if (!confirmed) return;

    this.attendanceService.resetAttendance(this.sessionId).subscribe({
      next: () => {
        this.loadPlayersAndAttendance();
        this.snackBar.open('Attendance reset', 'Close', { duration: 2000 });
      },
      error: error => {
        console.error('Error resetting attendance:', error);
        this.snackBar.open('Error resetting attendance', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Update search query
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  /**
   * Get player full name
   */
  getPlayerName(player: Player): string {
    return getPlayerFullName(player);
  }

  /**
   * Get status display text
   */
  getStatusText(status: AttendanceStatus | null): string {
    if (!status) return 'Not marked';
    return getStatusDisplayText(status);
  }

  /**
   * Get status color class
   */
  getStatusClass(status: AttendanceStatus | null): string {
    if (!status) return 'status-unmarked';
    return getStatusColorClass(status);
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: AttendanceStatus | null): string {
    if (!status) return 'help_outline';
    switch (status) {
      case 'attended':
        return 'check_circle';
      case 'excused':
        return 'remove_circle';
      case 'absent':
        return 'cancel';
    }
  }
}
