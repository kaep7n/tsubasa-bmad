import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { CalendarImportDialogComponent } from './calendar-import-dialog.component';
import { GoogleCalendarSyncService } from '../../../../core/services/google-calendar-sync.service';
import { TeamService } from '../../../../core/services/team.service';
import { GameService } from '../../services/game.service';
import { Game } from '../../../../core/models/game.model';
import { GoogleCalendar } from '../../../../core/models/calendar-sync.model';

/**
 * Sample iCal file content for testing
 * Contains:
 * - 2 valid game events
 * - 2 filtered events (training, practice)
 * - Events with and without location
 */
const SAMPLE_ICAL_CONTENT = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Calendar//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:event1@test.com
DTSTART:20251101T140000Z
DTEND:20251101T160000Z
SUMMARY:vs Warriors
LOCATION:Stadium A
END:VEVENT
BEGIN:VEVENT
UID:event2@test.com
DTSTART:20251108T140000Z
DTEND:20251108T160000Z
SUMMARY:Team Training
LOCATION:Training Ground
END:VEVENT
BEGIN:VEVENT
UID:event3@test.com
DTSTART:20251115T140000Z
DTEND:20251115T160000Z
SUMMARY:vs Tigers
END:VEVENT
BEGIN:VEVENT
UID:event4@test.com
DTSTART:20251122T140000Z
DTEND:20251122T160000Z
SUMMARY:Practice Session
LOCATION:Field B
END:VEVENT
BEGIN:VEVENT
UID:event5@test.com
DTSTART:20251129T140000Z
DTEND:20251129T160000Z
SUMMARY:Meeting with coaches
END:VEVENT
END:VCALENDAR`;

/**
 * Invalid iCal content (malformed)
 */
const INVALID_ICAL_CONTENT = `BEGIN:VCALENDAR
VERSION:2.0
INVALID_TAG:TEST
END:VCALENDAR`;

/**
 * Empty iCal content (no events)
 */
const EMPTY_ICAL_CONTENT = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Calendar//EN
CALSCALE:GREGORIAN
END:VCALENDAR`;

/**
 * iCal with only filtered events
 */
