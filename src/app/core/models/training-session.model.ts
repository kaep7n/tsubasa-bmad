/**
 * Training Session Model
 * Story: 3.1 Training Sessions Database Schema
 * Represents individual training sessions with attendance tracking
 */

export interface TrainingSession {
  id: string;
  team_id: string;
  session_template_id: string | null;
  date: string; // ISO 8601 timestamp
  duration_minutes: number;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Training Session form data (without auto-generated fields)
 */
export interface TrainingSessionFormData {
  session_template_id: string | null;
  date: string;
  duration_minutes: number;
  location: string | null;
  notes: string | null;
}

/**
 * Training Session with computed metadata for display
 */
export interface TrainingSessionDisplay extends TrainingSession {
  formattedDate: string;
  formattedTime: string;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Helper function to format training session date
 */
export function formatSessionDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Helper function to format training session time
 */
export function formatSessionTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Helper function to check if session is in the past
 */
export function isSessionPast(dateString: string): boolean {
  const sessionDate = new Date(dateString);
  const now = new Date();
  return sessionDate < now;
}

/**
 * Helper function to check if session is today
 */
export function isSessionToday(dateString: string): boolean {
  const sessionDate = new Date(dateString);
  const now = new Date();
  return (
    sessionDate.getDate() === now.getDate() &&
    sessionDate.getMonth() === now.getMonth() &&
    sessionDate.getFullYear() === now.getFullYear()
  );
}

/**
 * Helper function to convert TrainingSession to TrainingSessionDisplay
 */
export function toTrainingSessionDisplay(session: TrainingSession): TrainingSessionDisplay {
  return {
    ...session,
    formattedDate: formatSessionDate(session.date),
    formattedTime: formatSessionTime(session.date),
    isPast: isSessionPast(session.date),
    isToday: isSessionToday(session.date),
    isFuture: !isSessionPast(session.date) && !isSessionToday(session.date),
  };
}

/**
 * Helper function to get default values for a new training session
 */
export function getDefaultTrainingSession(): TrainingSessionFormData {
  // Default to tomorrow at 10:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  return {
    session_template_id: null,
    date: tomorrow.toISOString(),
    duration_minutes: 90,
    location: null,
    notes: null,
  };
}
