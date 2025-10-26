import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { unauthGuard } from './core/guards/unauth.guard';

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
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'players',
    loadChildren: () => import('./features/players/players.routes').then(m => m.PLAYERS_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
