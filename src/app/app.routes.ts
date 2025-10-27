import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { unauthGuard } from './core/guards/unauth.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [unauthGuard],
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup/signup.component').then(m => m.SignupComponent),
    canActivate: [unauthGuard],
  },
  {
    path: 'team-setup',
    loadComponent: () =>
      import('./features/team/team-setup/team-setup.component').then(m => m.TeamSetupComponent),
    canActivate: [authGuard],
  },
  // Authenticated routes with layout
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'players',
        loadChildren: () => import('./features/players/players.routes').then(m => m.PLAYERS_ROUTES),
      },
      {
        path: 'training',
        loadChildren: () =>
          import('./features/training/training.routes').then(m => m.TRAINING_ROUTES),
      },
      {
        path: 'games',
        loadChildren: () => import('./features/games/games.routes').then(m => m.GAMES_ROUTES),
      },
      {
        path: 'statistics',
        loadChildren: () =>
          import('./features/statistics/statistics.routes').then(m => m.STATISTICS_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
