/**
 * Training Session Model
 * Represents a training session scheduled by the coach
 */

export type TrainingStatus = 'scheduled' | 'completed' | 'cancelled';

export interface TrainingSession {
  id: string;
  coach_id: string;
  date: Date;
  start_time: string;
  duration_minutes: number | null;
  location: string | null;
  status: TrainingStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTrainingSessionRequest {
  coach_id: string;
  date: string; // ISO date string
  start_time: string;
  duration_minutes?: number;
  location?: string;
  status?: TrainingStatus;
}

export interface UpdateTrainingSessionRequest {
  date?: string;
  start_time?: string;
  duration_minutes?: number;
  location?: string;
  status?: TrainingStatus;
}
