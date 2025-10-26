import { Injectable, signal } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { DatabaseService } from '../../../core/services/database.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SyncService } from '../../../core/services/sync.service';
import {
  TrainingTemplate,
  TrainingTemplateFormData,
} from '../../../core/models/training-template.model';

/**
 * TrainingTemplateService
 * Story: 3.2 Training Template Creation
 * Manages training session templates with offline-first architecture
 */
@Injectable({
  providedIn: 'root',
})
export class TrainingTemplateService {
  // Signal to hold templates for reactive UI
  private templatesSignal = signal<TrainingTemplate[]>([]);
  public readonly templates = this.templatesSignal.asReadonly();

  constructor(
    private db: DatabaseService,
    private supabase: SupabaseService,
    private syncService: SyncService,
  ) {}

  /**
   * Get all templates for a team
   * Cache-first: Returns cached data immediately, then fetches from Supabase in background
   */
  getTemplates(teamId: string): Observable<TrainingTemplate[]> {
    // First, get from IndexedDB cache
    return from(this.db.db.training_templates.where('team_id').equals(teamId).toArray()).pipe(
      tap(templates => this.templatesSignal.set(templates)),
      switchMap(cachedTemplates => {
        // Background fetch from Supabase if online
        if (navigator.onLine) {
          this.fetchFromSupabase(teamId).subscribe();
        }
        return of(cachedTemplates);
      }),
      catchError(error => {
        console.error('Error getting templates from IndexedDB:', error);
        return of([]);
      }),
    );
  }

  /**
   * Fetch templates from Supabase and update IndexedDB cache
   */
  private fetchFromSupabase(teamId: string): Observable<TrainingTemplate[]> {
    return from(
      this.supabase.client
        .from('training_templates')
        .select('*')
        .eq('team_id', teamId)
        .order('name', { ascending: true }),
    ).pipe(
      switchMap(async ({ data, error }) => {
        if (error) throw error;

        const templates = (data || []) as TrainingTemplate[];

        // Update IndexedDB cache
        await this.db.db.training_templates.bulkPut(templates);

        // Update signal
        this.templatesSignal.set(templates);

        return templates;
      }),
      catchError(error => {
        console.error('Error fetching templates from Supabase:', error);
        return of([]);
      }),
    );
  }

  /**
   * Create a new training template
   */
  createTemplate(
    teamId: string,
    templateData: TrainingTemplateFormData,
  ): Observable<TrainingTemplate> {
    const template: Omit<TrainingTemplate, 'id' | 'created_at' | 'updated_at'> = {
      team_id: teamId,
      ...templateData,
    };

    return from(
      (async () => {
        // Generate client-side UUID
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const newTemplate: TrainingTemplate = {
          id,
          ...template,
          created_at: now,
          updated_at: now,
        };

        // Save to IndexedDB first
        await this.db.db.training_templates.add(newTemplate);

        // Update signal
        const currentTemplates = this.templatesSignal();
        this.templatesSignal.set([...currentTemplates, newTemplate]);

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client
            .from('training_templates')
            .insert(newTemplate);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation('training_templates', 'insert', id, newTemplate);
        }

        return newTemplate;
      })(),
    );
  }

  /**
   * Update an existing training template
   */
  updateTemplate(
    templateId: string,
    updates: Partial<TrainingTemplateFormData>,
  ): Observable<TrainingTemplate> {
    return from(
      (async () => {
        const now = new Date().toISOString();
        const updateData = {
          ...updates,
          updated_at: now,
        };

        // Update in IndexedDB
        await this.db.db.training_templates.update(templateId, updateData);

        // Get updated template
        const updatedTemplate = await this.db.db.training_templates.get(templateId);
        if (!updatedTemplate) throw new Error('Template not found');

        // Update signal
        const currentTemplates = this.templatesSignal();
        const index = currentTemplates.findIndex(t => t.id === templateId);
        if (index !== -1) {
          const newTemplates = [...currentTemplates];
          newTemplates[index] = updatedTemplate;
          this.templatesSignal.set(newTemplates);
        }

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client
            .from('training_templates')
            .update(updateData)
            .eq('id', templateId);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation(
            'training_templates',
            'update',
            templateId,
            updateData,
          );
        }

        return updatedTemplate;
      })(),
    );
  }

  /**
   * Delete a training template
   */
  deleteTemplate(templateId: string): Observable<void> {
    return from(
      (async () => {
        // Delete from IndexedDB
        await this.db.db.training_templates.delete(templateId);

        // Update signal
        const currentTemplates = this.templatesSignal();
        this.templatesSignal.set(currentTemplates.filter(t => t.id !== templateId));

        // Queue for sync if offline, otherwise sync immediately
        if (navigator.onLine) {
          const { error } = await this.supabase.client
            .from('training_templates')
            .delete()
            .eq('id', templateId);

          if (error) throw error;
        } else {
          await this.syncService.queueOperation('training_templates', 'delete', templateId, {});
        }
      })(),
    );
  }

  /**
   * Get a single template by ID
   */
  getTemplate(templateId: string): Observable<TrainingTemplate | null> {
    return from(this.db.db.training_templates.get(templateId)).pipe(
      map(template => template || null),
      catchError(error => {
        console.error('Error getting template:', error);
        return of(null);
      }),
    );
  }

  /**
   * Refresh templates from Supabase (for pull-to-refresh)
   */
  refreshTemplates(teamId: string): Observable<TrainingTemplate[]> {
    return this.fetchFromSupabase(teamId);
  }
}
