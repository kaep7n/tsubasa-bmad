import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { timer } from 'rxjs';
import { take, retry } from 'rxjs/operators';
import { TeamService } from '../../../core/services/team.service';
import {
  resizeImage,
  validateImageSize,
  validateImageType,
} from '../../../shared/utils/image-resize.util';

/**
 * TeamSetupComponent
 * Allows coach to create their team profile with name, season, and optional logo
 */
@Component({
  selector: 'app-team-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './team-setup.component.html',
  styleUrls: ['./team-setup.component.scss'],
})
export class TeamSetupComponent implements OnInit {
  teamForm: FormGroup;
  loading = false;
  errorMessage = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadProgress = 0;

  // File upload constraints
  readonly MAX_FILE_SIZE = 2097152; // 2MB
  readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  constructor(
    private fb: FormBuilder,
    private teamService: TeamService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.teamForm = this.fb.group({
      teamName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      season: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{4}$/)]],
    });
  }

  ngOnInit(): void {
    // Set default season to current academic year
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    this.teamForm.patchValue({
      season: `${currentYear}-${nextYear}`,
    });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validate file type
    if (!validateImageType(file, this.ALLOWED_TYPES)) {
      this.errorMessage = 'Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.';
      this.clearFileSelection();
      return;
    }

    // Validate file size
    if (!validateImageSize(file, this.MAX_FILE_SIZE)) {
      this.errorMessage = 'File too large. Maximum size is 2MB.';
      this.clearFileSelection();
      return;
    }

    this.selectedFile = file;
    this.errorMessage = '';

    // Generate preview
    const reader = new FileReader();
    reader.onload = e => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Clear file selection and preview
   */
  clearFileSelection(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    const fileInput = document.getElementById('logoInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Submit team creation form
   */
  onSubmit(): void {
    if (this.teamForm.invalid) {
      this.teamForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.uploadProgress = 0;

    const { teamName, season } = this.teamForm.value;

    // Step 1: Create team
    this.teamService
      .createTeam(teamName, season)
      .pipe(
        take(1),
        retry({
          count: 3,
          delay: (error, retryCount) => {
            console.log(`Retry attempt ${retryCount}:`, error);
            return timer(Math.min(1000 * Math.pow(2, retryCount - 1), 10000));
          },
        }),
      )
      .subscribe({
        next: response => {
          if (response.error) {
            this.errorMessage = response.error.message;
            this.loading = false;
            return;
          }

          if (!response.team) {
            this.errorMessage = 'Failed to create team. Please try again.';
            this.loading = false;
            return;
          }

          const teamId = response.team.id;

          // Step 2: Upload logo if selected
          if (this.selectedFile) {
            this.uploadProgress = 30;
            this.uploadLogo(teamId);
          } else {
            this.onSuccess();
          }
        },
        error: error => {
          console.error('Team creation error:', error);
          this.errorMessage = error.error?.message || 'Failed to create team. Please try again.';
          this.loading = false;
        },
      });
  }

  /**
   * Upload and attach team logo
   */
  private uploadLogo(teamId: string): void {
    if (!this.selectedFile) {
      this.onSuccess();
      return;
    }

    // Resize image before upload
    resizeImage(this.selectedFile, 512, 512, 0.9)
      .then(resizedFile => {
        this.uploadProgress = 50;

        // Upload to Supabase Storage
        this.teamService
          .uploadTeamLogo(teamId, resizedFile)
          .pipe(
            take(1),
            retry({
              count: 2,
              delay: 1000,
            }),
          )
          .subscribe({
            next: logoUrl => {
              this.uploadProgress = 80;

              // Update team record with logo URL
              this.teamService
                .updateTeamLogo(teamId, logoUrl)
                .pipe(take(1))
                .subscribe({
                  next: () => {
                    this.uploadProgress = 100;
                    this.onSuccess();
                  },
                  error: error => {
                    console.error('Logo update error:', error);
                    // Team is created but logo update failed - still count as success
                    this.snackBar.open(
                      'Team created, but logo update failed. You can update it later.',
                      'OK',
                      {
                        duration: 5000,
                      },
                    );
                    this.onSuccess();
                  },
                });
            },
            error: error => {
              console.error('Logo upload error:', error);
              // Team is created but logo upload failed - still count as success
              this.snackBar.open(
                'Team created, but logo upload failed. You can add it later.',
                'OK',
                {
                  duration: 5000,
                },
              );
              this.onSuccess();
            },
          });
      })
      .catch(error => {
        console.error('Image resize error:', error);
        this.errorMessage = 'Failed to process image. Please try a different file.';
        this.loading = false;
      });
  }

  /**
   * Handle successful team creation
   */
  private onSuccess(): void {
    this.loading = false;
    this.snackBar.open('Team created successfully!', 'OK', { duration: 3000 });
    this.router.navigate(['/dashboard']);
  }

  /**
   * Get form field error messages
   */
  getErrorMessage(fieldName: string): string {
    const field = this.teamForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return 'This field is required';
    }

    if (fieldName === 'teamName') {
      if (field.hasError('minlength')) {
        return 'Team name must be at least 2 characters';
      }
      if (field.hasError('maxlength')) {
        return 'Team name cannot exceed 100 characters';
      }
    }

    if (fieldName === 'season') {
      if (field.hasError('pattern')) {
        return 'Season must be in YYYY-YYYY format (e.g., 2024-2025)';
      }
    }

    return '';
  }
}
