import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Player, getPlayerFullName } from '../../../../models/player.model';
import { PlayerService } from '../../services/player.service';
import { TeamService } from '../../../../core/services/team.service';

/**
 * SquadManagementComponent
 * Drag-and-drop interface for assigning players to squads
 * Story: 2.6 Squad Management
 */
@Component({
  selector: 'app-squad-management',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './squad-management.component.html',
  styleUrl: './squad-management.component.scss',
})
export class SquadManagementComponent implements OnInit {
  private playerService = inject(PlayerService);
  private teamService = inject(TeamService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // State signals
  isLoading = signal(true);
  isSaving = signal(false);
  allPlayers = signal<Player[]>([]);

  // Squad lists
  unassigned = computed(() => this.allPlayers().filter(p => !p.squad));
  starters = computed(() => this.allPlayers().filter(p => p.squad === 'starters'));
  substitutes = computed(() => this.allPlayers().filter(p => p.squad === 'substitutes'));

  // Track changes
  private changedPlayers = new Map<string, 'starters' | 'substitutes' | null>();

  ngOnInit(): void {
    this.loadPlayers();
  }

  /**
   * Load all players
   */
  private loadPlayers(): void {
    this.isLoading.set(true);
    this.teamService.getUserTeam().subscribe({
      next: team => {
        if (!team) {
          this.snackBar.open('No team found', 'Close', { duration: 3000 });
          this.router.navigate(['/players']);
          return;
        }

        this.playerService.getPlayers(team.id).subscribe({
          next: players => {
            this.allPlayers.set(players);
            this.isLoading.set(false);
          },
          error: () => {
            this.snackBar.open('Error loading players', 'Close', { duration: 3000 });
            this.isLoading.set(false);
          },
        });
      },
      error: () => {
        this.snackBar.open('Error loading team', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Handle drag and drop
   */
  drop(event: CdkDragDrop<Player[]>, targetSquad: 'starters' | 'substitutes' | null): void {
    if (event.previousContainer === event.container) {
      // Same container - reorder
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Different container - transfer
      const player = event.previousContainer.data[event.previousIndex];

      // Update player's squad assignment
      const updatedPlayer = { ...player, squad: targetSquad };

      // Track the change
      this.changedPlayers.set(player.id, targetSquad);

      // Update the players array
      const players = this.allPlayers();
      const index = players.findIndex(p => p.id === player.id);
      if (index !== -1) {
        const newPlayers = [...players];
        newPlayers[index] = updatedPlayer;
        this.allPlayers.set(newPlayers);
      }

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  /**
   * Get player display name
   */
  getPlayerName(player: Player): string {
    return getPlayerFullName(player);
  }

  /**
   * Save all changes
   */
  saveChanges(): void {
    if (this.changedPlayers.size === 0) {
      this.snackBar.open('No changes to save', 'Close', { duration: 2000 });
      return;
    }

    this.isSaving.set(true);
    let savedCount = 0;
    const totalChanges = this.changedPlayers.size;

    this.changedPlayers.forEach((squad, playerId) => {
      this.playerService.updatePlayer(playerId, { squad }).subscribe({
        next: () => {
          savedCount++;
          if (savedCount === totalChanges) {
            this.isSaving.set(false);
            this.changedPlayers.clear();
            this.snackBar.open(`Squad assignments saved (${totalChanges} players)`, 'Close', {
              duration: 3000,
            });
          }
        },
        error: () => {
          this.isSaving.set(false);
          this.snackBar.open('Error saving changes. Please try again.', 'Close', {
            duration: 5000,
          });
        },
      });
    });
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    if (this.changedPlayers.size > 0) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }

    this.router.navigate(['/players']);
  }

  /**
   * Check if there are unsaved changes
   */
  get hasChanges(): boolean {
    return this.changedPlayers.size > 0;
  }
}
