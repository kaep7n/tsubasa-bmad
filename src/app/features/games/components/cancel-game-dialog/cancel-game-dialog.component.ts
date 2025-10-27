import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Game } from '../../../../core/models/game.model';

/**
 * CancelGameDialogComponent
 * Story: 4.5 Cancel Game
 * Confirmation dialog for cancelling a game
 */
@Component({
  selector: 'app-cancel-game-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>warning</mat-icon>
      Cancel this game?
    </h2>

    <mat-dialog-content>
      <p class="game-info">
        <strong>{{ data.game.opponent }}</strong
        ><br />
        {{ formatDate(data.game.date) }}
      </p>

      <p class="preservation-message">
        If attendance or goals have been recorded, they will be preserved but marked as cancelled.
        This action can be undone.
      </p>

      @if (data.game.is_protected) {
        <div class="warning-box">
          <mat-icon>error</mat-icon>
          <p>
            <strong>Warning:</strong> This game has recorded attendance or goals. Cancelling will
            affect your statistics.
          </p>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Keep Game</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">Cancel Game</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        mat-icon {
          color: #f57c00;
        }
      }

      mat-dialog-content {
        padding: 1rem 0;
        min-width: 300px;
      }

      .game-info {
        margin-bottom: 1rem;
        padding: 0.75rem;
        background-color: #f5f5f5;
        border-radius: 4px;
      }

      .preservation-message {
        margin: 1rem 0;
        line-height: 1.5;
      }

      .warning-box {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.75rem;
        background-color: #fff3e0;
        border-left: 4px solid #f57c00;
        border-radius: 4px;
        margin-top: 1rem;

        mat-icon {
          color: #f57c00;
          flex-shrink: 0;
        }

        p {
          margin: 0;
          font-size: 0.875rem;
        }
      }

      mat-dialog-actions {
        padding: 1rem 0 0 0;
      }
    `,
  ],
})
export class CancelGameDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CancelGameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { game: Game },
  ) {}

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
