/**
 * Game Timer Web Worker
 * Epic 5: Live Game Tracking
 * Story 5.2: Game Timer with Web Worker
 *
 * Runs timer independently in background thread for accurate timing.
 * Tracks currentMinute (0-90+), elapsed time, paused/running state.
 * Detects half-time at 45 minutes and sends messages every second.
 *
 * Commands: START, PAUSE, RESUME, SET_MINUTE, STOP
 * Events: TICK, PERSIST, HALF_TIME, ERROR
 */

import {
  WorkerMessageType,
  TimerMessage,
  TimerState,
  calculateMinuteFromSeconds,
  isHalfTimeReached,
} from '../models/game-timer.model';

// Worker state
let intervalId: number | null = null;
let currentState: TimerState | null = null;
let persistCounter = 0;
const PERSIST_INTERVAL = 5; // Persist every 5 seconds

/**
 * Initialize worker message listener
 */
addEventListener('message', (event: MessageEvent<TimerMessage>) => {
  const message = event.data;

  try {
    switch (message.type) {
      case WorkerMessageType.START:
        handleStart(message);
        break;
      case WorkerMessageType.PAUSE:
        handlePause();
        break;
      case WorkerMessageType.RESUME:
        handleResume();
        break;
      case WorkerMessageType.SET_MINUTE:
        handleSetMinute(message);
        break;
      case WorkerMessageType.STOP:
        handleStop();
        break;
      default:
        sendError(`Unknown message type: ${message.type}`);
    }
  } catch (error) {
    sendError(error instanceof Error ? error.message : 'Unknown error in worker');
  }
});

/**
 * Handle START command
 * Initializes timer and starts ticking
 */
function handleStart(message: TimerMessage): void {
  const { gameId, initialMinute = 0, initialElapsedSeconds = 0 } = message.payload || {};

  if (!gameId) {
    sendError('START command requires gameId');
    return;
  }

  // Stop existing timer if running
  if (intervalId !== null) {
    clearInterval(intervalId);
  }

  // Initialize state
  currentState = {
    gameId,
    currentMinute: initialMinute,
    startedAt: Date.now(),
    pausedAt: null,
    isRunning: true,
    isHalfTime: isHalfTimeReached(initialMinute),
    elapsedSeconds: initialElapsedSeconds,
    updatedAt: Date.now(),
  };

  // Reset persist counter
  persistCounter = 0;

  // Start interval (1 second ticks)
  intervalId = setInterval(() => {
    tick();
  }, 1000) as unknown as number;

  // Send initial tick
  sendTick();
}

/**
 * Handle PAUSE command
 * Pauses timer and stops ticking
 */
function handlePause(): void {
  if (!currentState) {
    sendError('No active timer to pause');
    return;
  }

  if (!currentState.isRunning) {
    sendError('Timer is already paused');
    return;
  }

  // Stop interval
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }

  // Update state
  currentState.isRunning = false;
  currentState.pausedAt = Date.now();
  currentState.updatedAt = Date.now();

  // Send persist immediately on pause
  sendPersist();
}

/**
 * Handle RESUME command
 * Resumes paused timer
 */
function handleResume(): void {
  if (!currentState) {
    sendError('No timer to resume');
    return;
  }

  if (currentState.isRunning) {
    sendError('Timer is already running');
    return;
  }

  // Update state
  currentState.isRunning = true;
  currentState.pausedAt = null;
  currentState.updatedAt = Date.now();

  // Reset persist counter
  persistCounter = 0;

  // Restart interval
  intervalId = setInterval(() => {
    tick();
  }, 1000) as unknown as number;

  // Send tick
  sendTick();
}

/**
 * Handle SET_MINUTE command
 * Manually sets the current minute (e.g., for corrections)
 */
function handleSetMinute(message: TimerMessage): void {
  const { minute } = message.payload || {};

  if (!currentState) {
    sendError('No active timer to set minute');
    return;
  }

  if (minute === undefined || minute < 0) {
    sendError('SET_MINUTE requires valid minute (>= 0)');
    return;
  }

  // Update state
  currentState.currentMinute = minute;
  currentState.elapsedSeconds = minute * 60;
  currentState.updatedAt = Date.now();

  // Check for half-time transition
  const wasHalfTime = currentState.isHalfTime;
  currentState.isHalfTime = isHalfTimeReached(minute);

  // Send half-time event if just reached
  if (!wasHalfTime && currentState.isHalfTime) {
    sendHalfTime();
  }

  // Send persist immediately on manual change
  sendPersist();

  // Send tick to update UI
  sendTick();
}

/**
 * Handle STOP command
 * Stops and clears timer
 */
function handleStop(): void {
  // Stop interval
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }

  // Send final persist before clearing
  if (currentState) {
    sendPersist();
  }

  // Clear state
  currentState = null;
  persistCounter = 0;
}

/**
 * Tick function called every second
 * Updates elapsed time and current minute
 */
function tick(): void {
  if (!currentState || !currentState.isRunning) {
    return;
  }

  // Increment elapsed seconds
  currentState.elapsedSeconds += 1;

  // Calculate current minute
  const newMinute = calculateMinuteFromSeconds(currentState.elapsedSeconds);
  const previousMinute = currentState.currentMinute;
  currentState.currentMinute = newMinute;

  // Update timestamp
  currentState.updatedAt = Date.now();

  // Check for half-time transition (45 minutes)
  const wasHalfTime = currentState.isHalfTime;
  currentState.isHalfTime = isHalfTimeReached(newMinute);

  // Send half-time event if just reached
  if (!wasHalfTime && currentState.isHalfTime) {
    sendHalfTime();
  }

  // Send tick to main thread
  sendTick();

  // Increment persist counter
  persistCounter += 1;

  // Send persist every 5 seconds
  if (persistCounter >= PERSIST_INTERVAL) {
    sendPersist();
    persistCounter = 0;
  }
}

/**
 * Send TICK event to main thread
 */
function sendTick(): void {
  if (!currentState) return;

  const message: TimerMessage = {
    type: WorkerMessageType.TICK,
    payload: {
      currentMinute: currentState.currentMinute,
      elapsedSeconds: currentState.elapsedSeconds,
      isHalfTime: currentState.isHalfTime,
    },
  };

  postMessage(message);
}

/**
 * Send PERSIST event to main thread
 * Triggers IndexedDB save in service
 */
function sendPersist(): void {
  if (!currentState) return;

  const message: TimerMessage = {
    type: WorkerMessageType.PERSIST,
    payload: {
      state: { ...currentState },
    },
  };

  postMessage(message);
}

/**
 * Send HALF_TIME event to main thread
 */
function sendHalfTime(): void {
  if (!currentState) return;

  const message: TimerMessage = {
    type: WorkerMessageType.HALF_TIME,
    payload: {
      currentMinute: currentState.currentMinute,
    },
  };

  postMessage(message);
}

/**
 * Send ERROR event to main thread
 */
function sendError(error: string): void {
  const message: TimerMessage = {
    type: WorkerMessageType.ERROR,
    payload: {
      error,
    },
  };

  postMessage(message);
}

/**
 * Export for TypeScript type checking
 * (Not actually exported in Web Worker context)
 */
export {};
