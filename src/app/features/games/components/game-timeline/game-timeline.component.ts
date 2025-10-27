import { Component, Input, OnInit, ViewChild, ElementRef, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GoalService } from '../../../../core/services/goal.service';
import { Goal, OpponentGoal, formatGameMinute } from '../../../../core/models/goal.model';
import { getPlayerFullName } from '../../../../models/player.model';
import { DatabaseService } from '../../../../core/services/database.service';
import { EditGoalModalComponent } from '../edit-goal-modal/edit-goal-modal.component';

// Timeline event types
export type TimelineEventType = 'goal' | 'opponent_goal' | 'half_time';

export interface TimelineEvent {
  type: TimelineEventType;
  minute: number;
  id?: string; // For goal/opponent_goal events
  data?: any; // Original goal or opponent_goal data
  expanded?: boolean;
  // Pre-computed display data
  description?: string;
  scorerName?: string;
  assistNames?: string[]  ;
  timestamp?: string;
  syncState?: 'pending' | 'synced' | 'error';
}

@Component({
  selector: 'app-game-timeline',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './game-timeline.component.html',
  styleUrl: './game-timeline.component.scss'
})
export class GameTimelineComponent implements OnInit {
  @Input({ required: true }) gameId!: string;
  @Input({ required: true }) teamId!: string;
  @ViewChild('timelineContainer') timelineContainer?: ElementRef;

  // Signals
  events = signal<TimelineEvent[]>([]);
  isLoading = signal(false);

  // Computed signals
  isEmpty = computed(() => {
    const allEvents = this.events();
    // Filter out half-time marker to check if there are actual events
    return allEvents.filter(e => e.type !== 'half_time').length === 0;
  });

  constructor(
    private goalService: GoalService,
    private db: DatabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Watch for goal changes and reload events
    effect(() => {
      const goals = this.goalService.goals();
      if (this.gameId) {
        this.loadEvents();
      }
    });

    effect(() => {
      const opponentGoals = this.goalService.opponentGoals();
      if (this.gameId) {
        this.loadEvents();
      }
    });
  }

  ngOnInit() {
    this.loadEvents();
  }

