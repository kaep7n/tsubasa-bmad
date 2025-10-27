import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GameService } from '../../services/game.service';
import { Game } from '../../../../core/models/game.model';
import { CancelGameDialogComponent } from '../../components/cancel-game-dialog/cancel-game-dialog.component';

/**
 * GameDetailComponent
 * Story: 4.2 Game List View (Detail view) & 4.5 Cancel Game
 * Displays detailed information about a specific game
 * Note: Full implementation will come with Epic 5 (Player Stats & Lineup)
 */
@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <div class="game-detail-container">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Loading game details...</p>
        </div>
      }

      @if (!isLoading() && game()) {
        <mat-card>
          <mat-card-header>
            <mat-card-title>vs {{ game()!.opponent }}</mat-card-title>
            <mat-card-subtitle>
              {{ formatDate(game()!.date) }} · {{ formatTime(game()!.date) }}
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="game-info">
              @if (game()!.location) {
                <p><strong>Location:</strong> {{ game()!.location }}</p>
              }
              @if (game()!.home_away) {
                <p><strong>Venue:</strong> {{ game()!.home_away === 'home' ? 'Home' : 'Away' }}</p>
              }
              <p><strong>Status:</strong> {{ game()!.status }}</p>

              @if (game()!.status === 'completed' && game()!.final_score_team !== null) {
                <div class="final-score">
                  <h3>Final Score</h3>
                  <p class="score">
                    {{ game()!.final_score_team }} - {{ game()!.final_score_opponent }}
                  </p>
                </div>
              }
            </div>

            <p class="placeholder-note">
              <mat-icon>info</mat-icon>
              Full game details including lineup, attendance, and stats will be available in Epic 5.
            </p>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Back to Games
            </button>
            @if (game()!.status === 'scheduled') {
              <button mat-raised-button color="primary" (click)="editGame()">
                <mat-icon>edit</mat-icon>
                Edit Game
              </button>
              <button mat-raised-button color="warn" (click)="cancelGame()">
                <mat-icon>cancel</mat-icon>
                Cancel Game
              </button>
            }
          </mat-card-actions>
        </mat-card>
      }

      @if (!isLoading() && !game()) {
        <div class="error-container">
          <mat-icon>error_outline</mat-icon>
          <h2>Game Not Found</h2>
          <button mat-raised-button color="primary" (click)="goBack()">Back to Games</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .game-detail-container {
        padding: 1rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .loading-container,
      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        gap: 1rem;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          opacity: 0.5;
        }
      }

      mat-card {
        margin-top: 1rem;
      }

      .game-info {
        margin: 1rem 0;

        p {
          margin: 0.5rem 0;
        }
      }

      .final-score {
        margin-top: 1.5rem;
        padding: 1rem;
        background-color: #f5f5f5;
        border-radius: 8px;
        text-align: center;

        h3 {
          margin: 0 0 0.5rem 0;
        }

        .score {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
        }
      }

      .placeholder-note {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1.5rem;
        padding: 1rem;
        background-color: #e3f2fd;
        border-radius: 8px;
        color: #1976d2;
        font-size: 0.875rem;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      mat-card-actions {
        display: flex;
        gap: 0.5rem;
        padding: 1rem;
      }
    `,
  ],
})
export class GameDetailComponent implements OnInit {
  game = signal<Game | null>(null);
  isLoading = signal(true);
  gameId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('id');
    if (this.gameId) {
      this.loadGame(this.gameId);
    } else {
      this.isLoading.set(false);
    }
  }

  loadGame(id: string): void {
    this.isLoading.set(true);
    this.gameService.getGame(id).subscribe({
      next: game => {
        this.game.set(game);
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error loading game:', error);
        this.isLoading.set(false);
      },
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  goBack(): void {
    this.router.navigate(['/games']);
  }

  editGame(): void {
    if (this.gameId) {
      this.router.navigate(['/games', this.gameId, 'edit']);
    }
  }

  /**
   * Cancel game with confirmation dialog
   */
  cancelGame(): void {
    const game = this.game();
    if (!game) return;

    // Open confirmation dialog
    const dialogRef = this.dialog.open(CancelGameDialogComponent, {
      data: { game },
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && this.gameId) {
        this.gameService.cancelGame(this.gameId).subscribe({
          next: () => {
            // Show undo snackbar
            const snackBarRef = this.snackBar.open('Game cancelled', 'Undo', {
              duration: 5000,
            });

            snackBarRef.onAction().subscribe(() => {
              this.undoCancellation();
            });

            // Navigate back to list
            this.router.navigate(['/games']);
          },
          error: error => {
            console.error('Error cancelling game:', error);
            this.snackBar.open('Error cancelling game', 'Close', { duration: 3000 });
          },
        });
      }
    });
  }

  /**
   * Undo game cancellation
   */
  private undoCancellation(): void {
    if (!this.gameId) return;

    this.gameService.restoreGame(this.gameId).subscribe({
      next: () => {
        this.snackBar.open('Cancellation undone', 'Close', { duration: 2000 });
        // Reload game data
        this.loadGame(this.gameId!);
      },
      error: error => {
        console.error('Error restoring game:', error);
        this.snackBar.open('Error restoring game', 'Close', { duration: 3000 });
      },
    });
  }
}
