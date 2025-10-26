import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TrainingTemplateService } from '../../services/training-template.service';
import { TeamService } from '../../../../core/services/team.service';
import { Team } from '../../../../core/models/team.model';
import {
  TrainingTemplate,
  TrainingTemplateFormData,
} from '../../../../core/models/training-template.model';

/**
 * TrainingTemplatesComponent
 * Story: 3.2 Training Template Creation
 * Manages reusable training session templates
 */
@Component({
  selector: 'app-training-templates',
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
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './training-templates.component.html',
  styleUrl: './training-templates.component.scss',
})
export class TrainingTemplatesComponent implements OnInit {
  templateForm: FormGroup;
  templates = this.templateService.templates;
  isLoading = signal(true);
  isSubmitting = signal(false);
  editingTemplate = signal<TrainingTemplate | null>(null);
  teamId = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private templateService: TrainingTemplateService,
    private teamService: TeamService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      default_duration_minutes: [90, [Validators.required, Validators.min(1)]],
      default_location: ['', Validators.maxLength(200)],
    });
  }

  ngOnInit(): void {
    // Get current team and load templates
    this.teamService.currentTeam$.subscribe((team: Team | null) => {
      if (team) {
        this.teamId.set(team.id);
        this.loadTemplates(team.id);
      }
    });
  }

  /**
   * Load templates for the current team
   */
  loadTemplates(teamId: string): void {
    this.isLoading.set(true);
    this.templateService.getTemplates(teamId).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error loading templates:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error loading templates', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Handle form submission (create or update)
   */
  onSubmit(): void {
    if (this.templateForm.invalid || !this.teamId()) {
      return;
    }

    this.isSubmitting.set(true);
    const formData: TrainingTemplateFormData = {
      name: this.templateForm.value.name,
      default_duration_minutes: this.templateForm.value.default_duration_minutes,
      default_location: this.templateForm.value.default_location || null,
    };

    const operation = this.editingTemplate()
      ? this.templateService.updateTemplate(this.editingTemplate()!.id, formData)
      : this.templateService.createTemplate(this.teamId()!, formData);

    operation.subscribe({
      next: template => {
        this.isSubmitting.set(false);
        const action = this.editingTemplate() ? 'updated' : 'created';
        this.snackBar.open(`Template ${action}: ${template.name}`, 'Close', {
          duration: 3000,
        });
        this.resetForm();
      },
      error: error => {
        console.error('Error saving template:', error);
        this.isSubmitting.set(false);
        this.snackBar.open('Error saving template', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Edit an existing template
   */
  editTemplate(template: TrainingTemplate): void {
    this.editingTemplate.set(template);
    this.templateForm.patchValue({
      name: template.name,
      default_duration_minutes: template.default_duration_minutes,
      default_location: template.default_location,
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Delete a template
   */
  deleteTemplate(template: TrainingTemplate): void {
    const confirmed = confirm(
      `Delete template "${template.name}"? Existing sessions will not be affected.`,
    );

    if (!confirmed) return;

    this.templateService.deleteTemplate(template.id).subscribe({
      next: () => {
        this.snackBar.open(`Template deleted: ${template.name}`, 'Close', { duration: 3000 });
      },
      error: error => {
        console.error('Error deleting template:', error);
        this.snackBar.open('Error deleting template', 'Close', { duration: 3000 });
      },
    });
  }

  /**
   * Cancel editing and reset form
   */
  cancelEdit(): void {
    this.resetForm();
  }

  /**
   * Reset form to initial state
   */
  private resetForm(): void {
    this.templateForm.reset({
      name: '',
      default_duration_minutes: 90,
      default_location: '',
    });
    this.editingTemplate.set(null);
  }

  /**
   * Get form title based on editing state
   */
  getFormTitle(): string {
    return this.editingTemplate() ? 'Edit Template' : 'Create Template';
  }

  /**
   * Get submit button text based on editing state
   */
  getSubmitButtonText(): string {
    return this.editingTemplate() ? 'Update Template' : 'Create Template';
  }
}
