import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';

import { PlayerService } from '../../services/player.service';
import { TeamService } from '../../../../core/services/team.service';
import {
  resizeImage,
  validateImageSize,
  validateImageType,
} from '../../../../shared/utils/image-resize.util';

/**
 * PlayerFormComponent
 * Form for adding/editing players with photo upload
 * Story: 2.3 Add Player Form
 */
@Component({
  selector: 'app-player-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './player-form.component.html',
  styleUrl: './player-form.component.scss',
})
export class PlayerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private playerService = inject(PlayerService);
  private teamService = inject(TeamService);
  private snackBar = inject(MatSnackBar);

  // State signals
  isLoading = signal(false);
  isEditMode = signal(false);
  playerId = signal<string | null>(null);
  teamId = signal<string | null>(null);

  // Photo state
  selectedPhoto = signal<File | null>(null);
  photoPreview = signal<string | null>(null);

  // Form
  playerForm!: FormGroup;

  ngOnInit(): void {
    // Initialize form
    this.playerForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      date_of_birth: [null],
      jersey_number: [null, [Validators.min(0), Validators.max(99)]],
      squad: [null],
    });

    // Get team ID
    this.loadTeam();

    // Check if edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.playerId.set(id);
      this.loadPlayer(id);
    }
  }

  /**
   * Load player data for edit mode
   * @private
   */
  private loadPlayer(id: string): void {
    this.isLoading.set(true);
    this.playerService.getPlayer(id).subscribe({
      next: player => {
        if (player) {
          // Populate form with player data
          this.playerForm.patchValue({
            first_name: player.first_name,
            last_name: player.last_name,
            date_of_birth: player.date_of_birth ? new Date(player.date_of_birth) : null,
            jersey_number: player.jersey_number,
            squad: player.squad,
          });

          // Set photo preview if exists
          if (player.photo_url) {
            this.photoPreview.set(player.photo_url);
          }
        } else {
          this.snackBar.open('Player not found', 'Close', { duration: 3000 });
          this.router.navigate(['/players']);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Error loading player', 'Close', { duration: 3000 });
        this.isLoading.set(false);
        this.router.navigate(['/players']);
      },
    });
  }

  /**
   * Load user's team
   */
  private loadTeam(): void {
    this.teamService.getUserTeam().subscribe({
      next: team => {
        if (team) {
          this.teamId.set(team.id);
        } else {
          this.snackBar.open('No team found. Please create a team first.', 'Close', {
            duration: 5000,
          });
          this.router.navigate(['/team-setup']);
        }
      },
      error: () => {
        this.snackBar.open('Error loading team', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Handle photo file selection
   */
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file type
    if (!validateImageType(file)) {
      this.snackBar.open('Invalid file type. Please select a JPEG or PNG image.', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Validate file size (5MB max)
    if (!validateImageSize(file, 5 * 1024 * 1024)) {
      this.snackBar.open('File too large. Maximum size is 5MB.', 'Close', { duration: 3000 });
      return;
    }

    this.selectedPhoto.set(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove selected photo
   */
  removePhoto(): void {
    this.selectedPhoto.set(null);
    this.photoPreview.set(null);
  }

  /**
   * Submit form
   */
  async onSubmit(): Promise<void> {
    if (this.playerForm.invalid || !this.teamId()) {
      this.markFormGroupTouched(this.playerForm);
      return;
    }

    this.isLoading.set(true);

    try {
      const formValue = this.playerForm.value;
      let photoUrl: string | null = this.photoPreview(); // Keep existing photo

      // Upload photo if a new one was selected
      if (this.selectedPhoto()) {
        photoUrl = await this.uploadPhoto();
      }

      const playerData = {
        team_id: this.teamId()!,
        first_name: formValue.first_name,
        last_name: formValue.last_name,
        date_of_birth: formValue.date_of_birth
          ? new Date(formValue.date_of_birth).toISOString().split('T')[0]
          : null,
        jersey_number: formValue.jersey_number || null,
        photo_url: photoUrl,
        squad: formValue.squad || null,
      };

      if (this.isEditMode()) {
        // Update existing player
        this.playerService.updatePlayer(this.playerId()!, playerData).subscribe({
          next: player => {
            this.isLoading.set(false);
            this.snackBar.open(
              `Player updated: ${player.first_name} ${player.last_name}`,
              'Close',
              {
                duration: 3000,
              },
            );
            this.router.navigate(['/players']);
          },
          error: error => {
            this.isLoading.set(false);
            console.error('Error updating player:', error);
            this.snackBar.open('Error updating player. Please try again.', 'Close', {
              duration: 5000,
            });
          },
        });
      } else {
        // Create new player
        this.playerService.createPlayer(playerData).subscribe({
          next: player => {
            this.isLoading.set(false);
            this.snackBar.open(`Player added: ${player.first_name} ${player.last_name}`, 'Close', {
              duration: 3000,
            });
            this.router.navigate(['/players']);
          },
          error: error => {
            this.isLoading.set(false);
            console.error('Error creating player:', error);
            this.snackBar.open('Error creating player. Please try again.', 'Close', {
              duration: 5000,
            });
          },
        });
      }
    } catch (error) {
      this.isLoading.set(false);
      console.error('Error in form submission:', error);
      const action = this.isEditMode() ? 'updating' : 'creating';
      this.snackBar.open(`Error ${action} player. Please try again.`, 'Close', { duration: 5000 });
    }
  }

  /**
   * Upload photo to Supabase Storage
   * @private
   */
  private async uploadPhoto(): Promise<string> {
    const photo = this.selectedPhoto();
    const teamId = this.teamId();

    if (!photo || !teamId) {
      throw new Error('Photo or team ID missing');
    }

    try {
      // Resize image
      const resizedPhoto = await resizeImage(photo, 512, 512, 0.9);

      // Generate temporary player ID for photo upload
      const playerId = crypto.randomUUID();

      // Upload to Supabase
      return await new Promise<string>((resolve, reject) => {
        this.playerService.uploadPlayerPhoto(teamId, playerId, resizedPhoto).subscribe({
          next: url => resolve(url),
          error: err => reject(err),
        });
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  /**
   * Cancel and navigate back
   */
  onCancel(): void {
    if (this.playerForm.dirty) {
      // Show confirmation dialog
      const confirmed = confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }

    this.router.navigate(['/players']);
  }

  /**
   * Delete player (soft delete)
   */
  onDelete(): void {
    if (!this.playerId()) return;

    const confirmed = confirm(
      'Are you sure you want to delete this player? This action can be undone.',
    );
    if (!confirmed) return;

    this.isLoading.set(true);
    this.playerService.deletePlayer(this.playerId()!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Player deleted successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/players']);
      },
      error: error => {
        this.isLoading.set(false);
        console.error('Error deleting player:', error);
        this.snackBar.open('Error deleting player. Please try again.', 'Close', { duration: 5000 });
      },
    });
  }

  /**
   * Mark all form fields as touched to show validation errors
   * @private
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get form field error message
   */
  getErrorMessage(fieldName: string): string {
    const control = this.playerForm.get(fieldName);
    if (!control) return '';

    if (control.hasError('required')) {
      return `${fieldName.replace('_', ' ')} is required`;
    }
    if (control.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength}`;
    }
    if (control.hasError('maxlength')) {
      return `Maximum length is ${control.errors?.['maxlength'].requiredLength}`;
    }
    if (control.hasError('min')) {
      return `Minimum value is ${control.errors?.['min'].min}`;
    }
    if (control.hasError('max')) {
      return `Maximum value is ${control.errors?.['max'].max}`;
    }

    return '';
  }
}
