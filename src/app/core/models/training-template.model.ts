/**
 * Training Template Model
 * Story: 3.1 Training Sessions Database Schema
 * Represents reusable templates for recurring training sessions
 */

export interface TrainingTemplate {
  id: string;
  team_id: string;
  name: string;
  default_duration_minutes: number;
  default_location: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Training Template form data (without auto-generated fields)
 */
export interface TrainingTemplateFormData {
  name: string;
  default_duration_minutes: number;
  default_location: string | null;
}

/**
 * Helper function to create a display name for a training template
 */
export function getTemplateDisplayName(template: TrainingTemplate): string {
  return `${template.name} (${template.default_duration_minutes} min)`;
}

/**
 * Helper function to get default values for a new training template
 */
export function getDefaultTrainingTemplate(): TrainingTemplateFormData {
  return {
    name: '',
    default_duration_minutes: 90,
    default_location: null,
  };
}
