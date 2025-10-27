/**
 * Game Timer Service
 * Epic 5: Live Game Tracking
 * Story 5.2: Game Timer with Web Worker
 *
 * Manages game timer using Web Worker for accurate background timing.
 * Persists state to IndexedDB every 5 seconds.
 * Handles Page Visibility API for background/wake corrections.
 * Resumes from last state on initialization.
 */

import { Injectable, signal, WritableSignal, OnDestroy } from '@angular/core';
import { DatabaseService } from './database.service';
import {
  TimerState,
  TimerMessage,
  WorkerMessageType,
  createDefaultTimerState,
  isValidTimerState,
} from '../models/game-timer.model';

@Injectable({
  providedIn: 'root',
})
export class GameTimerService implements OnDestroy {
  // Reactive signals for timer state
  private readonly _currentMinute: WritableSignal<number> = signal(0);
  private readonly _isRunning: WritableSignal<boolean> = signal(false);
  private readonly _isHalfTime: WritableSignal<boolean> = signal(false);
  private readonly _elapsedSeconds: WritableSignal<number> = signal(0);

  // Public read-only signals
  public readonly currentMinute = this._currentMinute.asReadonly();
  public readonly isRunning = this._isRunning.asReadonly();
  public readonly isHalfTime = this._isHalfTime.asReadonly();
  public readonly elapsedSeconds = this._elapsedSeconds.asReadonly();

  // Web Worker instance
  private worker: Worker | null = null;

  // Current game ID
  private currentGameId: string | null = null;

  // Page visibility listener
  private visibilityListener: (() => void) | null = null;

  // beforeunload listener
  private beforeUnloadListener: (() => void) | null = null;

  // Last known state timestamp (for drift correction)
  private lastStateTimestamp = 0;

  constructor(private databaseService: DatabaseService) {
    this.initializeWorker();
    this.setupPageVisibility();
    this.setupBeforeUnload();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Initialize Web Worker
   */
  private initializeWorker(): void {
    try {
      // Create worker from TypeScript file
      // Note: Angular CLI handles worker compilation automatically
      this.worker = new Worker(new URL('../workers/game-timer.worker', import.meta.url), {
        type: 'module',
      });

      // Listen for messages from worker
      this.worker.onmessage = (event: MessageEvent<TimerMessage>) => {
        this.handleWorkerMessage(event.data);
      };

      // Handle worker errors
      this.worker.onerror = (error: ErrorEvent) => {
        console.error('[GameTimerService] Worker error:', error);
      };
    } catch (error) {
      console.error('[GameTimerService] Failed to initialize worker:', error);
    }
  }

  /**
   * Handle messages from Web Worker
   */
  private handleWorkerMessage(message: TimerMessage): void {
    switch (message.type) {
      case WorkerMessageType.TICK:
        this.handleTick(message);
        break;

      case WorkerMessageType.PERSIST:
        this.handlePersist(message);
        break;

      case WorkerMessageType.HALF_TIME:
        this.handleHalfTime(message);
        break;

      case WorkerMessageType.ERROR:
        this.handleError(message);
        break;
    }
  }

  /**
   * Handle TICK event from worker
   * Updates signals with current timer state
   */
  private handleTick(message: TimerMessage): void {
    const { currentMinute, elapsedSeconds, isHalfTime } = message.payload || {};

    if (currentMinute !== undefined) {
      this._currentMinute.set(currentMinute);
    }

    if (elapsedSeconds !== undefined) {
      this._elapsedSeconds.set(elapsedSeconds);
    }

    if (isHalfTime !== undefined) {
      this._isHalfTime.set(isHalfTime);
    }

    this.lastStateTimestamp = Date.now();
  }

  /**
   * Handle PERSIST event from worker
   * Saves state to IndexedDB
   */
  private async handlePersist(message: TimerMessage): Promise<void> {
    const { state } = message.payload || {};

    if (!state || !isValidTimerState(state)) {
      console.error('[GameTimerService] Invalid state to persist:', state);
      return;
    }

    try {
      // Save to IndexedDB timer_state table
      await this.databaseService.db.timer_state.put(state);
    } catch (error) {
      console.error('[GameTimerService] Failed to persist timer state:', error);
    }
  }

  /**
   * Handle HALF_TIME event from worker
   * Can be used for notifications or UI updates
   */
  private handleHalfTime(message: TimerMessage): void {
    const { currentMinute } = message.payload || {};
    console.log(`[GameTimerService] Half-time reached at minute ${currentMinute}`);

    // Could trigger notification or other side effects here
    // For now, just log
  }

  /**
   * Handle ERROR event from worker
   */
  private handleError(message: TimerMessage): void {
    const { error } = message.payload || {};
    console.error('[GameTimerService] Worker error:', error);
  }

  /**
   * Start timer for a game
   * Resumes from last state if available, otherwise starts from 0
   */
  public async startTimer(gameId: string): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    // Stop any existing timer
    if (this.currentGameId) {
      await this.stopTimer();
    }

    this.currentGameId = gameId;

    // Try to load existing state
    let state: TimerState | undefined;
    try {
      state = await this.databaseService.db.timer_state.get(gameId);
    } catch (error) {
      console.error('[GameTimerService] Failed to load timer state:', error);
    }

    // Determine initial values
    let initialMinute = 0;
    let initialElapsedSeconds = 0;

    if (state && isValidTimerState(state)) {
      // Resume from saved state
      initialMinute = state.currentMinute;
      initialElapsedSeconds = state.elapsedSeconds;

      console.log(
        `[GameTimerService] Resuming timer from minute ${initialMinute}, elapsed ${initialElapsedSeconds}s`
      );
    } else {
      console.log('[GameTimerService] Starting new timer');
    }

    // Send START command to worker
    const message: TimerMessage = {
      type: WorkerMessageType.START,
      payload: {
        gameId,
        initialMinute,
        initialElapsedSeconds,
      },
    };

    this.worker.postMessage(message);

    // Update signals
    this._isRunning.set(true);
    this._currentMinute.set(initialMinute);
    this._elapsedSeconds.set(initialElapsedSeconds);
    this.lastStateTimestamp = Date.now();
  }

