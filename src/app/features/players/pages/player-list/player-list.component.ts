import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, Subject } from 'rxjs';

import { Player } from '../../../../models/player.model';
import { PlayerService } from '../../services/player.service';
import { PlayerCardComponent } from '../../components/player-card/player-card.component';
import { AuthService } from '../../../../core/services/auth.service';
import { TeamService } from '../../../../core/services/team.service';

/**
 * PlayerListComponent
 * Displays a grid of players with search, filter, and sort capabilities
 * Story: 2.2 Player List View
 */
@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PlayerCardComponent,
  ],
  templateUrl: './player-list.component.html',
  styleUrl: './player-list.component.scss',
})
export class PlayerListComponent implements OnInit {
  private playerService = inject(PlayerService);
  private authService = inject(AuthService);
  private teamService = inject(TeamService);
  private router = inject(Router);

  // State signals
  players = signal<Player[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  squadFilter = signal<'all' | 'starters' | 'substitutes' | 'unassigned'>('all');
  sortBy = signal<'name' | 'jersey' | 'goals'>('name');

  // Search debouncer
  private searchSubject = new Subject<string>();

  // Computed filtered and sorted players
  filteredPlayers = computed(() => {
    let filtered = this.players();

    // Apply search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(
        p =>
          p.first_name.toLowerCase().includes(search) || p.last_name.toLowerCase().includes(search),
      );
    }

    // Apply squad filter
    const squad = this.squadFilter();
    if (squad !== 'all') {
      if (squad === 'unassigned') {
        filtered = filtered.filter(p => !p.squad);
      } else {
        filtered = filtered.filter(p => p.squad === squad);
      }
    }

    // Apply sorting
    const sort = this.sortBy();
    filtered = [...filtered].sort((a, b) => {
      if (sort === 'name') {
        return a.first_name.localeCompare(b.first_name);
      } else if (sort === 'jersey') {
        return (a.jersey_number || 999) - (b.jersey_number || 999);
      }
      // Goals sorting will be implemented in Story 2.7
      return 0;
    });

    return filtered;
  });

  ngOnInit(): void {
    // Setup search debounce
    this.searchSubject.pipe(debounceTime(300)).subscribe(term => {
      this.searchTerm.set(term);
    });

    // Load players
    this.loadPlayers();
  }

  /**
   * Load players for current team
   */
  private loadPlayers(): void {
    this.isLoading.set(true);

    // Get user's team
    this.teamService.getUserTeam().subscribe({
      next: team => {
        if (!team) {
          console.error('No team found for user');
          this.isLoading.set(false);
          return;
        }

        this.playerService.getPlayers(team.id).subscribe({
          next: players => {
            this.players.set(players);
            this.isLoading.set(false);
          },
          error: (error: Error) => {
            console.error('Error loading players:', error);
            this.isLoading.set(false);
          },
        });
      },
      error: (error: Error) => {
        console.error('Error loading team:', error);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Handle search input
   */
  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  /**
   * Handle squad filter change
   */
  onSquadFilterChange(filter: 'all' | 'starters' | 'substitutes' | 'unassigned'): void {
    this.squadFilter.set(filter);
  }

  /**
   * Handle sort change
   */
  onSortChange(sort: 'name' | 'jersey' | 'goals'): void {
    this.sortBy.set(sort);
  }

  /**
   * Refresh players (pull-to-refresh)
   */
  refreshPlayers(): void {
    this.loadPlayers();
  }

  /**
   * Navigate to add player form
   */
  addPlayer(): void {
    this.router.navigate(['/players/new']);
  }

  /**
   * Navigate to player edit (detail view to be implemented later)
   */
  viewPlayer(playerId: string): void {
    this.router.navigate(['/players', playerId, 'edit']);
  }

  /**
   * Navigate to squad management
   */
  navigateToSquadManagement(): void {
    this.router.navigate(['/players/squad-management']);
  }
}
