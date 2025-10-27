import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Player, getPlayerFullName } from '../../../../models/player.model';
import { Goal, GoalAssist } from '../../../../core/models/goal.model';
import { DatabaseService } from '../../../../core/services/database.service';
import { GoalService } from '../../../../core/services/goal.service';

/**
 * Data passed to the edit goal modal
 */
export interface EditGoalModalData {
  goalId: string;
  gameId: string;
  teamId: string;
}

/**
 * EditGoalModalComponent
 * Material Dialog for editing an existing goal
 * Allows updating scorer, minute, notes, and assists
 */
@Component({
  selector: 'app-edit-goal-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  templateUrl: './edit-goal-modal.component.html',
  styleUrl: './edit-goal-modal.component.scss',
})
export class EditGoalModalComponent implements OnInit {
  editForm!: FormGroup;
  allPlayers: Player[] = [];
  goal: Goal | null = null;
  existingAssists: GoalAssist[] = [];
  isLoading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditGoalModalData,
    private dialogRef: MatDialogRef<EditGoalModalComponent>,
    private fb: FormBuilder,
    private db: DatabaseService,
    private goalService: GoalService,
    private snackBar: MatSnackBar,
  ) {
    this.createForm();
  }

  async ngOnInit() {
    await this.loadData();
  }

  /**
   * Initialize the reactive form
   */
  private createForm() {
    this.editForm = this.fb.group({
      scorer: ['', Validators.required],
      minute: [0, [Validators.required, Validators.min(0), Validators.max(120)]],
      notes: [''],
      assists: [[]], // Array of player IDs
    });
  }

  /**
   * Load goal data, players, and existing assists
   */
  private async loadData() {
    this.isLoading = true;

    try {
      // Load the goal data
      this.goal = (await this.db.db.goals.get(this.data.goalId)) || null;

      if (!this.goal) {
        this.snackBar.open('Goal not found', 'Close', { duration: 3000 });
        this.dialogRef.close();
        return;
      }

      // Load all active players for the team
      this.allPlayers = await this.db.db.players
        .where('team_id')
        .equals(this.data.teamId)
        .and(p => !p.deleted_at)
        .sortBy('last_name');

      // Load existing assists for the goal
      this.existingAssists = await this.db.db.goal_assists
        .where('goal_id')
        .equals(this.data.goalId)
        .toArray();

      // Populate the form with current values
      this.editForm.patchValue({
        scorer: this.goal.player_id,
        minute: this.goal.scored_at_minute,
        notes: this.goal.notes || '',
        assists: this.existingAssists.map(a => a.player_id),
      });
    } catch (error) {
      console.error('Error loading goal data:', error);
      this.snackBar.open('Error loading goal data', 'Close', { duration: 3000 });
      this.dialogRef.close();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get filtered list of players for assists (excluding selected scorer)
   */
  get availableAssistPlayers(): Player[] {
    const scorerId = this.editForm.get('scorer')?.value;
    return this.allPlayers.filter(p => p.id !== scorerId);
  }

  /**
   * Check if a player is selected as an assist
   */
  isAssistSelected(playerId: string): boolean {
    const assists = this.editForm.get('assists')?.value || [];
    return assists.includes(playerId);
  }

  /**
   * Toggle assist selection for a player
   */
  toggleAssist(playerId: string) {
    const assistsControl = this.editForm.get('assists');
    const currentAssists: string[] = assistsControl?.value || [];

    if (currentAssists.includes(playerId)) {
      // Remove assist
      assistsControl?.setValue(currentAssists.filter(id => id !== playerId));
    } else {
      // Add assist
      assistsControl?.setValue([...currentAssists, playerId]);
    }
  }

  /**
   * Get player display name with jersey number
   */
  getPlayerDisplay(player: Player): string {
    const name = getPlayerFullName(player);
    if (player.jersey_number) {
      return `#${player.jersey_number} ${name}`;
    }
    return name;
  }

  /**
   * Save the updated goal
   */
  async onSave() {
    if (this.editForm.invalid || !this.goal) {
      return;
    }

    try {
      const formValue = this.editForm.value;

      // Update goal data
      const updates: Partial<Goal> = {
        player_id: formValue.scorer,
        scored_at_minute: formValue.minute,
        notes: formValue.notes || null,
      };

      // Update goal with new assists
      await this.goalService
        .updateGoalWithAssists(this.data.goalId, updates, formValue.assists)
        .toPromise();

      // Show success message
      const player = this.allPlayers.find(p => p.id === formValue.scorer);
      const playerName = player ? getPlayerFullName(player) : 'Unknown';

      this.snackBar.open(`Goal updated: ${playerName} - ${formValue.minute}'`, 'Close', {
        duration: 3000,
      });

      // Close dialog with success result
      this.dialogRef.close({ success: true });
    } catch (error) {
      console.error('Error updating goal:', error);
      this.snackBar.open('Error updating goal', 'Close', { duration: 3000 });
    }
  }

  /**
   * Cancel and close the dialog
   */
  onCancel() {
    this.dialogRef.close();
  }
}