  /**
   * Pause timer
   */
  public pauseTimer(): void {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    if (!this.currentGameId) {
      console.warn('[GameTimerService] No active timer to pause');
      return;
    }

    const message: TimerMessage = {
      type: WorkerMessageType.PAUSE,
    };

    this.worker.postMessage(message);

    // Update signal
    this._isRunning.set(false);
  }

  /**
   * Resume timer
   */
  public resumeTimer(): void {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    if (!this.currentGameId) {
      console.warn('[GameTimerService] No timer to resume');
      return;
    }

    const message: TimerMessage = {
      type: WorkerMessageType.RESUME,
    };

    this.worker.postMessage(message);

    // Update signal
    this._isRunning.set(true);
    this.lastStateTimestamp = Date.now();
  }

  /**
   * Set current minute manually (for corrections)
   */
  public setMinute(minute: number): void {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    if (!this.currentGameId) {
      console.warn('[GameTimerService] No active timer to set minute');
      return;
    }

    if (minute < 0) {
      console.error('[GameTimerService] Minute must be >= 0');
      return;
    }

    const message: TimerMessage = {
      type: WorkerMessageType.SET_MINUTE,
      payload: {
        minute,
      },
    };

    this.worker.postMessage(message);

    // Update signals immediately
    this._currentMinute.set(minute);
    this._elapsedSeconds.set(minute * 60);
  }

  /**
   * Stop timer and clear state
   */
  public async stopTimer(): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    if (!this.currentGameId) {
      console.warn('[GameTimerService] No active timer to stop');
      return;
    }

    const message: TimerMessage = {
      type: WorkerMessageType.STOP,
    };

    this.worker.postMessage(message);

    // Clear signals
    this._isRunning.set(false);
    this._currentMinute.set(0);
    this._isHalfTime.set(false);
    this._elapsedSeconds.set(0);

    // Clear game ID
    this.currentGameId = null;
    this.lastStateTimestamp = 0;
  }

  /**
   * Get current timer state from IndexedDB
   */
  public async getTimerState(gameId: string): Promise<TimerState | undefined> {
    try {
      return await this.databaseService.db.timer_state.get(gameId);
    } catch (error) {
      console.error('[GameTimerService] Failed to get timer state:', error);
      return undefined;
    }
  }

  /**
   * Clear timer state from IndexedDB
   */
  public async clearTimerState(gameId: string): Promise<void> {
    try {
      await this.databaseService.db.timer_state.delete(gameId);
    } catch (error) {
      console.error('[GameTimerService] Failed to clear timer state:', error);
    }
  }

  /**
   * Setup Page Visibility API
   * Corrects timer drift when page becomes visible again
   */
  private setupPageVisibility(): void {
    if (typeof document === 'undefined') {
      return; // Not in browser environment
    }

    this.visibilityListener = async () => {
      if (document.visibilityState === 'visible' && this.currentGameId) {
        // Page became visible - check for drift
        await this.correctTimerDrift();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  /**
   * Correct timer drift after page wake
   * Compares expected elapsed time vs actual elapsed time
   */
  private async correctTimerDrift(): Promise<void> {
    if (!this.currentGameId || !this._isRunning()) {
      return;
    }

    try {
      // Load state from IndexedDB
      const state = await this.databaseService.db.timer_state.get(this.currentGameId);

      if (!state || !isValidTimerState(state)) {
        return;
      }

      // Calculate time since last update
      const now = Date.now();
      const timeSinceUpdate = now - state.updatedAt;

      // If more than 2 seconds have passed, we might have drift
      if (timeSinceUpdate > 2000 && state.isRunning) {
        // Calculate expected elapsed seconds
        const driftSeconds = Math.floor(timeSinceUpdate / 1000);
        const expectedElapsedSeconds = state.elapsedSeconds + driftSeconds;
        const expectedMinute = Math.floor(expectedElapsedSeconds / 60);

        console.log(
          `[GameTimerService] Correcting drift: ${driftSeconds}s, setting to minute ${expectedMinute}`
        );

        // Update worker to correct time
        this.setMinute(expectedMinute);
      }
    } catch (error) {
      console.error('[GameTimerService] Failed to correct timer drift:', error);
    }
  }

  /**
   * Setup beforeunload listener
   * Persists state before page close
   */
  private setupBeforeUnload(): void {
    if (typeof window === 'undefined') {
      return; // Not in browser environment
    }

    this.beforeUnloadListener = async () => {
      // Force persist on page close
      if (this.currentGameId && this._isRunning()) {
        // Note: We can't use async/await here as beforeunload is synchronous
        // The worker's STOP command will trigger a persist automatically
        this.worker?.postMessage({ type: WorkerMessageType.STOP });
      }
    };

    window.addEventListener('beforeunload', this.beforeUnloadListener);
  }

  /**
   * Cleanup listeners and worker
   */
  private cleanup(): void {
    // Remove visibility listener
    if (this.visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = null;
    }

    // Remove beforeunload listener
    if (this.beforeUnloadListener && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
      this.beforeUnloadListener = null;
    }

    // Terminate worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Clear signals
    this._isRunning.set(false);
    this._currentMinute.set(0);
    this._isHalfTime.set(false);
    this._elapsedSeconds.set(0);

    this.currentGameId = null;
    this.lastStateTimestamp = 0;
  }
}
