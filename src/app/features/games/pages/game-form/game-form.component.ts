import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GameService } from '../../services/game.service';
import { TeamService } from '../../../../core/services/team.service';
import { Game } from '../../../../core/models/game.model';

/**
 * GameFormComponent
 * Story: 4.3 Create Game (Manual Entry) & 4.4 Edit Game Details
 * Form for creating and editing games
 */
@Component({
  selector: 'app-game-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="game-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <button mat-icon-button (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
            </button>
            {{ isEditMode() ? 'Edit Game' : 'Create New Game' }}
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          @if (isLoading()) {
            <div class="loading-container">
              <mat-spinner></mat-spinner>
              <p>Loading...</p>
            </div>
          }

          @if (!isLoading()) {
            <form [formGroup]="gameForm" (ngSubmit)="onSubmit()">
              <!-- Opponent -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Opponent Team</mat-label>
                <input matInput formControlName="opponent" placeholder="Team name" required />
                @if (gameForm.get('opponent')?.hasError('required')) {
                  <mat-error>Opponent team is required</mat-error>
                }
              </mat-form-field>

              <!-- Date -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Game Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="gameDate" required />
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                @if (gameForm.get('gameDate')?.hasError('required')) {
                  <mat-error>Date is required</mat-error>
                }
              </mat-form-field>

              <!-- Time -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Game Time</mat-label>
                <input matInput type="time" formControlName="gameTime" required />
                @if (gameForm.get('gameTime')?.hasError('required')) {
                  <mat-error>Time is required</mat-error>
                }
              </mat-form-field>

              <!-- Location -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Location</mat-label>
                <input matInput formControlName="location" placeholder="Stadium or field name" />
              </mat-form-field>

              <!-- Home/Away -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Home or Away</mat-label>
                <mat-select formControlName="home_away">
                  <mat-option [value]="null">Not specified</mat-option>
                  <mat-option value="home">Home</mat-option>
                  <mat-option value="away">Away</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Form Actions -->
              <div class="form-actions">
                <button type="button" mat-stroked-button (click)="goBack()">Cancel</button>
                <button
                  type="submit"
                  mat-raised-button
                  color="primary"
                  [disabled]="gameForm.invalid || isSaving()"
                >
                  @if (isSaving()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  }
                  {{ isEditMode() ? 'Update Game' : 'Create Game' }}
                </button>
              </div>
            </form>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .game-form-container {
        padding: 1rem;
        max-width: 600px;
        margin: 0 auto;
      }

      mat-card {
        margin-top: 1rem;
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        gap: 1rem;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem 0;
      }

      .full-width {
        width: 100%;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1rem;

        button {
          min-width: 120px;
        }
      }

      mat-spinner {
        display: inline-block;
        margin-right: 8px;
      }
    `,
  ],
})
export class GameFormComponent implements OnInit {
  gameForm!: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  gameId: string | null = null;
  teamId = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private teamService: TeamService,
    private snackBar: MatSnackBar,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Get team ID
    this.teamService.currentTeam$.subscribe(team => {
      if (team) {
        this.teamId.set(team.id);
      }
    });

    // Check if we're editing
    this.gameId = this.route.snapshot.paramMap.get('id');
    if (this.gameId) {
      this.isEditMode.set(true);
      this.loadGame(this.gameId);
    } else {
      // Set defaults for create mode
      this.setDefaultDateTime();
    }
  }

  initForm(): void {
    this.gameForm = this.fb.group({
      opponent: ['', Validators.required],
      gameDate: ['', Validators.required],
      gameTime: ['', Validators.required],
      location: [''],
      home_away: [null],
    });
  }

  /**
   * Set default date/time for new games
   * Default: Next Saturday at 10:00 AM
   */
  private setDefaultDateTime(): void {
    const nextSaturday = this.getNextSaturday();
    const defaultTime = '10:00';

    this.gameForm.patchValue({
      gameDate: nextSaturday,
      gameTime: defaultTime,
    });
  }

  /**
   * Calculate next Saturday from today
   */
  private getNextSaturday(): Date {
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    return nextSaturday;
  }

  loadGame(id: string): void {
    this.isLoading.set(true);
    this.gameService.getGame(id).subscribe({
      next: game => {
        if (game) {
          this.populateForm(game);
        } else {
          this.snackBar.open('Game not found', 'Close', { duration: 3000 });
          this.goBack();
        }
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error loading game:', error);
        this.snackBar.open('Error loading game', 'Close', { duration: 3000 });
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  populateForm(game: Game): void {
    const gameDate = new Date(game.date);
    const date = gameDate.toISOString().split('T')[0];
    const time = gameDate.toTimeString().slice(0, 5);

    this.gameForm.patchValue({
      opponent: game.opponent,
      gameDate: gameDate,
      gameTime: time,
      location: game.location || '',
      home_away: game.home_away,
    });

    // Apply restrictions based on game status
    this.applyEditRestrictions(game);
  }

  /**
   * Apply edit restrictions based on game status and protection
   */
  private applyEditRestrictions(game: Game): void {
    // Cannot edit in-progress or completed games (except opponent and location)
    if (game.status === 'in_progress' || game.status === 'completed') {
      this.snackBar.open(
        'Game is in progress or completed. Only opponent and location can be edited.',
        'Close',
        { duration: 5000 },
      );

      // Disable date, time, and home/away fields
      this.gameForm.get('gameDate')?.disable();
      this.gameForm.get('gameTime')?.disable();
      this.gameForm.get('home_away')?.disable();
    }

    // If protected, warn user but allow all fields
    // (Protection is about deletion, not editing)
    if (game.is_protected) {
      this.snackBar.open('This game has recorded data. Changes will affect statistics.', 'OK', {
        duration: 4000,
      });
    }
  }

  onSubmit(): void {
    if (this.gameForm.invalid || !this.teamId()) return;

    this.isSaving.set(true);

    // Get form values (including disabled fields)
    const formValues = this.gameForm.getRawValue();

    // Combine date and time
    const date = new Date(formValues.gameDate);
    const [hours, minutes] = formValues.gameTime.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const gameData = {
      opponent: formValues.opponent,
      date: date.toISOString(),
      location: formValues.location || null,
      home_away: formValues.home_away,
    };

    const operation = this.isEditMode()
      ? this.gameService.updateGame(this.gameId!, gameData)
      : this.gameService.createGame(this.teamId()!, gameData);

    operation.subscribe({
      next: game => {
        // Format date for toast message
        const formattedDate = new Date(gameData.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        if (this.isEditMode()) {
          this.snackBar.open('Game updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/games', this.gameId]);
        } else {
          // Show success message with opponent and date
          this.snackBar.open(`Game created: ${gameData.opponent} on ${formattedDate}`, 'Close', {
            duration: 3000,
          });
          // Navigate to detail page for newly created game
          this.router.navigate(['/games', game.id]);
        }
      },
      error: error => {
        console.error('Error saving game:', error);
        this.snackBar.open(`Error ${this.isEditMode() ? 'updating' : 'creating'} game`, 'Close', {
          duration: 3000,
        });
        this.isSaving.set(false);
      },
    });
  }

  goBack(): void {
    // Check if form is dirty and warn user
    if (this.gameForm.dirty && !this.isEditMode()) {
      const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) {
        return;
      }
    }
    this.router.navigate(['/games']);
  }
}
