import { Routes } from '@angular/router';

/**
 * Training feature routes
 * Epic 3: Training Sessions & Attendance
 */
export const TRAINING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/training-list/training-list.component').then(m => m.TrainingListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/training-form/training-form.component').then(m => m.TrainingFormComponent),
  },
  {
    path: 'templates',
    loadComponent: () =>
      import('./pages/training-templates/training-templates.component').then(
        m => m.TrainingTemplatesComponent,
      ),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./pages/training-stats/training-stats.component').then(
        m => m.TrainingStatsComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/training-attendance/training-attendance.component').then(
        m => m.TrainingAttendanceComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/training-form/training-form.component').then(m => m.TrainingFormComponent),
  },
];
