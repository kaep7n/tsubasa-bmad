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
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GameService } from '../../services/game.service';
import { TeamService } from '../../../../core/services/team.service';
import {
  Game,
  formatGameDate,
  formatGameTime,
  getGameResultBadge,
  isGameUpcoming,
} from '../../../../core/models/game.model';
import { CalendarImportDialogComponent } from '../../components/calendar-import-dialog/calendar-import-dialog.component';

type FilterType = 'all' | 'upcoming' | 'past' | 'cancelled';

/**
 * GameListComponent
 * Story: 4.2 Game List View
 * Displays chronological list of games with filtering and search
 */
@Component({
  selector: 'app-game-list',
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
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDialogModule,
  ],
  templateUrl: './game-list.component.html',
  styleUrl: './game-list.component.scss',
})
export class GameListComponent implements OnInit {
  // All games from service
  allGames = this.gameService.games;

  // Filter and search state
  filterType = signal<FilterType>('all');
  searchQuery = signal('');

  // Loading state
  isLoading = signal(true);
  isRefreshing = signal(false);

  // Team ID
  teamId = signal<string | null>(null);

  // FAB menu state
  isFabOpen = signal(false);

  // Computed filtered games
  filteredGames = computed(() => {
    let games = this.allGames();
    const filter = this.filterType();
    const search = this.searchQuery().toLowerCase();

    // Apply filter
    if (filter === 'upcoming') {
      games = games.filter(g => isGameUpcoming(g));
    } else if (filter === 'past') {
      games = games.filter(g => g.status === 'completed');
    } else if (filter === 'cancelled') {
      games = games.filter(g => g.status === 'cancelled');
    }

    // Apply search (opponent name)
    if (search) {
      games = games.filter(g => g.opponent.toLowerCase().includes(search));
    }

    return games;
  });

  constructor(
    private gameService: GameService,
    private teamService: TeamService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    // Get current team and load games
    this.teamService.currentTeam$.subscribe(team => {
      if (team) {
        this.teamId.set(team.id);
        this.loadGames(team.id);
      }
    });
  }

  /**
   * Load games for the current team
   */
  loadGames(teamId: string): void {
    this.isLoading.set(true);
    this.gameService.getGames(teamId).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error loading games:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error loading games', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Refresh games from Supabase (pull-to-refresh)
   */
  refreshGames(): void {
    if (!this.teamId()) return;

    this.isRefreshing.set(true);
    this.gameService.refreshGames(this.teamId()!).subscribe({
      next: () => {
        this.isRefreshing.set(false);
        this.snackBar.open('Games refreshed', 'Close', { duration: 2000 });
      },
      error: error => {
        console.error('Error refreshing games:', error);
        this.isRefreshing.set(false);
        this.snackBar.open('Error refreshing games', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Navigate to game detail
   */
  viewGame(game: Game): void {
    this.router.navigate(['/games', game.id]);
  }

  /**
   * Navigate to create game form
   */
  createGame(): void {
    this.isFabOpen.set(false);
    this.router.navigate(['/games/new']);
  }

  /**
   * Open calendar import dialog
   * Stories 4.7 and 4.8
   */
  importCalendar(): void {
    this.isFabOpen.set(false);

    const dialogRef = this.dialog.open(CalendarImportDialogComponent, {
      width: '600px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh games list after import
        if (this.teamId()) {
          this.loadGames(this.teamId()!);
        }
      }
    });
  }

  /**
   * Delete a game (with undo)
   */
  deleteGame(game: Game, event: Event): void {
    event.stopPropagation(); // Prevent navigation to detail

    if (game.is_protected) {
      this.snackBar.open('Cannot delete game with recorded data', 'Close', { duration: 3000 });
      return;
    }

    this.gameService.deleteGame(game.id).subscribe({
      next: () => {
        const snackBarRef = this.snackBar.open('Game deleted', 'Undo', {
          duration: 5000,
        });

        // No undo for deleted games in this version
      },
      error: error => {
        console.error('Error deleting game:', error);
        this.snackBar.open('Error deleting game', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Cancel a game (with undo)
   */
  cancelGame(game: Game, event: Event): void {
    event.stopPropagation(); // Prevent navigation to detail

    this.gameService.cancelGame(game.id).subscribe({
      next: () => {
        const snackBarRef = this.snackBar.open('Game cancelled', 'Undo', {
          duration: 5000,
        });

        snackBarRef.onAction().subscribe(() => {
          this.undoCancellation(game.id);
        });
      },
      error: error => {
        console.error('Error cancelling game:', error);
        this.snackBar.open('Error cancelling game', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Undo game cancellation
   */
  private undoCancellation(gameId: string): void {
    this.gameService.restoreGame(gameId).subscribe({
      next: () => {
        this.snackBar.open('Cancellation undone', 'Close', { duration: 2000 });
      },
      error: error => {
        console.error('Error restoring game:', error);
        this.snackBar.open('Error restoring game', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Navigate to edit game
   */
  editGame(game: Game, event: Event): void {
    event.stopPropagation(); // Prevent navigation to detail
    this.router.navigate(['/games', game.id, 'edit']);
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
   * Toggle FAB menu
   */
  toggleFab(): void {
    this.isFabOpen.set(!this.isFabOpen());
  }

  /**
   * Format helpers
   */
  formatDate(dateString: string): string {
    return formatGameDate(dateString);
  }

  formatTime(dateString: string): string {
    return formatGameTime(dateString);
  }

  getResultBadge(game: Game) {
    return getGameResultBadge(game);
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'in_progress':
        return 'accent';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'warn';
      default:
        return '';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }
}
