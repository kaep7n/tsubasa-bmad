import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GameTimerService } from '../../../../core/services/game-timer.service';

@Component({
  selector: 'app-timer-adjust-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>Timer Controls</h2>

    <mat-dialog-content>
      <div class="timer-status">
        <p>Current Minute: {{ timerService.currentMinute() }}'</p>
        <p>Status: {{ timerService.isRunning() ? 'Running' : 'Paused' }}</p>
      </div>

      <div class="controls">
        @if (timerService.isRunning()) {
          <button mat-raised-button color="warn" (click)="pause()">
            Pause Timer
          </button>
        } @else {
          <button mat-raised-button color="primary" (click)="resume()">
            Resume Timer
          </button>
        }

        <mat-form-field appearance="outline">
          <mat-label>Set Minute</mat-label>
          <input matInput type="number" min="0" max="120" [(ngModel)]="newMinute">
        </mat-form-field>

        <button mat-raised-button (click)="setMinute()">
          Set Minute
        </button>

        <button mat-raised-button color="warn" (click)="stop()">
          Stop Timer
        </button>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .timer-status {
      margin-bottom: 24px;

      p {
        margin: 8px 0;
        font-size: 16px;
      }
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 16px;

      button {
        width: 100%;
      }

      mat-form-field {
        width: 100%;
      }
    }
  `]
})
export class TimerAdjustDialogComponent {
  newMinute = 0;

  constructor(
    public timerService: GameTimerService,
    private dialogRef: MatDialogRef<TimerAdjustDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { gameId: string }
  ) {
    this.newMinute = this.timerService.currentMinute();
  }

  pause() {
    this.timerService.pauseTimer();
  }

  resume() {
    this.timerService.resumeTimer();
  }

  setMinute() {
    if (this.newMinute >= 0 && this.newMinute <= 120) {
      this.timerService.setMinute(this.newMinute);
    }
  }

  stop() {
    this.timerService.stopTimer();
    this.dialogRef.close();
  }
}
