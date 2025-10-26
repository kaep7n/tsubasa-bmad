import { TestBed } from '@angular/core/testing';
import { TrainingTemplateService } from './training-template.service';
import { DatabaseService } from '../../../core/services/database.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SyncService } from '../../../core/services/sync.service';

/**
 * Unit Tests for TrainingTemplateService
 * Story: 3.2 Training Template Creation
 */
describe('TrainingTemplateService', () => {
  let service: TrainingTemplateService;
  let dbService: jasmine.SpyObj<DatabaseService>;
  let _supabaseService: jasmine.SpyObj<SupabaseService>;
  let syncService: jasmine.SpyObj<SyncService>;

  const mockTeamId = 'team-1';
  const mockTemplateId = 'template-1';

  beforeEach(() => {
    // Create spy objects
    const dbSpy = jasmine.createSpyObj('DatabaseService', ['db']);
    const supabaseSpy = jasmine.createSpyObj('SupabaseService', ['client']);
    const syncSpy = jasmine.createSpyObj('SyncService', ['queueOperation']);

    // Mock IndexedDB table
    dbSpy.db = {
      training_templates: {
        where: jasmine.createSpy('where').and.returnValue({
          equals: jasmine.createSpy('equals').and.returnValue({
            toArray: jasmine.createSpy('toArray').and.returnValue(Promise.resolve([])),
          }),
        }),
        add: jasmine.createSpy('add').and.returnValue(Promise.resolve(mockTemplateId)),
        update: jasmine.createSpy('update').and.returnValue(Promise.resolve(1)),
        delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
        get: jasmine.createSpy('get').and.returnValue(
          Promise.resolve({
            id: mockTemplateId,
            team_id: mockTeamId,
            name: 'Test Template',
            default_duration_minutes: 90,
            default_location: 'Main Field',
            created_at: '2025-10-26T00:00:00Z',
            updated_at: '2025-10-26T00:00:00Z',
          }),
        ),
        bulkPut: jasmine.createSpy('bulkPut').and.returnValue(Promise.resolve()),
      },
    };

    // Mock Supabase client
    supabaseSpy.client = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({
                data: [],
                error: null,
              }),
            ),
          }),
        }),
        insert: jasmine.createSpy('insert').and.returnValue(
          Promise.resolve({
            error: null,
          }),
        ),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(
            Promise.resolve({
              error: null,
            }),
          ),
        }),
        delete: jasmine.createSpy('delete').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(
            Promise.resolve({
              error: null,
            }),
          ),
        }),
      }),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        TrainingTemplateService,
        { provide: DatabaseService, useValue: dbSpy },
        { provide: SupabaseService, useValue: supabaseSpy },
        { provide: SyncService, useValue: syncSpy },
      ],
    });

    service = TestBed.inject(TrainingTemplateService);
    dbService = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    _supabaseService = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
    syncService = TestBed.inject(SyncService) as jasmine.SpyObj<SyncService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTemplates', () => {
    it('should fetch templates from IndexedDB', done => {
      service.getTemplates(mockTeamId).subscribe(templates => {
        expect(Array.isArray(templates)).toBeTrue();
        done();
      });
    });

    it('should update templates signal', done => {
      service.getTemplates(mockTeamId).subscribe(() => {
        const templates = service.templates();
        expect(Array.isArray(templates)).toBeTrue();
        done();
      });
    });
  });

  describe('createTemplate', () => {
    it('should create a new template', done => {
      const templateData = {
        name: 'Tuesday Practice',
        default_duration_minutes: 90,
        default_location: 'Main Field',
      };

      service.createTemplate(mockTeamId, templateData).subscribe(template => {
        expect(template).toBeDefined();
        expect(template.name).toBe(templateData.name);
        done();
      });
    });

    it('should add template to IndexedDB', done => {
      const templateData = {
        name: 'Tuesday Practice',
        default_duration_minutes: 90,
        default_location: 'Main Field',
      };

      service.createTemplate(mockTeamId, templateData).subscribe(() => {
        expect(dbService.db.training_templates.add).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('updateTemplate', () => {
    it('should update an existing template', done => {
      const updates = {
        name: 'Updated Practice',
        default_duration_minutes: 120,
      };

      service.updateTemplate(mockTemplateId, updates).subscribe(template => {
        expect(template).toBeDefined();
        done();
      });
    });

    it('should update template in IndexedDB', done => {
      const updates = {
        name: 'Updated Practice',
      };

      service.updateTemplate(mockTemplateId, updates).subscribe(() => {
        expect(dbService.db.training_templates.update).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', done => {
      service.deleteTemplate(mockTemplateId).subscribe(() => {
        expect(dbService.db.training_templates.delete).toHaveBeenCalledWith(mockTemplateId);
        done();
      });
    });

    it('should remove template from signal', done => {
      // First add a template to signal
      service['templatesSignal'].set([
        {
          id: mockTemplateId,
          team_id: mockTeamId,
          name: 'Test Template',
          default_duration_minutes: 90,
          default_location: 'Main Field',
          created_at: '2025-10-26T00:00:00Z',
          updated_at: '2025-10-26T00:00:00Z',
        },
      ]);

      service.deleteTemplate(mockTemplateId).subscribe(() => {
        const templates = service.templates();
        expect(templates.length).toBe(0);
        done();
      });
    });
  });

  describe('getTemplate', () => {
    it('should fetch a single template by ID', done => {
      service.getTemplate(mockTemplateId).subscribe(template => {
        expect(template).toBeDefined();
        expect(template?.id).toBe(mockTemplateId);
        done();
      });
    });

    it('should return null if template not found', done => {
      dbService.db.training_templates.get = jasmine
        .createSpy('get')
        .and.returnValue(Promise.resolve(undefined));

      service.getTemplate('non-existent').subscribe(template => {
        expect(template).toBeNull();
        done();
      });
    });
  });

  describe('offline handling', () => {
    beforeEach(() => {
      // Mock navigator.onLine
      spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);
    });

    it('should queue create operation when offline', done => {
      const templateData = {
        name: 'Offline Template',
        default_duration_minutes: 90,
        default_location: null,
      };

      service.createTemplate(mockTeamId, templateData).subscribe(() => {
        expect(syncService.queueOperation).toHaveBeenCalled();
        done();
      });
    });

    it('should queue update operation when offline', done => {
      const updates = {
        name: 'Updated Offline',
      };

      service.updateTemplate(mockTemplateId, updates).subscribe(() => {
        expect(syncService.queueOperation).toHaveBeenCalled();
        done();
      });
    });

    it('should queue delete operation when offline', done => {
      service.deleteTemplate(mockTemplateId).subscribe(() => {
        expect(syncService.queueOperation).toHaveBeenCalled();
        done();
      });
    });
  });
});
