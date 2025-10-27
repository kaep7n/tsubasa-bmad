import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { TeamService } from '../../../core/services/team.service';
import { AuthService } from '../../../core/services/auth.service';
import { Team } from '../../../core/models/team.model';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  mobileVisible: boolean;
}

/**
 * LayoutComponent
 * Main application shell with responsive navigation
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State signals
  team = signal<Team | null>(null);
  isMobile = signal(false);
  isSidenavOpen = signal(true);
  activeRoute = signal('');
  isOnline = signal(navigator.onLine);

  // Navigation items
  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'home', mobileVisible: true },
    { label: 'Players', route: '/players', icon: 'people', mobileVisible: true },
    { label: 'Games', route: '/games', icon: 'sports_soccer', mobileVisible: true },
    { label: 'Training', route: '/training', icon: 'fitness_center', mobileVisible: true },
    { label: 'Statistics', route: '/statistics', icon: 'bar_chart', mobileVisible: true },
  ];

  constructor(
    private teamService: TeamService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.loadTeam();
    this.setupRouteListener();
    this.setupOnlineListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load user's team
   */
  private loadTeam(): void {
    this.teamService
      .getUserTeam()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: team => {
          this.team.set(team);
        },
        error: error => {
          console.error('Error loading team:', error);
        },
      });
  }

  /**
   * Listen to route changes
   */
  private setupRouteListener(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(event => {
        this.activeRoute.set(event.urlAfterRedirects);
      });

    // Set initial route
    this.activeRoute.set(this.router.url);
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    fromEvent(window, 'online')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isOnline.set(true);
      });

    fromEvent(window, 'offline')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isOnline.set(false);
      });
  }

  /**
   * Check if screen is mobile size
   */
  @HostListener('window:resize')
  checkScreenSize(): void {
    const isMobileSize = window.innerWidth <= 768;
    this.isMobile.set(isMobileSize);

    // On mobile, close sidenav by default
    if (isMobileSize) {
      this.isSidenavOpen.set(false);
    } else {
      this.isSidenavOpen.set(true);
    }
  }

  /**
   * Toggle sidenav
   */
  toggleSidenav(): void {
    this.isSidenavOpen.set(!this.isSidenavOpen());
  }

  /**
   * Check if route is active
   */
  isRouteActive(route: string): boolean {
    return this.activeRoute().startsWith(route);
  }

  /**
   * Navigate to route
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);

    // Close sidenav on mobile after navigation
    if (this.isMobile()) {
      this.isSidenavOpen.set(false);
    }
  }

  /**
   * Navigate to profile/settings
   */
  navigateToProfile(): void {
    // TODO: Implement profile page
    console.log('Navigate to profile');
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
