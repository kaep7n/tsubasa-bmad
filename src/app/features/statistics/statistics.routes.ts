import { Routes } from '@angular/router';

export const STATISTICS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./pages/team-stats/team-stats.component').then(m => m.TeamStatsComponent),
  },
  {
    path: 'players',
    loadComponent: () =>
      import('./pages/player-stats/player-stats.component').then(m => m.PlayerStatsComponent),
  },
];
