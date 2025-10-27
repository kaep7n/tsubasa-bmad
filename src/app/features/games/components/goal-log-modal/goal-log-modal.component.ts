import { Component, Inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Player, getPlayerFullName } from '../../../../models/player.model';
import { DatabaseService } from '../../../../core/services/database.service';
import { GoalService } from '../../../../core/services/goal.service';
import { GameTimerService } from '../../../../core/services/game-timer.service';
import { PlayerSortingService } from '../../../../core/services/player-sorting.service';
import { GoalFormData, OpponentGoalFormData } from '../../../../core/models/goal.model';

interface PlayerWithGoals extends Player {
  goalCount: number;
  usageCount: number; // For smart sorting
}

export interface GoalLogModalData {
  gameId: string;
  teamId: string;
}

@Component({
  selector: 'app-goal-log-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatCheckboxModule
  ],
  templateUrl: './goal-log-modal.component.html',
  styleUrl: './goal-log-modal.component.scss'
})
export class GoalLogModalComponent implements OnInit, OnDestroy {
  // Signals
  allPlayers = signal<PlayerWithGoals[]>([]);
  searchQuery = signal('');
  isLoading = signal(false);

  // Screen state
  currentScreen = signal<'scorer' | 'assists'>('scorer');

  // Selected scorer (for assist screen)
  selectedScorer = signal<PlayerWithGoals | null>(null);

  // Selected assists (Set for efficient toggle)
  selectedAssists = signal<Set<string>>(new Set());

  // Auto-save timeout
  autoSaveTimer: any = null;
  countdownInterval: any = null;
  timeRemaining = signal(10);

  // Long-press detection
  pressTimer: any = null;
  isLongPress = signal(false);

  // Computed filtered list (sorting is done by PlayerSortingService)
  filteredPlayers = computed(() => {
    const players = this.allPlayers();
    const query = this.searchQuery().toLowerCase().trim();

    // Filter by search query only - players are already sorted by the service
    if (query) {
      return players.filter(p =>
        p.first_name.toLowerCase().includes(query) ||
        p.last_name.toLowerCase().includes(query)
      );
    }

    return players;
  });

  showSearch = computed(() => this.allPlayers().length > 15);

