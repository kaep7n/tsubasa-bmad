import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  TrainingSessionService,
  TrainingSessionWithAttendance,
} from '../../services/training-session.service';
import { TeamService } from '../../../../core/services/team.service';
import { Team } from '../../../../core/models/team.model';
import {
  formatSessionDate,
  formatSessionTime,
  isSessionPast,
  isSessionToday,
} from '../../../../core/models/training-session.model';

type FilterType = 'all' | 'upcoming' | 'past';

/**
 * TrainingListComponent
 * Story: 3.3 Training Session List View
 * Displays chronological list of training sessions with filtering and search
 */
@Component({
  selector: 'app-training-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './training-list.component.html',
  styleUrl: './training-list.component.scss',
})
export class TrainingListComponent implements OnInit {
  // All sessions from service
  allSessions = this.sessionService.sessions;

  // Filter and search state
  filterType = signal<FilterType>('all');
  searchQuery = signal('');

  // Loading state
  isLoading = signal(true);
  isRefreshing = signal(false);

  // Team ID
  teamId = signal<string | null>(null);

  // Computed filtered sessions
  filteredSessions = computed(() => {
    let sessions = this.allSessions();
    const filter = this.filterType();
    const search = this.searchQuery().toLowerCase();

    // Apply time filter
    if (filter === 'upcoming') {
      sessions = sessions.filter(s => !isSessionPast(s.date));
    } else if (filter === 'past') {
      sessions = sessions.filter(s => isSessionPast(s.date));
    }

    // Apply search filter (location)
    if (search) {
      sessions = sessions.filter(s => s.location?.toLowerCase().includes(search));
    }

    return sessions;
  });

  constructor(
    private sessionService: TrainingSessionService,
    private teamService: TeamService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    // Get current team and load sessions
    this.teamService.currentTeam$.subscribe((team: Team | null) => {
      if (team) {
        this.teamId.set(team.id);
        this.loadSessions(team.id);
      }
    });
  }

  /**
   * Load training sessions for the current team
   */
  loadSessions(teamId: string): void {
    this.isLoading.set(true);
    this.sessionService.getTrainingSessions(teamId).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error loading sessions:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error loading training sessions', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Refresh sessions from Supabase (pull-to-refresh)
   */
  refreshSessions(): void {
    if (!this.teamId()) return;

    this.isRefreshing.set(true);
    this.sessionService.refreshSessions(this.teamId()!).subscribe({
      next: () => {
        this.isRefreshing.set(false);
        this.snackBar.open('Sessions refreshed', 'Close', { duration: 2000 });
      },
      error: error => {
        console.error('Error refreshing sessions:', error);
        this.isRefreshing.set(false);
        this.snackBar.open('Error refreshing sessions', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Navigate to training session detail
   */
  viewSession(session: TrainingSessionWithAttendance): void {
    this.router.navigate(['/training', session.id]);
  }

  /**
   * Navigate to create training session form
   */
  createSession(): void {
    this.router.navigate(['/training/new']);
  }

  /**
   * Delete a training session (with undo)
   */
  deleteSession(session: TrainingSessionWithAttendance, event: Event): void {
    event.stopPropagation(); // Prevent navigation to detail

    this.sessionService.deleteSession(session.id).subscribe({
      next: () => {
        const snackBarRef = this.snackBar.open('Session cancelled', 'Undo', {
          duration: 5000,
        });

        snackBarRef.onAction().subscribe(() => {
          this.undoDelete(session.id);
        });
      },
      error: error => {
        console.error('Error deleting session:', error);
        this.snackBar.open('Error cancelling session', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Undo session deletion
   */
  private undoDelete(sessionId: string): void {
    this.sessionService.restoreSession(sessionId).subscribe({
      next: () => {
        this.snackBar.open('Cancellation undone', 'Close', { duration: 2000 });
      },
      error: error => {
        console.error('Error restoring session:', error);
        this.snackBar.open('Error restoring session', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Change filter type
   */
  onFilterChange(filter: FilterType): void {
    this.filterType.set(filter);
  }

  /**
   * Update search query
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  /**
   * Format helpers
   */
  formatDate(dateString: string): string {
    return formatSessionDate(dateString);
  }

  formatTime(dateString: string): string {
    return formatSessionTime(dateString);
  }

  isToday(dateString: string): boolean {
    return isSessionToday(dateString);
  }

  isPast(dateString: string): boolean {
    return isSessionPast(dateString);
  }

  /**
   * Get attendance percentage for progress bar
   */
  getAttendancePercentage(session: TrainingSessionWithAttendance): number {
    return session.attendance_rate;
  }

  /**
   * Get attendance summary text
   */
  getAttendanceSummary(session: TrainingSessionWithAttendance): string {
    return `${session.attended_count}/${session.total_players} attended`;
  }
}
