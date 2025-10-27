import { Routes } from '@angular/router';

/**
 * Games feature routes
 * Epic 4: Game Management & Calendar Integration
 */
export const GAMES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/game-list/game-list.component').then(m => m.GameListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/game-form/game-form.component').then(m => m.GameFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/game-detail/game-detail.component').then(m => m.GameDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/game-form/game-form.component').then(m => m.GameFormComponent),
  },
];