  // Filtered players for assists (computed, excludes scorer)
  assistPlayers = computed(() => {
    const scorer = this.selectedScorer();
    if (!scorer) return [];

    return this.filteredPlayers().filter(p => p.id !== scorer.id);
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: GoalLogModalData,
    private dialogRef: MatDialogRef<GoalLogModalComponent>,
    private db: DatabaseService,
    private goalService: GoalService,
    private timerService: GameTimerService,
    private playerSortingService: PlayerSortingService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    await this.loadPlayers();
  }

  private async loadPlayers() {
    this.isLoading.set(true);

    try {
      // Use PlayerSortingService to get sorted players with usage stats
      const sortedPlayers = await this.playerSortingService.getSortedPlayers(
        this.data.gameId,
        this.data.teamId
      );

      // Map to PlayerWithGoals interface
      const playersWithGoals: PlayerWithGoals[] = sortedPlayers.map(player => ({
        ...player,
        // Already includes goalCount and usageCount from service
      }));

      this.allPlayers.set(playersWithGoals);
    } catch (error) {
      console.error('Error loading players:', error);
      this.snackBar.open('Error loading players', 'Close', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  onPlayerSelected(player: PlayerWithGoals, isLongPress: boolean = false) {
    if (isLongPress) {
      // Long-press: Skip assists, save immediately
      this.saveGoalWithoutAssists(player);
    } else {
      // Regular tap: Transition to assist screen
      this.selectedScorer.set(player);
      this.currentScreen.set('assists');
      this.startAutoSaveTimer();
    }
  }

  onPlayerMouseDown(player: PlayerWithGoals) {
    this.isLongPress.set(false);
    this.pressTimer = setTimeout(() => {
      this.isLongPress.set(true);
      this.onPlayerSelected(player, true);
    }, 500);
  }

  onPlayerMouseUp(player: PlayerWithGoals) {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
    }

    if (!this.isLongPress()) {
      this.onPlayerSelected(player, false);
    }
  }

  onPlayerMouseLeave() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
    }
    this.isLongPress.set(false);
  }

  startAutoSaveTimer() {
    this.timeRemaining.set(10);

    // Countdown every second
    this.countdownInterval = setInterval(() => {
      const remaining = this.timeRemaining() - 1;
      this.timeRemaining.set(remaining);

      if (remaining <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);

    // Auto-save after 10 seconds
    this.autoSaveTimer = setTimeout(() => {
      clearInterval(this.countdownInterval);
      this.saveGoalWithSelectedAssists();
    }, 10000);
  }

  clearAutoSaveTimer() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  toggleAssist(playerId: string) {
    const current = new Set(this.selectedAssists());

    if (current.has(playerId)) {
      current.delete(playerId);
    } else {
      current.add(playerId);
    }

    this.selectedAssists.set(current);
  }

  isAssistSelected(playerId: string): boolean {
    return this.selectedAssists().has(playerId);
  }

  async saveGoalWithoutAssists(scorer: PlayerWithGoals) {
    this.clearAutoSaveTimer();
    await this.saveGoal(scorer, []);
  }

  async saveGoalWithSelectedAssists() {
    this.clearAutoSaveTimer();
    const scorer = this.selectedScorer();
    if (!scorer) return;

    const assistIds = Array.from(this.selectedAssists());
    await this.saveGoal(scorer, assistIds);
  }

  private async saveGoal(scorer: PlayerWithGoals, assistPlayerIds: string[]) {
    try {
      const currentMinute = this.timerService.currentMinute();
      const now = new Date().toISOString();

      const goalData: GoalFormData = {
        game_id: this.data.gameId,
        player_id: scorer.id,
        scored_at_minute: currentMinute,
        scored_at_timestamp: now,
        assist_player_ids: assistPlayerIds
      };

      const createdGoal = await this.goalService.createGoal(goalData).toPromise();

      if (!createdGoal) {
        throw new Error('Failed to create goal');
      }

      // Show toast with assists if any
      const playerName = getPlayerFullName(scorer);
      let message = `Goal by ${playerName} - ${currentMinute}'`;

      if (assistPlayerIds.length > 0) {
        const assistNames = assistPlayerIds
          .map(id => {
            const player = this.allPlayers().find(p => p.id === id);
            return player ? getPlayerFullName(player) : '';
          })
          .filter(name => name)
          .join(', ');

        message += ` (Assists: ${assistNames})`;
      }

      const snackBarRef = this.snackBar.open(message, 'Undo', { duration: 5000 });

      // Handle undo action
      snackBarRef.onAction().subscribe(async () => {
        try {
          await this.goalService.deleteGoal(createdGoal!.id).toPromise();
          this.snackBar.open('Goal undone', 'Close', { duration: 2000 });
        } catch (error) {
          console.error('Error undoing goal:', error);
          this.snackBar.open('Error undoing goal', 'Close', { duration: 3000 });
        }
      });

      this.dialogRef.close({ success: true, goalLogged: true });
    } catch (error) {
      console.error('Error logging goal:', error);
      this.snackBar.open('Error logging goal', 'Close', { duration: 3000 });
    }
  }

  async onOpponentGoalClick() {
    try {
      const currentMinute = this.timerService.currentMinute();
      const now = new Date().toISOString();

      // Create opponent goal record
      const opponentGoalData: OpponentGoalFormData = {
        game_id: this.data.gameId,
        scored_at_minute: currentMinute,
        scored_at_timestamp: now
      };

      // Save via service (handles IndexedDB + sync queue)
      const createdOpponentGoal = await this.goalService.createOpponentGoal(opponentGoalData).toPromise();

      if (!createdOpponentGoal) {
        throw new Error('Failed to create opponent goal');
      }

      // Show toast confirmation
      const snackBarRef = this.snackBar.open(
        `Opponent Goal - ${currentMinute}'`,
        'Undo',
        { duration: 5000 }
      );

      // Handle undo action
      snackBarRef.onAction().subscribe(async () => {
        try {
          await this.goalService.deleteOpponentGoal(createdOpponentGoal!.id).toPromise();
          this.snackBar.open('Opponent goal undone', 'Close', { duration: 2000 });
        } catch (error) {
          console.error('Error undoing opponent goal:', error);
          this.snackBar.open('Error undoing opponent goal', 'Close', { duration: 3000 });
        }
      });

      // Close modal
      this.dialogRef.close({ success: true, opponentGoalLogged: true });
    } catch (error) {
      console.error('Error logging opponent goal:', error);
      this.snackBar.open('Error logging opponent goal', 'Close', { duration: 3000 });
    }
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
  }

  getPlayerDisplay(player: PlayerWithGoals): string {
    const name = getPlayerFullName(player);
    if (player.jersey_number) {
      return `#${player.jersey_number} ${name}`;
    }
    return name;
  }

  ngOnDestroy() {
    this.clearAutoSaveTimer();
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
    }
  }
}
