import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { GoogleCalendarSyncService } from '../../../../core/services/google-calendar-sync.service';
import { TeamService } from '../../../../core/services/team.service';
import { GameService } from '../../services/game.service';
import { GoogleCalendar } from '../../../../core/models/calendar-sync.model';
import { GameFormData } from '../../../../core/models/game.model';
import ICAL from 'ical.js';

/**
 * Interface for parsed iCal event
 */
interface ParsedEvent {
  id: string;
  summary: string;
  date: string;
  location: string;
  selected: boolean;
  editableOpponent: string;
  isDuplicate?: boolean;
}

/**
 * CalendarImportDialogComponent
 * Stories: 4.6 iCal Import, 4.7 Google Calendar OAuth, 4.8 Calendar Backfill
 * Dialog for importing games from iCal files or Google Calendar
 */
@Component({
  selector: 'app-calendar-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>calendar_month</mat-icon>
      {{ getDialogTitle() }}
    </h2>

    <mat-dialog-content>
      <!-- Method Selection Screen -->
      @if (currentMethod() === 'select') {
        <div class="method-selection">
          <p class="selection-prompt">Choose how you want to import games:</p>

          <div class="method-cards">
            <button class="method-card" (click)="selectMethod('ical')">
              <mat-icon class="method-icon">upload_file</mat-icon>
              <h3>Upload iCal File</h3>
              <p>Import games from an .ics calendar file</p>
            </button>

            <button class="method-card" (click)="selectMethod('google')">
              <mat-icon class="method-icon">cloud</mat-icon>
              <h3>Connect Google Calendar</h3>
              <p>Sync games from your Google Calendar</p>
            </button>
          </div>
        </div>
      }

      <!-- iCal Upload Flow -->
      @if (currentMethod() === 'ical') {
        <div class="ical-flow">
          <!-- File Upload -->
          @if (!parsedEvents().length) {
            <div class="upload-section">
              <input
                #fileInput
                type="file"
                accept=".ics"
                (change)="onFileSelected($event)"
                style="display: none"
              />

              <div class="upload-prompt">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <p>Select an iCal (.ics) file to import</p>
                <button
                  mat-raised-button
                  color="primary"
                  (click)="fileInput.click()"
                  [disabled]="isProcessing()"
                >
                  <mat-icon>folder_open</mat-icon>
                  Choose File
                </button>
              </div>

              @if (isProcessing()) {
                <div class="processing">
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                  <p>Processing iCal file...</p>
                </div>
              }

              @if (errorMessage()) {
                <div class="error-message">
                  <mat-icon>error</mat-icon>
                  <p>{{ errorMessage() }}</p>
                </div>
              }

              <div class="info-note">
                <mat-icon>info</mat-icon>
                <p>
                  <strong>Note:</strong> Events with keywords like "training", "practice",
                  "meeting", "drill", or "session" will be filtered out automatically.
                </p>
              </div>
            </div>
          }

          <!-- Event Preview Table -->
          @if (parsedEvents().length) {
            <div class="preview-section">
              <div class="preview-header">
                <p>
                  Found <strong>{{ parsedEvents().length }}</strong> event(s). Select which games to
                  import:
                </p>
                <div class="preview-actions">
                  <button mat-button (click)="selectAllEvents()">
                    <mat-icon>check_box</mat-icon>
                    Select All
                  </button>
                  <button mat-button (click)="deselectAllEvents()">
                    <mat-icon>check_box_outline_blank</mat-icon>
                    Deselect All
                  </button>
                </div>
              </div>

              <div class="events-table-container">
                <table mat-table [dataSource]="parsedEvents()" class="events-table">
                  <!-- Checkbox Column -->
                  <ng-container matColumnDef="select">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let event">
                      <mat-checkbox
                        [(ngModel)]="event.selected"
                        [disabled]="event.isDuplicate"
                      ></mat-checkbox>
                    </td>
                  </ng-container>

                  <!-- Opponent Column -->
                  <ng-container matColumnDef="opponent">
                    <th mat-header-cell *matHeaderCellDef>Opponent</th>
                    <td mat-cell *matCellDef="let event">
                      <mat-form-field appearance="outline" class="compact-field">
                        <input
                          matInput
                          [(ngModel)]="event.editableOpponent"
                          [disabled]="event.isDuplicate"
                          placeholder="Opponent name"
                        />
                      </mat-form-field>
                      @if (event.isDuplicate) {
                        <span class="duplicate-badge">Duplicate</span>
                      }
                    </td>
                  </ng-container>

                  <!-- Date Column -->
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Date</th>
                    <td mat-cell *matCellDef="let event">
                      {{ formatEventDate(event.date) }}
                    </td>
                  </ng-container>

                  <!-- Location Column -->
                  <ng-container matColumnDef="location">
                    <th mat-header-cell *matHeaderCellDef>Location</th>
                    <td mat-cell *matCellDef="let event">
                      {{ event.location || '-' }}
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr
                    mat-row
                    *matRowDef="let row; columns: displayedColumns"
                    [class.duplicate-row]="row.isDuplicate"
                  ></tr>
                </table>
              </div>

              @if (importProgress()) {
                <div class="import-progress">
                  <mat-progress-bar
                    mode="determinate"
                    [value]="importProgress()"
                  ></mat-progress-bar>
                  <p>Importing... {{ importProgress() }}%</p>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Google Calendar Flow -->
      @if (currentMethod() === 'google') {
        <div class="google-flow">
          @if (!isConnected()) {
            <!-- Not Connected State -->
            <div class="connection-prompt">
              <mat-icon class="large-icon">cloud_off</mat-icon>
              <p>Connect your Google Calendar to automatically import games.</p>
              <button
                mat-raised-button
                color="primary"
                (click)="connectCalendar()"
                [disabled]="isConnecting()"
              >
                <mat-icon>link</mat-icon>
                Connect Google Calendar
              </button>

              <div class="setup-note">
                <mat-icon>info</mat-icon>
                <p>
                  <strong>Note:</strong> OAuth setup required. See service comments for
                  configuration steps.
                </p>
              </div>
            </div>
          } @else {
            <!-- Connected State -->
            <div class="connected-status">
              <mat-icon color="primary">check_circle</mat-icon>
              <div>
                <strong>Connected</strong>
                <p class="hint">{{ connectionStatus().calendarName || 'Google Calendar' }}</p>
              </div>
              <button mat-icon-button (click)="disconnectCalendar()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Calendar Selection & Sync Options -->
            <form [formGroup]="importForm">
              <!-- Calendar Selection -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Select Calendar</mat-label>
                <mat-select formControlName="calendarId" required>
                  @for (calendar of calendars(); track calendar.id) {
                    <mat-option [value]="calendar.id">
                      {{ calendar.summary }}
                      @if (calendar.primary) {
                        <span class="primary-badge">(Primary)</span>
                      }
                    </mat-option>
                  }
                </mat-select>
                @if (!calendars().length && !isLoadingCalendars()) {
                  <mat-hint>No calendars found</mat-hint>
                }
              </mat-form-field>

              <!-- Backfill Historical Games -->
              <div class="backfill-section">
                <mat-checkbox formControlName="includeHistorical">
                  Include past games (backfill)
                </mat-checkbox>

                @if (importForm.get('includeHistorical')?.value) {
                  <div class="date-range">
                    <mat-form-field appearance="outline">
                      <mat-label>Start Date</mat-label>
                      <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
                      <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                      <mat-datepicker #startPicker></mat-datepicker>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>End Date</mat-label>
                      <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
                      <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                      <mat-datepicker #endPicker></mat-datepicker>
                    </mat-form-field>
                  </div>

                  <p class="hint">
                    Historical games will be imported as "completed" with no scores. You can add
                    scores manually later.
                  </p>
                }
              </div>

              <!-- Progress Bar -->
              @if (isSyncing()) {
                <div class="sync-progress">
                  <mat-progress-bar mode="determinate" [value]="progress()"></mat-progress-bar>
                  <p>Importing... {{ progress() }}%</p>
                </div>
              }
            </form>
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="goBack()">
        {{ currentMethod() === 'select' ? 'Cancel' : 'Back' }}
      </button>

      @if (currentMethod() === 'ical' && parsedEvents().length) {
        <button
          mat-raised-button
          color="primary"
          (click)="importSelectedEvents()"
          [disabled]="!hasSelectedEvents() || !!importProgress()"
        >
          <mat-icon>download</mat-icon>
          Import {{ selectedEventsCount() }} Game(s)
        </button>
      }

      @if (currentMethod() === 'google' && isConnected()) {
        <button
          mat-raised-button
          color="primary"
          (click)="startImport()"
          [disabled]="importForm.invalid || isSyncing()"
        >
          <mat-icon>download</mat-icon>
          Import Games
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 600px;
        min-height: 300px;
        max-height: 80vh;
        overflow-y: auto;
      }

      h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      /* Method Selection */
      .method-selection {
        padding: 2rem;
      }

      .selection-prompt {
        text-align: center;
        font-size: 1.1rem;
        margin-bottom: 2rem;
        color: rgba(0, 0, 0, 0.87);
      }

      .method-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }

      .method-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #1976d2;
          background: #f5f5f5;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .method-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #1976d2;
          margin-bottom: 1rem;
        }

        h3 {
          margin: 0.5rem 0;
          font-size: 1.2rem;
          color: rgba(0, 0, 0, 0.87);
        }

        p {
          margin: 0.5rem 0 0 0;
          font-size: 0.875rem;
          color: rgba(0, 0, 0, 0.6);
          text-align: center;
        }
      }

      /* iCal Upload */
      .upload-section {
        padding: 2rem;
      }

      .upload-prompt {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        border: 2px dashed #e0e0e0;
        border-radius: 12px;
        background: #fafafa;
        text-align: center;
        gap: 1rem;

        .upload-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: #1976d2;
          opacity: 0.5;
        }

        p {
          margin: 0.5rem 0;
          color: rgba(0, 0, 0, 0.6);
        }
      }

      .processing {
        margin-top: 2rem;
        padding: 1rem;
        background: #e3f2fd;
        border-radius: 8px;
        text-align: center;

        p {
          margin: 0.5rem 0 0 0;
          font-size: 0.875rem;
        }
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1.5rem;
        padding: 1rem;
        background: #ffebee;
        border-radius: 8px;
        color: #c62828;

        mat-icon {
          flex-shrink: 0;
        }

        p {
          margin: 0;
          font-size: 0.875rem;
        }
      }

      .info-note {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin-top: 1.5rem;
        padding: 1rem;
        background: #e3f2fd;
        border-radius: 8px;

        mat-icon {
          color: #1976d2;
          flex-shrink: 0;
        }

        p {
          margin: 0;
          font-size: 0.875rem;
        }
      }

      /* Event Preview */
      .preview-section {
        padding: 1rem;
      }

      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 8px;

        p {
          margin: 0;
        }

        .preview-actions {
          display: flex;
          gap: 0.5rem;
        }
      }

      .events-table-container {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
      }

      .events-table {
        width: 100%;

        th {
          background: #f5f5f5;
          font-weight: 600;
          padding: 1rem 0.5rem;
        }

        td {
          padding: 0.5rem;
        }

        .compact-field {
          width: 100%;
          margin: 0;

          ::ng-deep .mat-mdc-form-field-wrapper {
            padding-bottom: 0;
          }

          ::ng-deep .mat-mdc-text-field-wrapper {
            padding: 0.25rem 0.5rem;
          }
        }

        .duplicate-badge {
          display: inline-block;
          margin-left: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: #ffcc80;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .duplicate-row {
          background: #fff3e0;
          opacity: 0.7;
        }
      }

      .import-progress {
        margin-top: 1.5rem;
        padding: 1rem;
        background: #e3f2fd;
        border-radius: 8px;

        p {
          margin: 0.5rem 0 0 0;
          text-align: center;
          font-size: 0.875rem;
        }
      }

      /* Google Calendar Styles */
      .connection-prompt {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
        gap: 1rem;

        .large-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          opacity: 0.3;
        }

        p {
          margin: 0.5rem 0;
          color: rgba(0, 0, 0, 0.6);
        }
      }

      .setup-note {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin-top: 2rem;
        padding: 1rem;
        background-color: #e3f2fd;
        border-radius: 4px;
        text-align: left;

        mat-icon {
          color: #1976d2;
          flex-shrink: 0;
        }

        p {
          margin: 0;
          font-size: 0.875rem;
        }
      }

      .connected-status {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background-color: #e8f5e9;
        border-radius: 8px;
        margin-bottom: 1.5rem;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        div {
          flex: 1;

          strong {
            display: block;
          }

          .hint {
            margin: 0.25rem 0 0 0;
            font-size: 0.875rem;
            color: rgba(0, 0, 0, 0.6);
          }
        }
      }

      .full-width {
        width: 100%;
      }

      .backfill-section {
        margin-top: 1.5rem;
        padding: 1rem;
        background-color: #f5f5f5;
        border-radius: 8px;

        mat-checkbox {
          display: block;
          margin-bottom: 1rem;
        }
      }

      .date-range {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;

        mat-form-field {
          flex: 1;
        }
      }

      .hint {
        margin: 0.5rem 0;
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.6);
      }

      .sync-progress {
        margin-top: 1.5rem;
        padding: 1rem;
        background-color: #e3f2fd;
        border-radius: 8px;

        p {
          margin: 0.5rem 0 0 0;
          text-align: center;
          font-size: 0.875rem;
        }
      }

      .primary-badge {
        margin-left: 0.5rem;
        font-size: 0.75rem;
        color: #1976d2;
      }
    `,
  ],
})
export class CalendarImportDialogComponent implements OnInit {
  // Current import method
  currentMethod = signal<'select' | 'ical' | 'google'>('select');

  // iCal specific state
  parsedEvents = signal<ParsedEvent[]>([]);
  isProcessing = signal(false);
  errorMessage = signal<string | null>(null);
  importProgress = signal<number | null>(null);
  displayedColumns = ['select', 'opponent', 'date', 'location'];

  // Keywords to filter out
  private readonly FILTER_KEYWORDS = ['training', 'practice', 'meeting', 'drill', 'session'];

  // Google Calendar specific state
  importForm!: FormGroup;
  calendars = signal<GoogleCalendar[]>([]);
  isConnected = signal(false);
  isConnecting = signal(false);
  isLoadingCalendars = signal(false);
  isSyncing = this.calendarService.isSyncing;
  progress = this.calendarService.progress;
  connectionStatus = this.calendarService.connectionStatus;

  teamId = signal<string | null>(null);

  constructor(
    private dialogRef: MatDialogRef<CalendarImportDialogComponent>,
    private fb: FormBuilder,
    private calendarService: GoogleCalendarSyncService,
    private teamService: TeamService,
    private gameService: GameService,
    private snackBar: MatSnackBar,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Get team ID
    this.teamService.currentTeam$.subscribe(team => {
      if (team) {
        this.teamId.set(team.id);
      }
    });

    // Check Google Calendar connection status
    this.connectionStatus().connected ? this.onCalendarConnected() : this.isConnected.set(false);
  }

  initForm(): void {
    // Default date range: 6 months ago to today
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    this.importForm = this.fb.group({
      calendarId: ['', Validators.required],
      includeHistorical: [false],
      startDate: [sixMonthsAgo],
      endDate: [new Date()],
    });
  }

  getDialogTitle(): string {
    switch (this.currentMethod()) {
      case 'ical':
        return 'Import from iCal File';
      case 'google':
        return 'Import from Google Calendar';
      default:
        return 'Import Games';
    }
  }

  selectMethod(method: 'ical' | 'google'): void {
    this.currentMethod.set(method);
  }

  goBack(): void {
    if (this.currentMethod() === 'select') {
      this.dialogRef.close();
    } else {
      // Reset state when going back
      this.currentMethod.set('select');
      this.parsedEvents.set([]);
      this.errorMessage.set(null);
      this.importProgress.set(null);
    }
  }

  // ========== iCal Methods ==========

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.name.endsWith('.ics')) {
      this.errorMessage.set('Invalid file type. Please select an .ics file.');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      this.parseICalFile(content);
    };
    reader.onerror = () => {
      this.errorMessage.set('Failed to read file. Please try again.');
      this.isProcessing.set(false);
    };
    reader.readAsText(file);
  }

  parseICalFile(content: string): void {
    try {
      const jcalData = ICAL.parse(content);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      if (vevents.length === 0) {
        this.errorMessage.set('No events found in the calendar file.');
        this.isProcessing.set(false);
        return;
      }

      const events: ParsedEvent[] = [];

      for (const vevent of vevents) {
        const event = new ICAL.Event(vevent);
        const summary = event.summary || '';

        // Filter out events with training/practice keywords
        const shouldFilter = this.FILTER_KEYWORDS.some(keyword =>
          summary.toLowerCase().includes(keyword.toLowerCase()),
        );

        if (shouldFilter) continue;

        const startDate = event.startDate;
        const location = event.location || '';

        events.push({
          id: crypto.randomUUID(),
          summary,
          date: startDate.toJSDate().toISOString(),
          location,
          selected: true,
          editableOpponent: summary,
          isDuplicate: false,
        });
      }

      if (events.length === 0) {
        this.errorMessage.set(
          'No game events found. All events were filtered out (training/practice keywords).',
        );
        this.isProcessing.set(false);
        return;
      }

      // Sort by date
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Check for duplicates
      this.checkForDuplicates(events);

      this.parsedEvents.set(events);
      this.isProcessing.set(false);
    } catch (error) {
      console.error('Error parsing iCal file:', error);
      this.errorMessage.set('Invalid iCal file format. Please check the file and try again.');
      this.isProcessing.set(false);
    }
  }

  async checkForDuplicates(events: ParsedEvent[]): Promise<void> {
    if (!this.teamId()) return;

    // Get existing games from the service
    this.gameService.getGames(this.teamId()!).subscribe(existingGames => {
      for (const event of events) {
        const eventDate = new Date(event.date).toISOString().split('T')[0];

        const isDuplicate = existingGames.some(game => {
          const gameDate = new Date(game.date).toISOString().split('T')[0];
          const opponentMatch =
            game.opponent.toLowerCase() === event.editableOpponent.toLowerCase();
          return gameDate === eventDate && opponentMatch;
        });

        event.isDuplicate = isDuplicate;
        if (isDuplicate) {
          event.selected = false;
        }
      }

      // Trigger change detection
      this.parsedEvents.set([...events]);
    });
  }

  formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  selectAllEvents(): void {
    const events = this.parsedEvents();
    events.forEach(event => {
      if (!event.isDuplicate) {
        event.selected = true;
      }
    });
    this.parsedEvents.set([...events]);
  }

  deselectAllEvents(): void {
    const events = this.parsedEvents();
    events.forEach(event => {
      event.selected = false;
    });
    this.parsedEvents.set([...events]);
  }

  hasSelectedEvents(): boolean {
    return this.parsedEvents().some(event => event.selected);
  }

  selectedEventsCount(): number {
    return this.parsedEvents().filter(event => event.selected).length;
  }

  async importSelectedEvents(): Promise<void> {
    if (!this.teamId()) {
      this.snackBar.open('No team selected', 'Close', { duration: 3000 });
      return;
    }

    const selectedEvents = this.parsedEvents().filter(event => event.selected);
    if (selectedEvents.length === 0) {
      this.snackBar.open('No events selected', 'Close', { duration: 3000 });
      return;
    }

    this.importProgress.set(0);
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < selectedEvents.length; i++) {
      const event = selectedEvents[i];

      try {
        const gameData: GameFormData = {
          opponent: event.editableOpponent.trim(),
          date: event.date,
          location: event.location || null,
          home_away: null,
        };

        await this.gameService.createGame(this.teamId()!, gameData).toPromise();
        imported++;
      } catch (error) {
        console.error('Error importing event:', error);
        failed++;
      }

      // Update progress
      const progress = Math.round(((i + 1) / selectedEvents.length) * 100);
      this.importProgress.set(progress);
    }

    // Show result
    const message =
      failed > 0
        ? `Imported ${imported} game(s), ${failed} failed`
        : `Successfully imported ${imported} game(s)`;

    this.snackBar.open(message, 'Close', { duration: 5000 });

    // Close dialog after short delay
    setTimeout(() => {
      this.dialogRef.close({ imported, failed });
    }, 1000);
  }

  // ========== Google Calendar Methods ==========

  connectCalendar(): void {
    this.isConnecting.set(true);
    this.calendarService.connectCalendar().subscribe({
      next: () => {
        this.snackBar.open('Redirecting to Google...', 'Close', { duration: 2000 });
        // OAuth will redirect and reload page
      },
      error: error => {
        console.error('Error connecting calendar:', error);
        this.snackBar.open('Failed to connect calendar', 'Close', { duration: 3000 });
        this.isConnecting.set(false);
      },
    });
  }

  disconnectCalendar(): void {
    this.calendarService.disconnectCalendar().subscribe({
      next: () => {
        this.isConnected.set(false);
        this.calendars.set([]);
        this.snackBar.open('Calendar disconnected', 'Close', { duration: 2000 });
      },
      error: error => {
        console.error('Error disconnecting calendar:', error);
        this.snackBar.open('Failed to disconnect calendar', 'Close', { duration: 3000 });
      },
    });
  }

  onCalendarConnected(): void {
    this.isConnected.set(true);
    this.loadCalendars();
  }

  loadCalendars(): void {
    this.isLoadingCalendars.set(true);
    this.calendarService.fetchCalendarList().subscribe({
      next: calendars => {
        this.calendars.set(calendars);

        // Auto-select primary calendar
        const primary = calendars.find(cal => cal.primary);
        if (primary) {
          this.importForm.patchValue({ calendarId: primary.id });
        }

        this.isLoadingCalendars.set(false);
      },
      error: error => {
        console.error('Error loading calendars:', error);
        this.snackBar.open('Failed to load calendars', 'Close', { duration: 3000 });
        this.isLoadingCalendars.set(false);
      },
    });
  }

  startImport(): void {
    if (this.importForm.invalid || !this.teamId()) return;

    const calendarId = this.importForm.value.calendarId;
    const options = this.importForm.value.includeHistorical
      ? {
          startDate: this.importForm.value.startDate,
          endDate: this.importForm.value.endDate,
          includeHistorical: true,
        }
      : undefined;

    this.calendarService.syncGames(this.teamId()!, calendarId, options).subscribe({
      next: result => {
        const message = `Imported ${result.gamesImported} new games, updated ${result.gamesUpdated} existing games`;
        this.snackBar.open(message, 'Close', { duration: 5000 });
        this.dialogRef.close(result);
      },
      error: error => {
        console.error('Error importing games:', error);
        this.snackBar.open('Failed to import games', 'Close', { duration: 3000 });
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
