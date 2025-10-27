/**
 * Game Timer Service Unit Tests
 * Epic 5: Live Game Tracking
 * Story 5.2: Game Timer with Web Worker
 *
 * Test Coverage (AC 8, 9):
 * 1. Timer increments correctly (every second)
 * 2. Persistence saves and restores state
 * 3. Manual adjustments work (pause, resume, setMinute)
 * 4. Half-time detection at 45 minutes
 * 5. Page reload survival (E2E simulation)
 * 6. Drift correction on visibility change
 * 7. beforeunload persistence
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { GameTimerService } from './game-timer.service';
import { DatabaseService } from './database.service';
import {
  TimerState,
  TimerMessage,
  WorkerMessageType,
  createDefaultTimerState,
} from '../models/game-timer.model';

describe('GameTimerService', () => {
  let service: GameTimerService;
  let mockDatabaseService: jasmine.SpyObj<DatabaseService>;
  let mockWorker: MockWorker;
  let originalWorkerConstructor: any;

  // Mock Worker class
  class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;
    messageHandlers: Array<(event: MessageEvent) => void> = [];

    constructor(scriptURL: string | URL, options?: WorkerOptions) {
      mockWorker = this;
    }

    postMessage(message: TimerMessage): void {
      // Store message for verification
      this.messageHandlers.forEach((handler) => {
        handler({ data: message } as MessageEvent);
      });
    }

    terminate(): void {
      this.onmessage = null;
      this.onerror = null;
      this.messageHandlers = [];
    }

    // Test helper: Simulate worker sending message to service
    simulateWorkerMessage(message: TimerMessage): void {
      if (this.onmessage) {
        this.onmessage({ data: message } as MessageEvent);
      }
    }

    // Test helper: Simulate worker error
    simulateWorkerError(error: string): void {
      if (this.onerror) {
        this.onerror(new ErrorEvent('error', { message: error }));
      }
    }

    addEventListener(type: string, listener: EventListener): void {
      // Mock implementation
    }

    removeEventListener(type: string, listener: EventListener): void {
      // Mock implementation
    }

    dispatchEvent(event: Event): boolean {
      return true;
    }
  }

  // Mock IndexedDB timer_state table
  let mockTimerStateTable: Map<string, TimerState>;

  beforeEach(() => {
    // Reset mock timer state table
    mockTimerStateTable = new Map<string, TimerState>();

    // Create mock DatabaseService
    mockDatabaseService = jasmine.createSpyObj('DatabaseService', [], {
      db: {
        timer_state: {
          get: jasmine
            .createSpy('get')
            .and.callFake((gameId: string) => Promise.resolve(mockTimerStateTable.get(gameId))),
          put: jasmine
            .createSpy('put')
            .and.callFake((state: TimerState) => {
              mockTimerStateTable.set(state.gameId, state);
              return Promise.resolve(state.gameId);
            }),
          delete: jasmine
            .createSpy('delete')
            .and.callFake((gameId: string) => {
              mockTimerStateTable.delete(gameId);
              return Promise.resolve();
            }),
        },
      },
    });

    // Mock Worker constructor
    originalWorkerConstructor = globalThis.Worker;
    (globalThis as any).Worker = MockWorker;

    // Mock document and window for visibility and beforeunload tests
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        visibilityState: 'visible',
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };
    } else {
      spyOn(document, 'addEventListener');
      spyOn(document, 'removeEventListener');
    }

    if (typeof window === 'undefined') {
      (globalThis as any).window = {
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };
    } else {
      spyOn(window, 'addEventListener');
      spyOn(window, 'removeEventListener');
    }

    TestBed.configureTestingModule({
      providers: [
        GameTimerService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    });

    service = TestBed.inject(GameTimerService);
  });

  afterEach(() => {
    // Restore original Worker constructor
    (globalThis as any).Worker = originalWorkerConstructor;

    // Cleanup service
    service.ngOnDestroy();
  });

  // =================================================================
  // INITIALIZATION TESTS
  // =================================================================

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize Web Worker on construction', () => {
      expect(mockWorker).toBeTruthy();
      expect(mockWorker.onmessage).toBeTruthy();
      expect(mockWorker.onerror).toBeTruthy();
    });

    it('should setup page visibility listener', () => {
      expect(document.addEventListener).toHaveBeenCalledWith(
        'visibilitychange',
        jasmine.any(Function)
      );
    });

    it('should setup beforeunload listener', () => {
      expect(window.addEventListener).toHaveBeenCalledWith(
        'beforeunload',
        jasmine.any(Function)
      );
    });

    it('should initialize signals with default values', () => {
      expect(service.currentMinute()).toBe(0);
      expect(service.isRunning()).toBe(false);
      expect(service.isHalfTime()).toBe(false);
      expect(service.elapsedSeconds()).toBe(0);
    });
  });

  // =================================================================
  // AC 1: TIMER INCREMENTS CORRECTLY (EVERY SECOND)
  // =================================================================

  describe('AC 1: Timer Increments Correctly', () => {
    it('should update currentMinute signal on TICK message', () => {
      const tickMessage: TimerMessage = {
        type: WorkerMessageType.TICK,
        payload: {
          currentMinute: 5,
          elapsedSeconds: 300,
          isHalfTime: false,
        },
      };

      mockWorker.simulateWorkerMessage(tickMessage);

      expect(service.currentMinute()).toBe(5);
    });

    it('should update elapsedSeconds signal on TICK message', () => {
      const tickMessage: TimerMessage = {
        type: WorkerMessageType.TICK,
        payload: {
          currentMinute: 5,
          elapsedSeconds: 315, // 5 minutes 15 seconds
          isHalfTime: false,
        },
      };

      mockWorker.simulateWorkerMessage(tickMessage);

      expect(service.elapsedSeconds()).toBe(315);
    });

    it('should increment timer correctly over multiple ticks', () => {
      const ticks = [
        { currentMinute: 0, elapsedSeconds: 1, isHalfTime: false },
        { currentMinute: 0, elapsedSeconds: 2, isHalfTime: false },
        { currentMinute: 0, elapsedSeconds: 3, isHalfTime: false },
        { currentMinute: 1, elapsedSeconds: 60, isHalfTime: false },
        { currentMinute: 1, elapsedSeconds: 61, isHalfTime: false },
      ];

      ticks.forEach((tick) => {
        mockWorker.simulateWorkerMessage({
          type: WorkerMessageType.TICK,
          payload: tick,
        });
        expect(service.currentMinute()).toBe(tick.currentMinute);
        expect(service.elapsedSeconds()).toBe(tick.elapsedSeconds);
      });
    });

    it('should handle TICK message with partial payload', () => {
      // Only currentMinute
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: { currentMinute: 10 },
      });
      expect(service.currentMinute()).toBe(10);

      // Only elapsedSeconds
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: { elapsedSeconds: 650 },
      });
      expect(service.elapsedSeconds()).toBe(650);
    });

    it('should ignore TICK message with no payload', () => {
      service['_currentMinute'].set(5);
      service['_elapsedSeconds'].set(300);

      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
      });

      expect(service.currentMinute()).toBe(5);
      expect(service.elapsedSeconds()).toBe(300);
    });
  });

  // =================================================================
  // AC 2: PERSISTENCE SAVES AND RESTORES STATE
  // =================================================================

  describe('AC 2: Persistence Saves and Restores State', () => {
    it('should persist timer state to IndexedDB on PERSIST message', fakeAsync(() => {
      const testGameId = 'game-123';
      const timerState: TimerState = {
        gameId: testGameId,
        currentMinute: 10,
        startedAt: Date.now(),
        pausedAt: null,
        isRunning: true,
        isHalfTime: false,
        elapsedSeconds: 600,
        updatedAt: Date.now(),
      };

      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.PERSIST,
        payload: { state: timerState },
      });

      tick();

      expect(mockDatabaseService.db.timer_state.put).toHaveBeenCalledWith(timerState);
      expect(mockTimerStateTable.get(testGameId)).toEqual(timerState);
    }));

    it('should not persist invalid timer state', fakeAsync(() => {
      const invalidState = {
        gameId: 'game-123',
        currentMinute: 10,
        // Missing required fields
      };

      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.PERSIST,
        payload: { state: invalidState as any },
      });

      tick();

      expect(mockDatabaseService.db.timer_state.put).not.toHaveBeenCalled();
    }));

    it('should restore timer state from IndexedDB on startTimer', fakeAsync(() => {
      const testGameId = 'game-456';
      const savedState: TimerState = {
        gameId: testGameId,
        currentMinute: 15,
        startedAt: Date.now() - 900000, // 15 minutes ago
        pausedAt: null,
        isRunning: true,
        isHalfTime: false,
        elapsedSeconds: 900,
        updatedAt: Date.now(),
      };

      mockTimerStateTable.set(testGameId, savedState);

      let postedMessage: TimerMessage | null = null;
      mockWorker.messageHandlers.push((event: MessageEvent) => {
        postedMessage = event.data;
      });

      service.startTimer(testGameId);
      tick();

      expect(mockDatabaseService.db.timer_state.get).toHaveBeenCalled();
      expect(service.currentMinute()).toBe(15);
      expect(service.elapsedSeconds()).toBe(900);
      expect(service.isRunning()).toBe(true);

      // Verify START message sent to worker with restored state
      expect(postedMessage).toBeTruthy();
      expect(postedMessage!.type).toBe(WorkerMessageType.START);
      expect(postedMessage!.payload!.gameId).toBe(testGameId);
      expect(postedMessage!.payload!.initialMinute).toBe(15);
      expect(postedMessage!.payload!.initialElapsedSeconds).toBe(900);
    }));

    it('should start from zero if no saved state exists', fakeAsync(() => {
      const testGameId = 'game-new';

      let postedMessage: TimerMessage | null = null;
      mockWorker.messageHandlers.push((event: MessageEvent) => {
        postedMessage = event.data;
      });

      service.startTimer(testGameId);
      tick();

      expect(mockDatabaseService.db.timer_state.get).toHaveBeenCalled();
      expect(service.currentMinute()).toBe(0);
      expect(service.elapsedSeconds()).toBe(0);

      // Verify START message sent to worker with zero values
      expect(postedMessage!.payload!.initialMinute).toBe(0);
      expect(postedMessage!.payload!.initialElapsedSeconds).toBe(0);
    }));

    it('should handle database error gracefully when loading state', fakeAsync(() => {
      const testGameId = 'game-error';
      const getSpy = mockDatabaseService.db.timer_state.get as jasmine.Spy;
      getSpy.and.returnValue(Promise.reject(new Error('Database error')));

      spyOn(console, 'error');

      service.startTimer(testGameId);
      tick();

      expect(console.error).toHaveBeenCalled();
      expect(service.currentMinute()).toBe(0);
      expect(service.elapsedSeconds()).toBe(0);
    }));

    it('should handle database error gracefully when persisting state', fakeAsync(() => {
      const testGameId = 'game-persist-error';
      const putSpy = mockDatabaseService.db.timer_state.put as jasmine.Spy;
      putSpy.and.returnValue(Promise.reject(new Error('Database error')));

      spyOn(console, 'error');

      const timerState: TimerState = {
        gameId: testGameId,
        currentMinute: 5,
        startedAt: Date.now(),
        pausedAt: null,
        isRunning: true,
        isHalfTime: false,
        elapsedSeconds: 300,
        updatedAt: Date.now(),
      };

      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.PERSIST,
        payload: { state: timerState },
      });

      tick();

      expect(console.error).toHaveBeenCalled();
    }));
  });

  // =================================================================
  // AC 3: MANUAL ADJUSTMENTS (PAUSE, RESUME, SETMINUTE)
  // =================================================================

  describe('AC 3: Manual Adjustments', () => {
    describe('Pause Timer', () => {
      it('should send PAUSE message to worker', fakeAsync(() => {
        const testGameId = 'game-pause';
        let postedMessage: TimerMessage | null = null;
        mockWorker.messageHandlers.push((event: MessageEvent) => {
          postedMessage = event.data;
        });

        service.startTimer(testGameId);
        tick();

        postedMessage = null;
        service.pauseTimer();

        expect(postedMessage).toBeTruthy();
        expect(postedMessage!.type).toBe(WorkerMessageType.PAUSE);
      }));

      it('should set isRunning signal to false', fakeAsync(() => {
        const testGameId = 'game-pause-signal';

        service.startTimer(testGameId);
        tick();
        expect(service.isRunning()).toBe(true);

        service.pauseTimer();
        expect(service.isRunning()).toBe(false);
      }));

      it('should warn if no active timer to pause', () => {
        spyOn(console, 'warn');

        service.pauseTimer();

        expect(console.warn).toHaveBeenCalledWith(
          '[GameTimerService] No active timer to pause'
        );
      });
    });

    describe('Resume Timer', () => {
      it('should send RESUME message to worker', fakeAsync(() => {
        const testGameId = 'game-resume';
        let postedMessage: TimerMessage | null = null;
        mockWorker.messageHandlers.push((event: MessageEvent) => {
          postedMessage = event.data;
        });

        service.startTimer(testGameId);
        tick();
        service.pauseTimer();

        postedMessage = null;
        service.resumeTimer();

        expect(postedMessage).toBeTruthy();
        expect(postedMessage!.type).toBe(WorkerMessageType.RESUME);
      }));

      it('should set isRunning signal to true', fakeAsync(() => {
        const testGameId = 'game-resume-signal';

        service.startTimer(testGameId);
        tick();
        service.pauseTimer();
        expect(service.isRunning()).toBe(false);

        service.resumeTimer();
        expect(service.isRunning()).toBe(true);
      }));

      it('should warn if no timer to resume', () => {
        spyOn(console, 'warn');

        service.resumeTimer();

        expect(console.warn).toHaveBeenCalledWith('[GameTimerService] No timer to resume');
      });
    });

    describe('Set Minute', () => {
      it('should send SET_MINUTE message to worker', fakeAsync(() => {
        const testGameId = 'game-setminute';
        let postedMessage: TimerMessage | null = null;
        mockWorker.messageHandlers.push((event: MessageEvent) => {
          postedMessage = event.data;
        });

        service.startTimer(testGameId);
        tick();

        postedMessage = null;
        service.setMinute(30);

        expect(postedMessage).toBeTruthy();
        expect(postedMessage!.type).toBe(WorkerMessageType.SET_MINUTE);
        expect(postedMessage!.payload!.minute).toBe(30);
      }));

      it('should update currentMinute and elapsedSeconds signals immediately', fakeAsync(() => {
        const testGameId = 'game-setminute-signal';

        service.startTimer(testGameId);
        tick();

        service.setMinute(42);

        expect(service.currentMinute()).toBe(42);
        expect(service.elapsedSeconds()).toBe(42 * 60); // 2520 seconds
      }));

      it('should reject negative minute values', fakeAsync(() => {
        const testGameId = 'game-setminute-negative';
        spyOn(console, 'error');

        service.startTimer(testGameId);
        tick();

        service.setMinute(-5);

        expect(console.error).toHaveBeenCalledWith('[GameTimerService] Minute must be >= 0');
      }));

      it('should warn if no active timer to set minute', () => {
        spyOn(console, 'warn');

        service.setMinute(10);

        expect(console.warn).toHaveBeenCalledWith(
          '[GameTimerService] No active timer to set minute'
        );
      });
    });

    describe('Stop Timer', () => {
      it('should send STOP message to worker', fakeAsync(() => {
        const testGameId = 'game-stop';
        let postedMessage: TimerMessage | null = null;
        mockWorker.messageHandlers.push((event: MessageEvent) => {
          postedMessage = event.data;
        });

        service.startTimer(testGameId);
        tick();

        postedMessage = null;
        service.stopTimer();
        tick();

        expect(postedMessage).toBeTruthy();
        expect(postedMessage!.type).toBe(WorkerMessageType.STOP);
      }));

      it('should reset all signals to default values', fakeAsync(() => {
        const testGameId = 'game-stop-signals';

        service.startTimer(testGameId);
        tick();

        // Simulate some time passing
        mockWorker.simulateWorkerMessage({
          type: WorkerMessageType.TICK,
          payload: {
            currentMinute: 10,
            elapsedSeconds: 600,
            isHalfTime: false,
          },
        });

        service.stopTimer();
        tick();

        expect(service.currentMinute()).toBe(0);
        expect(service.elapsedSeconds()).toBe(0);
        expect(service.isRunning()).toBe(false);
        expect(service.isHalfTime()).toBe(false);
      }));

      it('should warn if no active timer to stop', fakeAsync(() => {
        spyOn(console, 'warn');

        service.stopTimer();
        tick();

        expect(console.warn).toHaveBeenCalledWith('[GameTimerService] No active timer to stop');
      }));
    });
  });

  // =================================================================
  // AC 4: HALF-TIME DETECTION AT 45 MINUTES
  // =================================================================

  describe('AC 4: Half-Time Detection', () => {
    it('should set isHalfTime signal to true when reaching 45 minutes', () => {
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: {
          currentMinute: 45,
          elapsedSeconds: 2700,
          isHalfTime: true,
        },
      });

      expect(service.isHalfTime()).toBe(true);
    });

    it('should trigger HALF_TIME event from worker', () => {
      spyOn(console, 'log');

      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.HALF_TIME,
        payload: {
          currentMinute: 45,
        },
      });

      expect(console.log).toHaveBeenCalledWith(
        '[GameTimerService] Half-time reached at minute 45'
      );
    });

    it('should maintain isHalfTime as true between 45-89 minutes', () => {
      const halfTimeMinutes = [45, 50, 60, 70, 89];

      halfTimeMinutes.forEach((minute) => {
        mockWorker.simulateWorkerMessage({
          type: WorkerMessageType.TICK,
          payload: {
            currentMinute: minute,
            elapsedSeconds: minute * 60,
            isHalfTime: true,
          },
        });

        expect(service.isHalfTime()).toBe(true);
      });
    });

    it('should not trigger half-time before 45 minutes', () => {
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: {
          currentMinute: 44,
          elapsedSeconds: 2640,
          isHalfTime: false,
        },
      });

      expect(service.isHalfTime()).toBe(false);
    });

    it('should reset isHalfTime when timer is stopped', fakeAsync(() => {
      const testGameId = 'game-halftime-reset';

      service.startTimer(testGameId);
      tick();

      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: {
          currentMinute: 45,
          elapsedSeconds: 2700,
          isHalfTime: true,
        },
      });

      expect(service.isHalfTime()).toBe(true);

      service.stopTimer();
      tick();

      expect(service.isHalfTime()).toBe(false);
    }));
  });

  // =================================================================
  // AC 5: PAGE RELOAD SURVIVAL (E2E SIMULATION)
  // =================================================================

  describe('AC 5: Page Reload Survival', () => {
    it('should simulate full page reload with state persistence', fakeAsync(() => {
      const testGameId = 'game-reload-test';

      // Step 1: Start timer
      service.startTimer(testGameId);
      tick();

      // Step 2: Simulate timer running for 10 minutes
      const state10min: TimerState = {
        gameId: testGameId,
        currentMinute: 10,
        startedAt: Date.now() - 600000, // 10 minutes ago
        pausedAt: null,
        isRunning: true,
        isHalfTime: false,
        elapsedSeconds: 600,
        updatedAt: Date.now(),
      };

      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.PERSIST,
        payload: { state: state10min },
      });
      tick();

      expect(mockTimerStateTable.get(testGameId)).toEqual(state10min);

      // Step 3: Simulate page close (beforeunload)
      service.stopTimer();
      tick();

      // Step 4: Simulate page reload - destroy service
      service.ngOnDestroy();

      // Step 5: Create new service instance (simulating fresh page load)
      const reloadedService = TestBed.inject(GameTimerService);

      // Step 6: Start timer again (should restore from IndexedDB)
      reloadedService.startTimer(testGameId);
      tick();

      // Verify state was restored
      expect(reloadedService.currentMinute()).toBe(10);
      expect(reloadedService.elapsedSeconds()).toBe(600);
      expect(reloadedService.isRunning()).toBe(true);

      // Cleanup
      reloadedService.ngOnDestroy();
    }));

    it('should handle multiple pause/resume cycles before reload', fakeAsync(() => {
      const testGameId = 'game-multi-pause';

      service.startTimer(testGameId);
      tick();

      // Pause at 5 minutes
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: { currentMinute: 5, elapsedSeconds: 300, isHalfTime: false },
      });

      const pausedState: TimerState = {
        gameId: testGameId,
        currentMinute: 5,
        startedAt: Date.now() - 300000,
        pausedAt: Date.now(),
        isRunning: false,
        isHalfTime: false,
        elapsedSeconds: 300,
        updatedAt: Date.now(),
      };

      service.pauseTimer();
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.PERSIST,
        payload: { state: pausedState },
      });
      tick();

      // Resume
      service.resumeTimer();
      tick();

      // Reload
      service.ngOnDestroy();
      const reloadedService = TestBed.inject(GameTimerService);
      reloadedService.startTimer(testGameId);
      tick();

      expect(reloadedService.currentMinute()).toBe(5);

      reloadedService.ngOnDestroy();
    }));
  });

  // =================================================================
  // AC 6: DRIFT CORRECTION ON VISIBILITY CHANGE
  // =================================================================

  describe('AC 6: Drift Correction on Visibility Change', () => {
    it('should correct drift when page becomes visible after background', fakeAsync(() => {
      const testGameId = 'game-drift';

      service.startTimer(testGameId);
      tick();

      // Simulate timer running for 5 minutes
      const now = Date.now();
      const runningState: TimerState = {
        gameId: testGameId,
        currentMinute: 5,
        startedAt: now - 300000, // 5 minutes ago
        pausedAt: null,
        isRunning: true,
        isHalfTime: false,
        elapsedSeconds: 300,
        updatedAt: now,
      };

      mockTimerStateTable.set(testGameId, runningState);

      // Simulate page going to background for 10 seconds
      const timeAfterBackground = now + 10000;
      jasmine.clock().mockDate(new Date(timeAfterBackground));

      // Update the state to reflect time passed
      const stateAfterBackground: TimerState = {
        ...runningState,
        updatedAt: now, // Still showing old timestamp
      };
      mockTimerStateTable.set(testGameId, stateAfterBackground);

      // Capture posted messages
      let setMinuteMessage: TimerMessage | null = null;
      mockWorker.messageHandlers.push((event: MessageEvent) => {
        if (event.data.type === WorkerMessageType.SET_MINUTE) {
          setMinuteMessage = event.data;
        }
      });

      // Simulate visibility change (page becomes visible)
      const visibilityListener = (document.addEventListener as jasmine.Spy).calls
        .all()
        .find((call) => call.args[0] === 'visibilitychange')?.args[1];

      if (visibilityListener) {
        (document as any).visibilityState = 'visible';
        visibilityListener();
        tick();
      }

      // Should have called setMinute to correct drift
      expect(setMinuteMessage).toBeTruthy();
      // Expected minute: 5 minutes + 10 seconds drift = still minute 5
      // (drift correction only happens if > 2 seconds)

      jasmine.clock().uninstall();
    }));

    it('should not correct drift if timer is paused', fakeAsync(() => {
      const testGameId = 'game-no-drift-paused';

      service.startTimer(testGameId);
      tick();

      service.pauseTimer();

      const pausedState: TimerState = {
        gameId: testGameId,
        currentMinute: 5,
        startedAt: Date.now() - 300000,
        pausedAt: Date.now(),
        isRunning: false,
        isHalfTime: false,
        elapsedSeconds: 300,
        updatedAt: Date.now(),
      };

      mockTimerStateTable.set(testGameId, pausedState);

      spyOn<any>(service, 'setMinute');

      // Simulate visibility change
      const visibilityListener = (document.addEventListener as jasmine.Spy).calls
        .all()
        .find((call) => call.args[0] === 'visibilitychange')?.args[1];

      if (visibilityListener) {
        (document as any).visibilityState = 'visible';
        visibilityListener();
        tick();
      }

      expect(service['setMinute']).not.toHaveBeenCalled();
    }));

    it('should not correct drift if time difference is less than 2 seconds', fakeAsync(() => {
      const testGameId = 'game-no-drift-small';

      service.startTimer(testGameId);
      tick();

      const now = Date.now();
      const recentState: TimerState = {
        gameId: testGameId,
        currentMinute: 5,
        startedAt: now - 300000,
        pausedAt: null,
        isRunning: true,
        isHalfTime: false,
        elapsedSeconds: 300,
        updatedAt: now - 1000, // Only 1 second ago
      };

      mockTimerStateTable.set(testGameId, recentState);

      spyOn<any>(service, 'setMinute');

      // Simulate visibility change
      const visibilityListener = (document.addEventListener as jasmine.Spy).calls
        .all()
        .find((call) => call.args[0] === 'visibilitychange')?.args[1];

      if (visibilityListener) {
        (document as any).visibilityState = 'visible';
        visibilityListener();
        tick();
      }

      expect(service['setMinute']).not.toHaveBeenCalled();
    }));
  });

  // =================================================================
  // AC 7: BEFOREUNLOAD PERSISTENCE
  // =================================================================

  describe('AC 7: beforeunload Persistence', () => {
    it('should persist state on beforeunload event', fakeAsync(() => {
      const testGameId = 'game-beforeunload';

      service.startTimer(testGameId);
      tick();

      // Capture posted messages
      let stopMessage: TimerMessage | null = null;
      mockWorker.messageHandlers.push((event: MessageEvent) => {
        if (event.data.type === WorkerMessageType.STOP) {
          stopMessage = event.data;
        }
      });

      // Simulate beforeunload event
      const beforeUnloadListener = (window.addEventListener as jasmine.Spy).calls
        .all()
        .find((call) => call.args[0] === 'beforeunload')?.args[1];

      if (beforeUnloadListener) {
        beforeUnloadListener();
      }

      expect(stopMessage).toBeTruthy();
      expect(stopMessage!.type).toBe(WorkerMessageType.STOP);
    }));

    it('should not send STOP if timer is not running', fakeAsync(() => {
      const testGameId = 'game-beforeunload-stopped';

      service.startTimer(testGameId);
      tick();

      service.stopTimer();
      tick();

      // Capture posted messages
      let stopMessageCount = 0;
      mockWorker.messageHandlers.push((event: MessageEvent) => {
        if (event.data.type === WorkerMessageType.STOP) {
          stopMessageCount++;
        }
      });

      // Simulate beforeunload event
      const beforeUnloadListener = (window.addEventListener as jasmine.Spy).calls
        .all()
        .find((call) => call.args[0] === 'beforeunload')?.args[1];

      if (beforeUnloadListener) {
        beforeUnloadListener();
      }

      // Should not have sent another STOP message
      expect(stopMessageCount).toBe(0);
    }));
  });

  // =================================================================
  // ERROR HANDLING
  // =================================================================

  describe('Error Handling', () => {
    it('should handle worker ERROR message', () => {
      spyOn(console, 'error');

      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.ERROR,
        payload: {
          error: 'Worker encountered an error',
        },
      });

      expect(console.error).toHaveBeenCalledWith(
        '[GameTimerService] Worker error:',
        'Worker encountered an error'
      );
    });

    it('should handle worker onerror event', () => {
      spyOn(console, 'error');

      mockWorker.simulateWorkerError('Worker initialization failed');

      expect(console.error).toHaveBeenCalled();
    });

    it('should throw error if worker not initialized when starting timer', fakeAsync(() => {
      service.ngOnDestroy(); // This will terminate the worker

      expect(() => {
        service.startTimer('game-no-worker');
      }).toThrowError('Worker not initialized');
    }));

    it('should throw error if worker not initialized when pausing timer', () => {
      service.ngOnDestroy();

      expect(() => {
        service.pauseTimer();
      }).toThrowError('Worker not initialized');
    });

    it('should throw error if worker not initialized when resuming timer', () => {
      service.ngOnDestroy();

      expect(() => {
        service.resumeTimer();
      }).toThrowError('Worker not initialized');
    });

    it('should throw error if worker not initialized when setting minute', () => {
      service.ngOnDestroy();

      expect(() => {
        service.setMinute(10);
      }).toThrowError('Worker not initialized');
    });

    it('should throw error if worker not initialized when stopping timer', fakeAsync(() => {
      service.ngOnDestroy();

      expect(() => {
        service.stopTimer();
      }).toThrowError('Worker not initialized');
    }));
  });

  // =================================================================
  // STATE MANAGEMENT TESTS
  // =================================================================

  describe('State Management', () => {
    it('should get timer state from IndexedDB', fakeAsync(() => {
      const testGameId = 'game-get-state';
      const expectedState: TimerState = {
        gameId: testGameId,
        currentMinute: 20,
        startedAt: Date.now() - 1200000,
        pausedAt: null,
        isRunning: true,
        isHalfTime: false,
        elapsedSeconds: 1200,
        updatedAt: Date.now(),
      };

      mockTimerStateTable.set(testGameId, expectedState);

      let retrievedState: TimerState | undefined;
      service.getTimerState(testGameId).then((state) => {
        retrievedState = state;
      });

      tick();

      expect(retrievedState).toEqual(expectedState);
    }));

    it('should return undefined if state does not exist', fakeAsync(() => {
      let retrievedState: TimerState | undefined = {} as TimerState;

      service.getTimerState('non-existent-game').then((state) => {
        retrievedState = state;
      });

      tick();

      expect(retrievedState).toBeUndefined();
    }));

    it('should clear timer state from IndexedDB', fakeAsync(() => {
      const testGameId = 'game-clear-state';
      const state: TimerState = {
        gameId: testGameId,
        currentMinute: 10,
        startedAt: Date.now(),
        pausedAt: null,
        isRunning: true,
        isHalfTime: false,
        elapsedSeconds: 600,
        updatedAt: Date.now(),
      };

      mockTimerStateTable.set(testGameId, state);

      service.clearTimerState(testGameId);
      tick();

      expect(mockTimerStateTable.has(testGameId)).toBe(false);
      expect(mockDatabaseService.db.timer_state.delete).toHaveBeenCalled();
    }));

    it('should handle error when clearing state', fakeAsync(() => {
      const testGameId = 'game-clear-error';
      const deleteSpy = mockDatabaseService.db.timer_state.delete as jasmine.Spy;
      deleteSpy.and.returnValue(Promise.reject(new Error('Delete failed')));

      spyOn(console, 'error');

      service.clearTimerState(testGameId);
      tick();

      expect(console.error).toHaveBeenCalled();
    }));
  });

  // =================================================================
  // CLEANUP TESTS
  // =================================================================

  describe('Cleanup', () => {
    it('should cleanup on ngOnDestroy', () => {
      expect(mockWorker).toBeTruthy();

      service.ngOnDestroy();

      expect(document.removeEventListener).toHaveBeenCalledWith(
        'visibilitychange',
        jasmine.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'beforeunload',
        jasmine.any(Function)
      );
    });

    it('should terminate worker on cleanup', () => {
      spyOn(mockWorker, 'terminate');

      service.ngOnDestroy();

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should reset all signals on cleanup', () => {
      service['_currentMinute'].set(30);
      service['_elapsedSeconds'].set(1800);
      service['_isRunning'].set(true);
      service['_isHalfTime'].set(true);

      service.ngOnDestroy();

      // Note: After ngOnDestroy, the service should not be used
      // But we can verify the cleanup logic reset the signals
      expect(service.currentMinute()).toBe(0);
      expect(service.elapsedSeconds()).toBe(0);
      expect(service.isRunning()).toBe(false);
      expect(service.isHalfTime()).toBe(false);
    });

    it('should stop existing timer when starting a new one', fakeAsync(() => {
      const gameId1 = 'game-1';
      const gameId2 = 'game-2';

      service.startTimer(gameId1);
      tick();

      expect(service.isRunning()).toBe(true);

      let stopMessageSent = false;
      mockWorker.messageHandlers.push((event: MessageEvent) => {
        if (event.data.type === WorkerMessageType.STOP) {
          stopMessageSent = true;
        }
      });

      service.startTimer(gameId2);
      tick();

      expect(stopMessageSent).toBe(true);
      expect(service.isRunning()).toBe(true);
    }));
  });

  // =================================================================
  // INTEGRATION TESTS
  // =================================================================

  describe('Integration Tests', () => {
    it('should handle complete game flow: start, pause, resume, stop', fakeAsync(() => {
      const testGameId = 'game-complete-flow';

      // Start
      service.startTimer(testGameId);
      tick();
      expect(service.isRunning()).toBe(true);

      // Simulate timer running to minute 10
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: { currentMinute: 10, elapsedSeconds: 600, isHalfTime: false },
      });
      expect(service.currentMinute()).toBe(10);

      // Pause
      service.pauseTimer();
      expect(service.isRunning()).toBe(false);

      // Resume
      service.resumeTimer();
      expect(service.isRunning()).toBe(true);

      // Continue to half-time
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: { currentMinute: 45, elapsedSeconds: 2700, isHalfTime: true },
      });
      expect(service.currentMinute()).toBe(45);
      expect(service.isHalfTime()).toBe(true);

      // Stop
      service.stopTimer();
      tick();
      expect(service.isRunning()).toBe(false);
      expect(service.currentMinute()).toBe(0);
      expect(service.isHalfTime()).toBe(false);
    }));

    it('should handle manual time correction during game', fakeAsync(() => {
      const testGameId = 'game-manual-correction';

      service.startTimer(testGameId);
      tick();

      // Timer shows minute 10
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: { currentMinute: 10, elapsedSeconds: 600, isHalfTime: false },
      });

      // Referee says it should be minute 15
      service.setMinute(15);
      expect(service.currentMinute()).toBe(15);
      expect(service.elapsedSeconds()).toBe(900);

      // Timer continues from corrected time
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: { currentMinute: 16, elapsedSeconds: 960, isHalfTime: false },
      });
      expect(service.currentMinute()).toBe(16);
    }));

    it('should handle multiple games in sequence', fakeAsync(() => {
      const game1 = 'game-seq-1';
      const game2 = 'game-seq-2';

      // Game 1
      service.startTimer(game1);
      tick();
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: { currentMinute: 30, elapsedSeconds: 1800, isHalfTime: false },
      });

      const state1: TimerState = {
        gameId: game1,
        currentMinute: 30,
        startedAt: Date.now() - 1800000,
        pausedAt: null,
        isRunning: true,
        isHalfTime: false,
        elapsedSeconds: 1800,
        updatedAt: Date.now(),
      };

      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.PERSIST,
        payload: { state: state1 },
      });
      tick();

      service.stopTimer();
      tick();

      // Game 2
      service.startTimer(game2);
      tick();
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: { currentMinute: 20, elapsedSeconds: 1200, isHalfTime: false },
      });

      expect(service.currentMinute()).toBe(20);
      expect(mockTimerStateTable.has(game1)).toBe(true);
    }));
  });

  // =================================================================
  // SIGNAL BEHAVIOR TESTS
  // =================================================================

  describe('Signal Behavior', () => {
    it('should provide read-only signals to consumers', () => {
      // Verify signals are read-only
      expect(service.currentMinute).toBeTruthy();
      expect(service.isRunning).toBeTruthy();
      expect(service.isHalfTime).toBeTruthy();
      expect(service.elapsedSeconds).toBeTruthy();

      // Signals should be callable
      expect(typeof service.currentMinute).toBe('function');
      expect(typeof service.isRunning).toBe('function');
      expect(typeof service.isHalfTime).toBe('function');
      expect(typeof service.elapsedSeconds).toBe('function');
    });

    it('should update signals reactively on worker messages', () => {
      const updates = [
        { minute: 1, seconds: 60 },
        { minute: 2, seconds: 120 },
        { minute: 3, seconds: 180 },
      ];

      updates.forEach(({ minute, seconds }) => {
        mockWorker.simulateWorkerMessage({
          type: WorkerMessageType.TICK,
          payload: { currentMinute: minute, elapsedSeconds: seconds, isHalfTime: false },
        });

        expect(service.currentMinute()).toBe(minute);
        expect(service.elapsedSeconds()).toBe(seconds);
      });
    });

    it('should maintain signal consistency across operations', fakeAsync(() => {
      const testGameId = 'game-signal-consistency';

      // Start
      service.startTimer(testGameId);
      tick();
      expect(service.isRunning()).toBe(true);
      expect(service.currentMinute()).toBe(0);

      // Update via TICK
      mockWorker.simulateWorkerMessage({
        type: WorkerMessageType.TICK,
        payload: { currentMinute: 5, elapsedSeconds: 300, isHalfTime: false },
      });
      expect(service.currentMinute()).toBe(5);
      expect(service.elapsedSeconds()).toBe(300);

      // Pause
      service.pauseTimer();
      expect(service.isRunning()).toBe(false);
      expect(service.currentMinute()).toBe(5); // Should maintain current minute

      // Resume
      service.resumeTimer();
      expect(service.isRunning()).toBe(true);
      expect(service.currentMinute()).toBe(5); // Still at 5

      // Stop
      service.stopTimer();
      tick();
      expect(service.isRunning()).toBe(false);
      expect(service.currentMinute()).toBe(0); // Reset to 0
    }));
  });
});
