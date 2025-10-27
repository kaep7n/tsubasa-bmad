/**
 * Game Timer Model
 * Epic 5: Live Game Tracking
 * Story 5.2: Game Timer with Web Worker
 *
 * Models for game timer state and worker communication
 */

/**
 * Timer state persisted to IndexedDB
 * Single row per game
 */
export interface TimerState {
  gameId: string;
  currentMinute: number; // 0-90+ minutes
  startedAt: number | null; // Unix timestamp (ms) when timer started
  pausedAt: number | null; // Unix timestamp (ms) when timer was paused
  isRunning: boolean;
  isHalfTime: boolean; // True when currentMinute reaches 45
  elapsedSeconds: number; // Total elapsed seconds (excludes paused time)
  updatedAt: number; // Unix timestamp (ms) of last update
}

/**
 * Worker message types for communication between main thread and worker
 */
export enum WorkerMessageType {
  // Commands from main thread to worker
  START = 'START',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  SET_MINUTE = 'SET_MINUTE',
  STOP = 'STOP',

  // Events from worker to main thread
  TICK = 'TICK',
  PERSIST = 'PERSIST',
  HALF_TIME = 'HALF_TIME',
  ERROR = 'ERROR',
}

/**
 * Base message structure for worker communication
 */
export interface TimerMessage {
  type: WorkerMessageType;
  payload?: TimerMessagePayload;
}

/**
 * Payload for worker messages
 */
export interface TimerMessagePayload {
  // For START command
  gameId?: string;
  initialMinute?: number;
  initialElapsedSeconds?: number;

  // For SET_MINUTE command
  minute?: number;

  // For TICK event
  currentMinute?: number;
  elapsedSeconds?: number;
  isHalfTime?: boolean;

  // For PERSIST event
  state?: TimerState;

  // For ERROR event
  error?: string;
}

/**
 * Default timer state for new games
 */
export function createDefaultTimerState(gameId: string): TimerState {
  return {
    gameId,
    currentMinute: 0,
    startedAt: null,
    pausedAt: null,
    isRunning: false,
    isHalfTime: false,
    elapsedSeconds: 0,
    updatedAt: Date.now(),
  };
}

/**
 * Check if timer has reached half-time (45 minutes)
 */
export function isHalfTimeReached(currentMinute: number): boolean {
  return currentMinute >= 45 && currentMinute < 90;
}

/**
 * Calculate current minute from elapsed seconds
 */
export function calculateMinuteFromSeconds(elapsedSeconds: number): number {
  return Math.floor(elapsedSeconds / 60);
}

/**
 * Format timer display (MM:SS)
 */
export function formatTimerDisplay(currentMinute: number, elapsedSeconds: number): string {
  const seconds = elapsedSeconds % 60;
  return `${currentMinute.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Validate timer state
 */
export function isValidTimerState(state: Partial<TimerState>): state is TimerState {
  return (
    typeof state.gameId === 'string' &&
    typeof state.currentMinute === 'number' &&
    (state.startedAt === null || typeof state.startedAt === 'number') &&
    (state.pausedAt === null || typeof state.pausedAt === 'number') &&
    typeof state.isRunning === 'boolean' &&
    typeof state.isHalfTime === 'boolean' &&
    typeof state.elapsedSeconds === 'number' &&
    typeof state.updatedAt === 'number'
  );
}
