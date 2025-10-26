/**
 * Training Attendance Model
 * Story: 3.1 Training Sessions Database Schema
 * Represents player attendance records for training sessions
 */

export type AttendanceStatus = 'attended' | 'excused' | 'absent';

export interface TrainingAttendance {
  id: string;
  training_session_id: string;
  player_id: string;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Training Attendance with player information for display
 */
export interface TrainingAttendanceWithPlayer extends TrainingAttendance {
  player_first_name: string;
  player_last_name: string;
  player_jersey_number: number | null;
  player_photo_url: string | null;
}

/**
 * Attendance summary for a training session
 */
export interface AttendanceSummary {
  training_session_id: string;
  total_players: number;
  attended: number;
  excused: number;
  absent: number;
  attendance_rate: number; // Percentage (0-100)
}

/**
 * Bulk attendance update payload
 */
export interface BulkAttendanceUpdate {
  player_ids: string[];
  status: AttendanceStatus;
}

/**
 * Helper function to get status display text
 */
export function getStatusDisplayText(status: AttendanceStatus): string {
  switch (status) {
    case 'attended':
      return 'Attended';
    case 'excused':
      return 'Excused';
    case 'absent':
      return 'Absent';
  }
}

/**
 * Helper function to get status color class
 */
export function getStatusColorClass(status: AttendanceStatus): string {
  switch (status) {
    case 'attended':
      return 'status-attended';
    case 'excused':
      return 'status-excused';
    case 'absent':
      return 'status-absent';
  }
}

/**
 * Helper function to calculate attendance rate
 */
export function calculateAttendanceRate(attended: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

/**
 * Helper function to create an attendance summary from records
 */
export function createAttendanceSummary(
  sessionId: string,
  attendanceRecords: TrainingAttendance[],
): AttendanceSummary {
  const total = attendanceRecords.length;
  const attended = attendanceRecords.filter(r => r.status === 'attended').length;
  const excused = attendanceRecords.filter(r => r.status === 'excused').length;
  const absent = attendanceRecords.filter(r => r.status === 'absent').length;

  return {
    training_session_id: sessionId,
    total_players: total,
    attended,
    excused,
    absent,
    attendance_rate: calculateAttendanceRate(attended, total),
  };
}

/**
 * Helper function to get all possible attendance statuses
 */
export function getAllAttendanceStatuses(): AttendanceStatus[] {
  return ['attended', 'excused', 'absent'];
}
