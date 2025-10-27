/**
 * Game Attendance Model
 * Epic 4: Game Management & Calendar Integration
 * Tracks which players attended each game
 */

export type AttendanceStatus = 'attended' | 'excused' | 'absent';

/**
 * Game attendance entity (from database)
 */
export interface GameAttendance {
  id: string;
  game_id: string;
  player_id: string;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Form data for marking attendance
 */
export interface GameAttendanceFormData {
  player_id: string;
  status: AttendanceStatus;
}

/**
 * Bulk attendance update
 */
export interface BulkGameAttendanceUpdate {
  player_ids: string[];
  status: AttendanceStatus;
}

/**
 * Get attendance status color for UI
 */
export function getAttendanceStatusColor(status: AttendanceStatus): string {
  switch (status) {
    case 'attended':
      return 'success';
    case 'excused':
      return 'warning';
    case 'absent':
      return 'error';
  }
}

/**
 * Get attendance status label for UI
 */
export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  switch (status) {
    case 'attended':
      return 'Attended';
    case 'excused':
      return 'Excused';
    case 'absent':
      return 'Absent';
  }
}