const FILTERED_ONLY_ICAL_CONTENT = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Calendar//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:training1@test.com
DTSTART:20251101T140000Z
DTEND:20251101T160000Z
SUMMARY:Training Session
END:VEVENT
BEGIN:VEVENT
UID:practice1@test.com
DTSTART:20251108T140000Z
DTEND:20251108T160000Z
SUMMARY:Practice Drills
END:VEVENT
BEGIN:VEVENT
UID:meeting1@test.com
DTSTART:20251115T140000Z
DTEND:20251115T160000Z
SUMMARY:Team Meeting
END:VEVENT
END:VCALENDAR`;

describe('CalendarImportDialogComponent', () => {
  let component: CalendarImportDialogComponent;
  let fixture: ComponentFixture<CalendarImportDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CalendarImportDialogComponent>>;
  let mockCalendarService: jasmine.SpyObj<GoogleCalendarSyncService>;
  let mockTeamService: jasmine.SpyObj<TeamService>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  // Sample test data
  const mockTeam = {
    id: 'team-123',
    name: 'Test Team',
    season: '2024-2025',
    logo_url: null,
    created_by: 'user-123',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockCalendars: GoogleCalendar[] = [
    {
      id: 'primary',
      summary: 'Primary Calendar',
      primary: true,
    },
    {
      id: 'sports',
      summary: 'Sports Calendar',
      primary: false,
    },
  ];

  const mockExistingGames: Game[] = [
    {
      id: 'game-1',
      team_id: 'team-123',
      opponent: 'Warriors',
      date: '2025-11-01T14:00:00.000Z',
      location: 'Stadium A',
      home_away: 'home',
      status: 'scheduled',
      final_score_team: null,
      final_score_opponent: null,
      result: null,
      calendar_sync_id: null,
      is_protected: false,
      created_at: '2025-10-01T00:00:00.000Z',
      updated_at: '2025-10-01T00:00:00.000Z',
      deleted_at: null,
    },
  ];

  beforeEach(async () => {
    // Create spies
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Mock calendar service with signals
    const connectionStatusSignal = signal({ connected: false });
    const isSyncingSignal = signal(false);
    const progressSignal = signal(0);

    mockCalendarService = jasmine.createSpyObj(
      'GoogleCalendarSyncService',
      ['connectCalendar', 'disconnectCalendar', 'fetchCalendarList', 'syncGames'],
      {
        connectionStatus: connectionStatusSignal.asReadonly(),
        isSyncing: isSyncingSignal.asReadonly(),
        progress: progressSignal.asReadonly(),
      },
    );

    // Mock team service with BehaviorSubject
    mockTeamService = jasmine.createSpyObj('TeamService', ['getUserTeam'], {
      currentTeam$: of(mockTeam),
    });

    // Mock game service
    mockGameService = jasmine.createSpyObj('GameService', ['getGames', 'createGame']);
    mockGameService.getGames.and.returnValue(of(mockExistingGames));
    mockGameService.createGame.and.returnValue(
      of({
        id: 'new-game',
        team_id: 'team-123',
        opponent: 'Test Opponent',
        date: '2025-11-15T14:00:00.000Z',
        location: null,
        home_away: null,
        status: 'scheduled',
        final_score_team: null,
        final_score_opponent: null,
        result: null,
        calendar_sync_id: null,
        is_protected: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [
        CalendarImportDialogComponent,
        ReactiveFormsModule,
        FormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: GoogleCalendarSyncService, useValue: mockCalendarService },
        { provide: TeamService, useValue: mockTeamService },
        { provide: GameService, useValue: mockGameService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with "select" method', () => {
      expect(component.currentMethod()).toBe('select');
    });

    it('should initialize with empty parsed events', () => {
      expect(component.parsedEvents()).toEqual([]);
    });

    it('should load team ID on init', () => {
      expect(component.teamId()).toBe('team-123');
    });

    it('should initialize import form with default values', () => {
      expect(component.importForm).toBeDefined();
      expect(component.importForm.get('calendarId')?.value).toBe('');
      expect(component.importForm.get('includeHistorical')?.value).toBe(false);
    });

    it('should set default date range to 6 months ago', () => {
      const startDate = component.importForm.get('startDate')?.value as Date;
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      expect(startDate.getMonth()).toBe(sixMonthsAgo.getMonth());
      expect(startDate.getFullYear()).toBe(sixMonthsAgo.getFullYear());
    });
  });

  describe('Dialog Title', () => {
    it('should return "Import Games" when method is "select"', () => {
      component.currentMethod.set('select');
      expect(component.getDialogTitle()).toBe('Import Games');
    });

    it('should return "Import from iCal File" when method is "ical"', () => {
      component.currentMethod.set('ical');
      expect(component.getDialogTitle()).toBe('Import from iCal File');
    });

    it('should return "Import from Google Calendar" when method is "google"', () => {
      component.currentMethod.set('google');
      expect(component.getDialogTitle()).toBe('Import from Google Calendar');
    });
  });

  describe('Method Selection', () => {
    it('should change current method to "ical"', () => {
      component.selectMethod('ical');
      expect(component.currentMethod()).toBe('ical');
    });

    it('should change current method to "google"', () => {
      component.selectMethod('google');
      expect(component.currentMethod()).toBe('google');
    });
  });

  describe('Back Navigation', () => {
    it('should close dialog when current method is "select"', () => {
      component.currentMethod.set('select');
      component.goBack();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should reset to "select" method when navigating back from "ical"', () => {
      component.currentMethod.set('ical');
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'Test',
          date: '2025-11-01T14:00:00.000Z',
          location: '',
          selected: true,
          editableOpponent: 'Test',
          isDuplicate: false,
        },
      ]);
      component.errorMessage.set('Test error');
      component.importProgress.set(50);

      component.goBack();

      expect(component.currentMethod()).toBe('select');
      expect(component.parsedEvents()).toEqual([]);
      expect(component.errorMessage()).toBeNull();
      expect(component.importProgress()).toBeNull();
    });

    it('should reset state when navigating back from "google"', () => {
      component.currentMethod.set('google');
      component.goBack();
      expect(component.currentMethod()).toBe('select');
    });
  });

  describe('iCal File Upload', () => {
    it('should reject non-.ics files', () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockEvent = {
        target: { files: [mockFile] },
      } as any;

      component.onFileSelected(mockEvent);

      expect(component.errorMessage()).toBe('Invalid file type. Please select an .ics file.');
      expect(component.isProcessing()).toBe(false);
    });

    it('should handle file selection with no files', () => {
      const mockEvent = {
        target: { files: [] },
      } as any;

      component.onFileSelected(mockEvent);

      expect(component.isProcessing()).toBe(false);
    });

    it('should set processing state when reading file', fakeAsync(() => {
      const mockFile = new File([SAMPLE_ICAL_CONTENT], 'test.ics', {
        type: 'text/calendar',
      });
      const mockEvent = {
        target: { files: [mockFile] },
      } as any;

      spyOn(component, 'parseICalFile');

      component.onFileSelected(mockEvent);
      expect(component.isProcessing()).toBe(true);
      expect(component.errorMessage()).toBeNull();

      tick(100); // Wait for FileReader
      fixture.detectChanges();
    }));
  });

  describe('iCal Parsing - parseICalFile()', () => {
    it('should parse valid iCal content and extract game events', () => {
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      const events = component.parsedEvents();
      expect(events.length).toBe(2); // Only 2 game events, 3 filtered out
      expect(events[0].summary).toBe('vs Warriors');
      expect(events[0].location).toBe('Stadium A');
      expect(events[1].summary).toBe('vs Tigers');
    });

    it('should filter out events with "training" keyword', () => {
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      const events = component.parsedEvents();
      const hasTraining = events.some(e => e.summary.toLowerCase().includes('training'));
      expect(hasTraining).toBe(false);
    });

    it('should filter out events with "practice" keyword', () => {
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      const events = component.parsedEvents();
      const hasPractice = events.some(e => e.summary.toLowerCase().includes('practice'));
      expect(hasPractice).toBe(false);
    });

    it('should filter out events with "meeting" keyword', () => {
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      const events = component.parsedEvents();
      const hasMeeting = events.some(e => e.summary.toLowerCase().includes('meeting'));
      expect(hasMeeting).toBe(false);
    });

    it('should filter out events with "drill" keyword', () => {
      const icalWithDrill = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:drill1@test.com
DTSTART:20251101T140000Z
DTEND:20251101T160000Z
SUMMARY:Shooting Drill
END:VEVENT
END:VCALENDAR`;

      component.parseICalFile(icalWithDrill);

      expect(component.parsedEvents().length).toBe(0);
    });

    it('should filter out events with "session" keyword', () => {
      const icalWithSession = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:session1@test.com
DTSTART:20251101T140000Z
DTEND:20251101T160000Z
SUMMARY:Fitness Session
END:VEVENT
END:VCALENDAR`;

      component.parseICalFile(icalWithSession);

      expect(component.parsedEvents().length).toBe(0);
    });

    it('should handle empty iCal file (no events)', () => {
      component.parseICalFile(EMPTY_ICAL_CONTENT);

      expect(component.errorMessage()).toBe('No events found in the calendar file.');
      expect(component.parsedEvents().length).toBe(0);
      expect(component.isProcessing()).toBe(false);
    });

    it('should handle iCal with only filtered events', () => {
      component.parseICalFile(FILTERED_ONLY_ICAL_CONTENT);

      expect(component.errorMessage()).toBe(
        'No game events found. All events were filtered out (training/practice keywords).',
      );
      expect(component.parsedEvents().length).toBe(0);
      expect(component.isProcessing()).toBe(false);
    });

    it('should handle invalid iCal format', () => {
      component.parseICalFile(INVALID_ICAL_CONTENT);

      expect(component.errorMessage()).toBe(
        'Invalid iCal file format. Please check the file and try again.',
      );
      expect(component.parsedEvents().length).toBe(0);
      expect(component.isProcessing()).toBe(false);
    });

    it('should set all events as selected by default', () => {
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      const events = component.parsedEvents();
      events.forEach(event => {
        expect(event.selected).toBe(true);
      });
    });

    it('should generate unique IDs for each event', () => {
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      const events = component.parsedEvents();
      const ids = events.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(events.length);
    });

    it('should set editableOpponent to event summary', () => {
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      const events = component.parsedEvents();
      expect(events[0].editableOpponent).toBe(events[0].summary);
      expect(events[1].editableOpponent).toBe(events[1].summary);
    });

    it('should parse dates correctly', () => {
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      const events = component.parsedEvents();
      expect(events[0].date).toBeTruthy();
      expect(new Date(events[0].date).getTime()).toBeGreaterThan(0);
    });

    it('should sort events by date (ascending)', () => {
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      const events = component.parsedEvents();
      for (let i = 1; i < events.length; i++) {
        const prevDate = new Date(events[i - 1].date).getTime();
        const currDate = new Date(events[i].date).getTime();
        expect(currDate).toBeGreaterThanOrEqual(prevDate);
      }
    });

    it('should handle events without location', () => {
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      const events = component.parsedEvents();
      const eventWithoutLocation = events.find(e => e.summary === 'vs Tigers');
      expect(eventWithoutLocation?.location).toBe('');
    });

    it('should reset processing state after successful parse', () => {
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      expect(component.isProcessing()).toBe(false);
    });
  });

  describe('Duplicate Detection - checkForDuplicates()', () => {
    it('should mark events as duplicates when matching existing games', fakeAsync(() => {
      const testEvents = [
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
        {
          id: '2',
          summary: 'vs Tigers',
          date: '2025-11-15T14:00:00.000Z',
          location: '',
          selected: true,
          editableOpponent: 'Tigers',
          isDuplicate: false,
        },
      ];

      component.checkForDuplicates(testEvents);
      tick();

      expect(mockGameService.getGames).toHaveBeenCalledWith('team-123');
      expect(testEvents[0].isDuplicate).toBe(true);
      expect(testEvents[0].selected).toBe(false);
      expect(testEvents[1].isDuplicate).toBe(false);
    }));

    it('should match duplicates by date and opponent name (case-insensitive)', fakeAsync(() => {
      const testEvents = [
        {
          id: '1',
          summary: 'vs WARRIORS',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'WARRIORS',
          isDuplicate: false,
        },
      ];

      component.checkForDuplicates(testEvents);
      tick();

      expect(testEvents[0].isDuplicate).toBe(true);
    }));

    it('should not mark as duplicate if opponent is different', fakeAsync(() => {
      const testEvents = [
        {
          id: '1',
          summary: 'vs Dragons',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Dragons',
          isDuplicate: false,
        },
      ];

      component.checkForDuplicates(testEvents);
      tick();

      expect(testEvents[0].isDuplicate).toBe(false);
    }));

    it('should not mark as duplicate if date is different', fakeAsync(() => {
      const testEvents = [
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-02T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ];

      component.checkForDuplicates(testEvents);
      tick();

      expect(testEvents[0].isDuplicate).toBe(false);
    }));

    it('should compare dates by day (ignore time)', fakeAsync(() => {
      const testEvents = [
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T20:00:00.000Z', // Different time, same day
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ];

      component.checkForDuplicates(testEvents);
      tick();

      expect(testEvents[0].isDuplicate).toBe(true);
    }));

    it('should update signal with modified events', fakeAsync(() => {
      const testEvents = [
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ];

      component.checkForDuplicates(testEvents);
      tick();

      expect(component.parsedEvents()[0].isDuplicate).toBe(true);
    }));

    it('should handle empty existing games list', fakeAsync(() => {
      mockGameService.getGames.and.returnValue(of([]));

      const testEvents = [
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ];

      component.checkForDuplicates(testEvents);
      tick();

      expect(testEvents[0].isDuplicate).toBe(false);
    }));

    it('should not call getGames if teamId is null', fakeAsync(() => {
      component.teamId.set(null);

      const testEvents = [
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ];

      component.checkForDuplicates(testEvents);
      tick();

      expect(mockGameService.getGames).not.toHaveBeenCalled();
    }));
  });

  describe('Event Selection', () => {
    beforeEach(() => {
      const testEvents = [
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: false,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
        {
          id: '2',
          summary: 'vs Tigers',
          date: '2025-11-15T14:00:00.000Z',
          location: '',
          selected: false,
          editableOpponent: 'Tigers',
          isDuplicate: false,
        },
        {
          id: '3',
          summary: 'vs Dragons',
          date: '2025-11-22T14:00:00.000Z',
          location: '',
          selected: false,
          editableOpponent: 'Dragons',
          isDuplicate: true,
        },
      ];
      component.parsedEvents.set(testEvents);
    });

    it('should select all non-duplicate events', () => {
      component.selectAllEvents();

      const events = component.parsedEvents();
      expect(events[0].selected).toBe(true);
      expect(events[1].selected).toBe(true);
      expect(events[2].selected).toBe(false); // Duplicate, should remain unselected
    });

    it('should deselect all events', () => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      component.deselectAllEvents();

      const events = component.parsedEvents();
      expect(events[0].selected).toBe(false);
    });

    it('should correctly report if has selected events', () => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      expect(component.hasSelectedEvents()).toBe(true);
    });

    it('should return false when no events are selected', () => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: false,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      expect(component.hasSelectedEvents()).toBe(false);
    });

    it('should count selected events correctly', () => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
        {
          id: '2',
          summary: 'vs Tigers',
          date: '2025-11-15T14:00:00.000Z',
          location: '',
          selected: true,
          editableOpponent: 'Tigers',
          isDuplicate: false,
        },
        {
          id: '3',
          summary: 'vs Dragons',
          date: '2025-11-22T14:00:00.000Z',
          location: '',
          selected: false,
          editableOpponent: 'Dragons',
          isDuplicate: false,
        },
      ]);

      expect(component.selectedEventsCount()).toBe(2);
    });

    it('should return 0 when no events are selected', () => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: false,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      expect(component.selectedEventsCount()).toBe(0);
    });
  });

  describe('Opponent Name Editing', () => {
    it('should allow editing opponent name', () => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-01T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      const events = component.parsedEvents();
      events[0].editableOpponent = 'Warriors United';
      component.parsedEvents.set([...events]);

      expect(component.parsedEvents()[0].editableOpponent).toBe('Warriors United');
    });

    it('should use edited opponent name when importing', fakeAsync(() => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors United',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();
      tick();

      expect(mockGameService.createGame).toHaveBeenCalledWith(
        'team-123',
        jasmine.objectContaining({
          opponent: 'Warriors United',
        }),
      );
    }));
  });

  describe('Import Selected Events - importSelectedEvents()', () => {
    it('should import selected events successfully', fakeAsync(() => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
        {
          id: '2',
          summary: 'vs Tigers',
          date: '2025-11-22T14:00:00.000Z',
          location: '',
          selected: true,
          editableOpponent: 'Tigers',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();
      tick();

      expect(mockGameService.createGame).toHaveBeenCalledTimes(2);
      expect(mockSnackBar.open).toHaveBeenCalledWith('Successfully imported 2 game(s)', 'Close', {
        duration: 5000,
      });
    }));

    it('should skip unselected events', fakeAsync(() => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
        {
          id: '2',
          summary: 'vs Tigers',
          date: '2025-11-22T14:00:00.000Z',
          location: '',
          selected: false,
          editableOpponent: 'Tigers',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();
      tick();

      expect(mockGameService.createGame).toHaveBeenCalledTimes(1);
    }));

    it('should update progress during import', fakeAsync(() => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();

      expect(component.importProgress()).toBe(0);

      tick();

      expect(component.importProgress()).toBe(100);
    }));

    it('should handle import errors gracefully', fakeAsync(() => {
      mockGameService.createGame.and.returnValue(throwError(() => new Error('Import failed')));

      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Imported 0 game(s), 1 failed', 'Close', {
        duration: 5000,
      });
    }));

    it('should close dialog after successful import', fakeAsync(() => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();
      tick(1100); // Wait for import + delay

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        imported: 1,
        failed: 0,
      });
    }));

    it('should show error if no team selected', fakeAsync(() => {
      component.teamId.set(null);

      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith('No team selected', 'Close', {
        duration: 3000,
      });
      expect(mockGameService.createGame).not.toHaveBeenCalled();
    }));

    it('should show error if no events selected', fakeAsync(() => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: 'Stadium A',
          selected: false,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith('No events selected', 'Close', {
        duration: 3000,
      });
      expect(mockGameService.createGame).not.toHaveBeenCalled();
    }));

    it('should trim opponent name before creating game', fakeAsync(() => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: '  Warriors  ',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();
      tick();

      expect(mockGameService.createGame).toHaveBeenCalledWith(
        'team-123',
        jasmine.objectContaining({
          opponent: 'Warriors',
        }),
      );
    }));

    it('should pass location correctly when present', fakeAsync(() => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();
      tick();

      expect(mockGameService.createGame).toHaveBeenCalledWith(
        'team-123',
        jasmine.objectContaining({
          location: 'Stadium A',
        }),
      );
    }));

    it('should pass null location when empty', fakeAsync(() => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: '',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();
      tick();

      expect(mockGameService.createGame).toHaveBeenCalledWith(
        'team-123',
        jasmine.objectContaining({
          location: null,
        }),
      );
    }));

    it('should pass correct date format', fakeAsync(() => {
      const testDate = '2025-11-15T14:00:00.000Z';
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: testDate,
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      component.importSelectedEvents();
      tick();

      expect(mockGameService.createGame).toHaveBeenCalledWith(
        'team-123',
        jasmine.objectContaining({
          date: testDate,
        }),
      );
    }));
  });

  describe('Date Formatting', () => {
    it('should format event date correctly', () => {
      const dateString = '2025-11-01T14:00:00.000Z';
      const formatted = component.formatEventDate(dateString);

      expect(formatted).toContain('Nov');
      expect(formatted).toContain('1');
      expect(formatted).toContain('2025');
    });

    it('should include time in formatted date', () => {
      const dateString = '2025-11-01T14:30:00.000Z';
      const formatted = component.formatEventDate(dateString);

      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // Contains time like "2:30"
    });

    it('should handle different date formats', () => {
      const dateString = '2025-12-25T09:00:00.000Z';
      const formatted = component.formatEventDate(dateString);

      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('Google Calendar Flow', () => {
    it('should connect to Google Calendar', () => {
      mockCalendarService.connectCalendar.and.returnValue(of(undefined));

      component.connectCalendar();

      expect(mockCalendarService.connectCalendar).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Redirecting to Google...', 'Close', {
        duration: 2000,
      });
    });

    it('should handle connection error', () => {
      mockCalendarService.connectCalendar.and.returnValue(
        throwError(() => new Error('Connection failed')),
      );

      component.connectCalendar();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to connect calendar', 'Close', {
        duration: 3000,
      });
    });

    it('should disconnect from Google Calendar', () => {
      mockCalendarService.disconnectCalendar.and.returnValue(of(undefined));

      component.disconnectCalendar();

      expect(mockCalendarService.disconnectCalendar).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Calendar disconnected', 'Close', {
        duration: 2000,
      });
    });

    it('should load calendars when connected', () => {
      mockCalendarService.fetchCalendarList.and.returnValue(of(mockCalendars));

      component.loadCalendars();

      expect(mockCalendarService.fetchCalendarList).toHaveBeenCalled();
      expect(component.calendars().length).toBe(2);
    });

    it('should auto-select primary calendar', () => {
      mockCalendarService.fetchCalendarList.and.returnValue(of(mockCalendars));

      component.loadCalendars();

      expect(component.importForm.get('calendarId')?.value).toBe('primary');
    });

    it('should handle calendar loading error', () => {
      mockCalendarService.fetchCalendarList.and.returnValue(
        throwError(() => new Error('Failed to load')),
      );

      component.loadCalendars();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to load calendars', 'Close', {
        duration: 3000,
      });
    });

    it('should start import from Google Calendar', () => {
      const syncResult = {
        gamesImported: 5,
        gamesUpdated: 2,
        errors: [],
      };
      mockCalendarService.syncGames.and.returnValue(of(syncResult));

      component.importForm.patchValue({
        calendarId: 'primary',
        includeHistorical: false,
      });

      component.startImport();

      expect(mockCalendarService.syncGames).toHaveBeenCalledWith('team-123', 'primary', undefined);
    });

    it('should include historical dates when enabled', () => {
      const syncResult = {
        gamesImported: 5,
        gamesUpdated: 2,
        errors: [],
      };
      mockCalendarService.syncGames.and.returnValue(of(syncResult));

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      component.importForm.patchValue({
        calendarId: 'primary',
        includeHistorical: true,
        startDate,
        endDate,
      });

      component.startImport();

      expect(mockCalendarService.syncGames).toHaveBeenCalledWith('team-123', 'primary', {
        startDate,
        endDate,
        includeHistorical: true,
      });
    });

    it('should not start import if form is invalid', () => {
      component.importForm.patchValue({ calendarId: '' });

      component.startImport();

      expect(mockCalendarService.syncGames).not.toHaveBeenCalled();
    });

    it('should not start import if team ID is missing', () => {
      component.teamId.set(null);
      component.importForm.patchValue({ calendarId: 'primary' });

      component.startImport();

      expect(mockCalendarService.syncGames).not.toHaveBeenCalled();
    });

    it('should handle import error', () => {
      mockCalendarService.syncGames.and.returnValue(throwError(() => new Error('Import failed')));

      component.importForm.patchValue({ calendarId: 'primary' });

      component.startImport();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to import games', 'Close', {
        duration: 3000,
      });
    });

    it('should close dialog after successful import', () => {
      const syncResult = {
        gamesImported: 5,
        gamesUpdated: 2,
        errors: [],
      };
      mockCalendarService.syncGames.and.returnValue(of(syncResult));

      component.importForm.patchValue({ calendarId: 'primary' });

      component.startImport();

      expect(mockDialogRef.close).toHaveBeenCalledWith(syncResult);
    });
  });

  describe('Error Handling', () => {
    it('should display error message for invalid file', () => {
      component.parseICalFile(INVALID_ICAL_CONTENT);

      expect(component.errorMessage()).toBeTruthy();
      expect(component.errorMessage()).toContain('Invalid iCal file format');
    });

    it('should clear error message on successful parse', () => {
      component.errorMessage.set('Previous error');
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      expect(component.errorMessage()).toBeNull();
    });

    it('should set error message on file read error', () => {
      const mockFile = new File([SAMPLE_ICAL_CONTENT], 'test.ics');
      const mockEvent = {
        target: { files: [mockFile] },
      } as any;

      const reader = new FileReader();
      spyOn(window, 'FileReader').and.returnValue(reader);

      component.onFileSelected(mockEvent);

      // Simulate read error
      const errorEvent = new ProgressEvent('error');
      Object.defineProperty(errorEvent, 'target', { value: reader });
      reader.onerror?.(errorEvent as ProgressEvent<FileReader>);

      expect(component.errorMessage()).toBe('Failed to read file. Please try again.');
      expect(component.isProcessing()).toBe(false);
    });

    it('should handle missing filter keywords gracefully', () => {
      const icalWithNoKeywords = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event1@test.com
DTSTART:20251101T140000Z
DTEND:20251101T160000Z
SUMMARY:vs Warriors
END:VEVENT
END:VCALENDAR`;

      component.parseICalFile(icalWithNoKeywords);

      expect(component.parsedEvents().length).toBe(1);
      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full iCal import workflow', fakeAsync(() => {
      // 1. Select iCal method
      component.selectMethod('ical');
      expect(component.currentMethod()).toBe('ical');

      // 2. Parse iCal file
      component.parseICalFile(SAMPLE_ICAL_CONTENT);
      expect(component.parsedEvents().length).toBe(2);

      // 3. Check for duplicates
      tick();
      expect(component.parsedEvents()[0].isDuplicate).toBe(true);

      // 4. Select events
      component.selectAllEvents();
      expect(component.hasSelectedEvents()).toBe(true);

      // 5. Import selected events
      component.importSelectedEvents();
      tick();
      expect(mockGameService.createGame).toHaveBeenCalled();

      // 6. Verify dialog closes
      tick(1100);
      expect(mockDialogRef.close).toHaveBeenCalled();
    }));

    it('should handle back navigation during import flow', () => {
      component.selectMethod('ical');
      component.parseICalFile(SAMPLE_ICAL_CONTENT);

      expect(component.parsedEvents().length).toBeGreaterThan(0);

      component.goBack();

      expect(component.currentMethod()).toBe('select');
      expect(component.parsedEvents().length).toBe(0);
    });

    it('should maintain state when switching between methods', () => {
      // Select iCal
      component.selectMethod('ical');
      expect(component.currentMethod()).toBe('ical');

      // Go back and select Google
      component.goBack();
      component.selectMethod('google');
      expect(component.currentMethod()).toBe('google');

      // State should be clean
      expect(component.parsedEvents().length).toBe(0);
      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large iCal files', () => {
      let largeIcal = `BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\n`;

      // Create 100 events
      for (let i = 0; i < 100; i++) {
        largeIcal += `BEGIN:VEVENT\nUID:event${i}@test.com\nDTSTART:20251101T140000Z\nDTEND:20251101T160000Z\nSUMMARY:vs Team ${i}\nEND:VEVENT\n`;
      }

      largeIcal += `END:VCALENDAR`;

      component.parseICalFile(largeIcal);

      expect(component.parsedEvents().length).toBe(100);
    });

    it('should handle events with special characters in summary', () => {
      const icalWithSpecialChars = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event1@test.com
DTSTART:20251101T140000Z
DTEND:20251101T160000Z
SUMMARY:vs Team "Special" & <Test>
END:VEVENT
END:VCALENDAR`;

      component.parseICalFile(icalWithSpecialChars);

      expect(component.parsedEvents().length).toBe(1);
      expect(component.parsedEvents()[0].summary).toContain('Special');
    });

    it('should handle events with empty summary', () => {
      const icalWithEmptySummary = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event1@test.com
DTSTART:20251101T140000Z
DTEND:20251101T160000Z
SUMMARY:
END:VEVENT
END:VCALENDAR`;

      component.parseICalFile(icalWithEmptySummary);

      expect(component.parsedEvents().length).toBe(1);
      expect(component.parsedEvents()[0].summary).toBe('');
    });

    it('should handle concurrent import attempts', fakeAsync(() => {
      component.parsedEvents.set([
        {
          id: '1',
          summary: 'vs Warriors',
          date: '2025-11-15T14:00:00.000Z',
          location: 'Stadium A',
          selected: true,
          editableOpponent: 'Warriors',
          isDuplicate: false,
        },
      ]);

      // Start first import
      component.importSelectedEvents();

      // Try to start second import immediately
      component.importSelectedEvents();

      tick(1100);

      // Should still only import once
      expect(mockGameService.createGame).toHaveBeenCalledTimes(1);
    }));

    it('should handle events at midnight', () => {
      const icalWithMidnight = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event1@test.com
DTSTART:20251101T000000Z
DTEND:20251101T020000Z
SUMMARY:vs Night Warriors
END:VEVENT
END:VCALENDAR`;

      component.parseICalFile(icalWithMidnight);

      expect(component.parsedEvents().length).toBe(1);
      expect(component.parsedEvents()[0].date).toContain('T00:00:00');
    });
  });
});
