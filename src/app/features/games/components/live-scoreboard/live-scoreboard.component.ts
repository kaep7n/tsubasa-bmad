import { Component, Input, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GameTimerService } from '../../../../core/services/game-timer.service';
import { GoalService } from '../../../../core/services/goal.service';
import { SyncService } from '../../../../core/services/sync.service';
import { formatGameMinute } from '../../../../core/models/goal.model';
import { TimerAdjustDialogComponent } from './timer-adjust-dialog.component';

@Component({
  selector: 'app-live-scoreboard',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatTooltipModule],
  templateUrl: './live-scoreboard.component.html',
  styleUrl: './live-scoreboard.component.scss'
})
export class LiveScoreboardComponent implements OnInit {
  @Input({ required: true }) gameId!: string;

  // Signals from services
  currentMinute = this.timerService.currentMinute;
  isRunning = this.timerService.isRunning;
  isHalfTime = this.timerService.isHalfTime;
  syncState = this.syncService.syncState;

  // Score tracking
  teamScore = signal(0);
  opponentScore = signal(0);

  // Animation states
  teamScoreHighlight = signal(false);
  opponentScoreHighlight = signal(false);

  // ARIA announcements
  scoreAnnouncement = signal('');

  // Computed sync icon and tooltip
  syncIcon = computed(() => {
    const state = this.syncState();
    switch (state.status) {
      case 'pending':
        return 'cloud_queue';
      case 'syncing':
        return 'cloud_sync';
      case 'synced':
        return 'cloud_done';
      case 'error':
        return 'cloud_off';
      default:
        return 'cloud';
    }
  });

  syncTooltip = computed(() => {
    const state = this.syncState();
    const pending = state.pendingCount;

    switch (state.status) {
      case 'pending':
        return pending === 1 ? '1 item pending sync' : `${pending} items pending sync`;
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return 'All data synced';
      case 'error':
        return state.error || 'Sync error';
      default:
        return 'Unknown sync state';
    }
  });

  syncIconClass = computed(() => {
    return `sync-icon sync-icon--${this.syncState().status}`;
  });

  constructor(
    private timerService: GameTimerService,
    private goalService: GoalService,
    private syncService: SyncService,
    private dialog: MatDialog
  ) {
    // Watch for score changes and trigger animations
    effect(() => {
      const score = this.teamScore();
      if (score > 0) {
        this.triggerTeamScoreAnimation();
      }
    });

    effect(() => {
      const score = this.opponentScore();
      if (score > 0) {
        this.triggerOpponentScoreAnimation();
      }
    });
  }

  ngOnInit() {
    this.loadScores();

    // Watch for goal changes using effects on the signals
    effect(() => {
      // This effect watches the goals signal
      const goals = this.goalService.goals();
      this.updateTeamScore(goals.filter(g => g.game_id === this.gameId).length);
    });

    effect(() => {
      // This effect watches the opponent goals signal
      const opponentGoals = this.goalService.opponentGoals();
      this.updateOpponentScore(opponentGoals.filter(g => g.game_id === this.gameId).length);
    });
  }

  private async loadScores() {
    // Load initial scores
    this.goalService.getGoalsForGame(this.gameId).subscribe(goals => {
      this.updateTeamScore(goals.length);
    });

    this.goalService.getOpponentGoalsForGame(this.gameId).subscribe(goals => {
      this.updateOpponentScore(goals.length);
    });
  }

  private updateTeamScore(newScore: number) {
    const oldScore = this.teamScore();
    if (newScore > oldScore) {
      this.scoreAnnouncement.set(`Team scored! Score is now ${newScore} to ${this.opponentScore()}`);
    }
    this.teamScore.set(newScore);
  }

  private updateOpponentScore(newScore: number) {
    const oldScore = this.opponentScore();
    if (newScore > oldScore) {
      this.scoreAnnouncement.set(`Opponent scored! Score is now ${this.teamScore()} to ${newScore}`);
    }
    this.opponentScore.set(newScore);
  }

  getVisualState(): 'running' | 'half-time' | 'paused' {
    if (this.isHalfTime()) return 'half-time';
    if (this.isRunning()) return 'running';
    return 'paused';
  }

  formatMinute(minute: number): string {
    return formatGameMinute(minute);
  }

  openTimerAdjustDialog() {
    this.dialog.open(TimerAdjustDialogComponent, {
      width: '320px',
      data: { gameId: this.gameId }
    });
  }

  private triggerTeamScoreAnimation() {
    this.teamScoreHighlight.set(true);
    setTimeout(() => this.teamScoreHighlight.set(false), 200);
  }

  private triggerOpponentScoreAnimation() {
    this.opponentScoreHighlight.set(true);
    setTimeout(() => this.opponentScoreHighlight.set(false), 200);
  }
}