  private async loadEvents() {
    this.isLoading.set(true);

    try {
      // Save current scroll position
      const scrollPos = this.timelineContainer?.nativeElement.scrollTop || 0;

      // Load goals for this game
      const goals = await this.db.db.goals
        .where('game_id')
        .equals(this.gameId)
        .and(g => !g.deleted_at)
        .toArray();

      // Load opponent goals for this game
      const opponentGoals = await this.db.db.opponent_goals
        .where('game_id')
        .equals(this.gameId)
        .and(og => !og.deleted_at)
        .toArray();

      // Create timeline events with pre-computed display data
      const timelineEvents: TimelineEvent[] = [];

      // Add goals
      for (const goal of goals) {
        const player = await this.db.db.players.get(goal.player_id);
        const scorerName = player ? getPlayerFullName(player) : 'Unknown Player';

        // Get assist names if any
        const assistNames: string[] = [];
        const goalAssists = await this.db.db.goal_assists
          .where('goal_id')
          .equals(goal.id)
          .toArray();

        for (const assist of goalAssists) {
          const assistPlayer = await this.db.db.players.get(assist.player_id);
          if (assistPlayer) {
            assistNames.push(getPlayerFullName(assistPlayer));
          }
        }

        // Build description
        let description = `Goal by ${scorerName}`;
        if (assistNames.length > 0) {
          description += ` (Assists: ${assistNames.join(', ')})`;
        }

        timelineEvents.push({
          type: 'goal',
          minute: goal.scored_at_minute,
          id: goal.id,
          data: goal,
          description,
          scorerName,
          assistNames,
          timestamp: goal.scored_at_timestamp,
          syncState: goal.sync_state as 'pending' | 'synced' | 'error'
        });
      }

      // Add opponent goals
      for (const opponentGoal of opponentGoals) {
        timelineEvents.push({
          type: 'opponent_goal',
          minute: opponentGoal.scored_at_minute,
          id: opponentGoal.id,
          data: opponentGoal,
          description: 'Opponent Goal',
          timestamp: opponentGoal.scored_at_timestamp,
          syncState: opponentGoal.sync_state as 'pending' | 'synced' | 'error'
        });
      }

      // Add half-time marker if any event is past 45 minutes
      const hasSecondHalf = timelineEvents.some(e => e.minute >= 45);
      if (hasSecondHalf) {
        timelineEvents.push({
          type: 'half_time',
          minute: 45,
          description: 'HALF TIME'
        });
      }

      // Sort by minute descending (most recent first)
      timelineEvents.sort((a, b) => b.minute - a.minute);

      this.events.set(timelineEvents);

      // Restore scroll position after DOM update
      setTimeout(() => {
        if (this.timelineContainer?.nativeElement) {
          this.timelineContainer.nativeElement.scrollTop = scrollPos;
        }
      });
    } catch (error) {
      console.error('Error loading timeline events:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleExpand(event: TimelineEvent) {
    if (event.type === 'half_time') return; // Half-time marker is not expandable

    const currentEvents = this.events();
    const index = currentEvents.findIndex(e => e.id === event.id);

    if (index !== -1) {
      const updatedEvents = [...currentEvents];
      updatedEvents[index] = {
        ...updatedEvents[index],
        expanded: !updatedEvents[index].expanded
      };
      this.events.set(updatedEvents);
    }
  }

  formatMinute(minute: number): string {
    return formatGameMinute(minute);
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  onEdit(event: TimelineEvent) {
    if (event.type === 'half_time' || !event.id) return;

    if (event.type === 'goal') {
      // Open edit dialog for goal
      const dialogRef = this.dialog.open(EditGoalModalComponent, {
        width: '600px',
        data: {
          goalId: event.id,
          gameId: this.gameId,
          teamId: this.teamId
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result?.success) {
          this.loadEvents(); // Reload timeline
          this.snackBar.open('Goal updated', 'Close', { duration: 2000 });
        }
      });
    } else if (event.type === 'opponent_goal') {
      // For opponent goals, we can only edit the minute and notes
      // Could implement a simpler dialog for opponent goals if needed
      this.snackBar.open('Opponent goal editing coming soon', 'Close', { duration: 2000 });
    }
  }

  onDelete(event: TimelineEvent) {
    if (event.type === 'half_time' || !event.id) return;

    // Show confirmation dialog
    const confirmDelete = confirm(
      `Are you sure you want to delete this ${event.type === 'goal' ? 'goal' : 'opponent goal'}?\n\n${event.description}`
    );

    if (confirmDelete) {
      if (event.type === 'goal') {
        this.goalService.deleteGoal(event.id).subscribe({
          next: () => {
            this.loadEvents(); // Reload timeline
            this.snackBar.open('Goal deleted', 'Close', { duration: 2000 });
          },
          error: (error) => {
            console.error('Error deleting goal:', error);
            this.snackBar.open('Error deleting goal', 'Close', { duration: 3000 });
          }
        });
      } else if (event.type === 'opponent_goal') {
        this.goalService.deleteOpponentGoal(event.id).subscribe({
          next: () => {
            this.loadEvents(); // Reload timeline
            this.snackBar.open('Opponent goal deleted', 'Close', { duration: 2000 });
          },
          error: (error) => {
            console.error('Error deleting opponent goal:', error);
            this.snackBar.open('Error deleting opponent goal', 'Close', { duration: 3000 });
          }
        });
      }
    }
  }

  // Track by function for *ngFor performance
  trackByEvent(index: number, event: TimelineEvent): string {
    return event.id || `${event.type}-${event.minute}`;
  }

  // Get sync status icon
  getSyncIcon(syncState?: 'pending' | 'synced' | 'error'): string {
    switch (syncState) {
      case 'pending':
        return 'cloud_queue';
      case 'synced':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'cloud';
    }
  }

  // Get sync status tooltip
  getSyncTooltip(syncState?: 'pending' | 'synced' | 'error'): string {
    switch (syncState) {
      case 'pending':
        return 'Pending sync';
      case 'synced':
        return 'Synced';
      case 'error':
        return 'Sync error';
      default:
        return 'Unknown sync state';
    }
  }

  // Get sync status class
  getSyncClass(syncState?: 'pending' | 'synced' | 'error'): string {
    return `sync-badge sync-badge--${syncState || 'unknown'}`;
  }
}
