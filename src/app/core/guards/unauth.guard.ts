import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Unauth Guard
 * Protects routes that should only be accessible to unauthenticated users
 * Redirects authenticated users to /dashboard
 */
export const unauthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(
    take(1),
    map(user => {
      if (!user) {
        return true;
      }

      // User is authenticated, redirect to dashboard
      router.navigate(['/dashboard']);
      return false;
    })
  );
};