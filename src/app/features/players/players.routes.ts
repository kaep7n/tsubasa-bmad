import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

/**
 * Players Feature Routes
 * Story: 2.2 Player List View
 */
export const PLAYERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/player-list/player-list.component').then(m => m.PlayerListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/player-form/player-form.component').then(m => m.PlayerFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'squad-management',
    loadComponent: () =>
      import('./pages/squad-management/squad-management.component').then(
        m => m.SquadManagementComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/player-form/player-form.component').then(m => m.PlayerFormComponent),
    canActivate: [authGuard],
  },
  // Future routes for Story 2.5+
  // {
  //   path: ':id',
  //   loadComponent: () =>
  //     import('./pages/player-detail/player-detail.component').then((m) => m.PlayerDetailComponent),
  //   canActivate: [authGuard],
  // },
];
