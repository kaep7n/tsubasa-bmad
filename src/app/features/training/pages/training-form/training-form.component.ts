import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TrainingSessionService } from '../../services/training-session.service';
import { TrainingTemplateService } from '../../services/training-template.service';
import { TeamService } from '../../../../core/services/team.service';
import { Team } from '../../../../core/models/team.model';
import { TrainingSessionFormData } from '../../../../core/models/training-session.model';
import { TrainingTemplate } from '../../../../core/models/training-template.model';

/**
 * TrainingFormComponent
 * Story: 3.4 Create Training Session (Manual) & 3.8 Edit Training Session Template
 * Form for creating and editing training sessions
 */
@Component({
  selector: 'app-training-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './training-form.component.html',
  styleUrl: './training-form.component.scss',
})
export class TrainingFormComponent implements OnInit {
  sessionForm: FormGroup;
  templates = this.templateService.templates;
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditMode = signal(false);
  sessionId = signal<string | null>(null);
  teamId = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private sessionService: TrainingSessionService,
    private templateService: TrainingTemplateService,
    private teamService: TeamService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
  ) {
    // Initialize form with default values
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0); // 6:00 PM

    this.sessionForm = this.fb.group({
      session_template_id: [null],
      date: [tomorrow, Validators.required],
      time: ['18:00', Validators.required],
      duration_minutes: [90, [Validators.required, Validators.min(1)]],
      location: [''],
      notes: [''],
    });

    // Watch for template selection changes
    this.sessionForm.get('session_template_id')?.valueChanges.subscribe(templateId => {
      if (templateId) {
        this.applyTemplate(templateId);
      }
    });
  }

  ngOnInit(): void {
    // Get current team
    this.teamService.currentTeam$.subscribe((team: Team | null) => {
      if (team) {
        this.teamId.set(team.id);
        this.loadTemplates(team.id);
      }
    });

    // Check if editing existing session
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.sessionId.set(id);
      this.loadSession(id);
    }
  }

  /**
   * Load templates for template dropdown
   */
  loadTemplates(teamId: string): void {
    this.templateService.getTemplates(teamId).subscribe();
  }

  /**
   * Load existing session for editing
   */
  loadSession(sessionId: string): void {
    this.isLoading.set(true);
    this.sessionService.getSession(sessionId).subscribe({
      next: session => {
        if (session) {
          const sessionDate = new Date(session.date);
          const hours = sessionDate.getHours().toString().padStart(2, '0');
          const minutes = sessionDate.getMinutes().toString().padStart(2, '0');

          this.sessionForm.patchValue({
            session_template_id: session.session_template_id,
            date: sessionDate,
            time: `${hours}:${minutes}`,
            duration_minutes: session.duration_minutes,
            location: session.location,
            notes: session.notes,
          });
        }
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error loading session:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error loading session', 'Close', { duration: 3000 });
        this.router.navigate(['/training']);
      },
    });
  }

  /**
   * Apply template defaults to form
   */
  applyTemplate(templateId: string): void {
    this.templateService.getTemplate(templateId).subscribe(template => {
      if (template) {
        // Only update if current values are default/empty
        if (
          this.sessionForm.get('duration_minutes')?.value === 90 ||
          !this.sessionForm.get('duration_minutes')?.value
        ) {
          this.sessionForm.patchValue({
            duration_minutes: template.default_duration_minutes,
          });
        }

        if (!this.sessionForm.get('location')?.value) {
          this.sessionForm.patchValue({
            location: template.default_location,
          });
        }
      }
    });
  }

  /**
   * Submit form (create or update)
   */
  onSubmit(): void {
    if (this.sessionForm.invalid || !this.teamId()) {
      return;
    }

    this.isSubmitting.set(true);

    // Combine date and time into ISO string
    const formValue = this.sessionForm.value;
    const date = new Date(formValue.date);
    const [hours, minutes] = formValue.time.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const sessionData: TrainingSessionFormData = {
      session_template_id: formValue.session_template_id || null,
      date: date.toISOString(),
      duration_minutes: formValue.duration_minutes,
      location: formValue.location || null,
      notes: formValue.notes || null,
    };

    const operation = this.isEditMode()
      ? this.sessionService.updateSession(this.sessionId()!, sessionData)
      : this.sessionService.createSession(this.teamId()!, sessionData);

    operation.subscribe({
      next: session => {
        this.isSubmitting.set(false);
        const action = this.isEditMode() ? 'updated' : 'created';
        this.snackBar.open(`Training session ${action}`, 'Close', { duration: 3000 });

        // Navigate to session detail (or list if detail doesn't exist yet)
        this.router.navigate(['/training', session.id]);
      },
      error: error => {
        console.error('Error saving session:', error);
        this.isSubmitting.set(false);
        this.snackBar.open('Error saving training session', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Cancel and go back to list
   */
  cancel(): void {
    this.router.navigate(['/training']);
  }

  /**
   * Get form title based on mode
   */
  getFormTitle(): string {
    return this.isEditMode() ? 'Edit Training Session' : 'Create Training Session';
  }

  /**
   * Get submit button text based on mode
   */
  getSubmitButtonText(): string {
    return this.isEditMode() ? 'Update Session' : 'Create Session';
  }
}
