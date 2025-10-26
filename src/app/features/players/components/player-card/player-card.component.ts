import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Player, getPlayerFullName, getPlayerInitials } from '../../../../models/player.model';

/**
 * PlayerCardComponent
 * Displays player information in a card format
 * Story: 2.2 Player List View
 */
@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.scss',
})
export class PlayerCardComponent {
  // Input signal for player data
  player = input.required<Player>();

  /**
   * Get player's full name
   */
  get fullName(): string {
    return getPlayerFullName(this.player());
  }

  /**
   * Get player's initials for avatar
   */
  get initials(): string {
    return getPlayerInitials(this.player());
  }

  /**
   * Check if player has a photo
   */
  get hasPhoto(): boolean {
    return !!this.player().photo_url;
  }
}
