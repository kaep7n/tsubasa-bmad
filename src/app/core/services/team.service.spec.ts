import { TestBed } from '@angular/core/testing';
import { TeamService } from './team.service';
import { SupabaseService } from './supabase.service';
import { Team } from '../models/team.model';

describe('TeamService', () => {
  let service: TeamService;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockSupabaseClient: any;

  const mockUser = {
    id: 'user-123',
    email: 'coach@example.com',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockTeamData = {
    id: 'team-123',
    name: 'Test Team',
    season: '2024-2025',
    logo_url: 'https://example.com/logo.png',
    created_by: 'user-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockTeam: Team = {
    id: 'team-123',
    name: 'Test Team',
    season: '2024-2025',
    logo_url: 'https://example.com/logo.png',
    created_by: 'user-123',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jasmine
          .createSpy('getUser')
          .and.returnValue(Promise.resolve({ data: { user: mockUser }, error: null })),
      },
      from: jasmine.createSpy('from').and.returnValue({
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: mockTeamData, error: null })),
          }),
        }),
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: mockTeamData, error: null })),
          }),
        }),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ data: null, error: null })),
        }),
      }),
      storage: {
        from: jasmine.createSpy('storageFrom').and.returnValue({
          upload: jasmine
            .createSpy('upload')
            .and.returnValue(Promise.resolve({ data: { path: 'team-123.png' }, error: null })),
          getPublicUrl: jasmine.createSpy('getPublicUrl').and.returnValue({
            data: { publicUrl: 'https://example.com/logo.png' },
          }),
        }),
      },
    };

    mockSupabaseService = jasmine.createSpyObj('SupabaseService', [], {
      client: mockSupabaseClient,
    });

    TestBed.configureTestingModule({
      providers: [TeamService, { provide: SupabaseService, useValue: mockSupabaseService }],
    });

    service = TestBed.inject(TeamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createTeam', () => {
    it('should create a team successfully', done => {
      service.createTeam('Test Team', '2024-2025').subscribe({
        next: response => {
          expect(response.team).toEqual(mockTeam);
          expect(response.error).toBeNull();
          expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
          expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
          done();
        },
        error: () => fail('Should not error'),
      });
    });

    it('should handle authentication error', done => {
      mockSupabaseClient.auth.getUser.and.returnValue(
        Promise.resolve({ data: { user: null }, error: { message: 'Not authenticated' } }),
      );

      service.createTeam('Test Team', '2024-2025').subscribe({
        next: () => fail('Should have thrown an error'),
        error: error => {
          expect(error.message).toBe('User not authenticated');
          done();
        },
      });
    });

    it('should handle database error', done => {
      const insertSpy = mockSupabaseClient.from().insert;
      insertSpy()
        .select()
        .single.and.returnValue(
          Promise.resolve({ data: null, error: { message: 'Database error', code: '500' } }),
        );

      service.createTeam('Test Team', '2024-2025').subscribe({
        next: response => {
          expect(response.team).toBeNull();
          expect(response.error).toEqual({
            message: 'Database error',
            status: 500,
          });
          done();
        },
        error: () => fail('Should not throw error'),
      });
    });
  });

  describe('uploadTeamLogo', () => {
    it('should upload team logo successfully', done => {
      const mockFile = new File([''], 'logo.png', { type: 'image/png' });

      service.uploadTeamLogo('team-123', mockFile).subscribe({
        next: url => {
          expect(url).toBe('https://example.com/logo.png');
          expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('team-logos');
          done();
        },
        error: () => fail('Should not error'),
      });
    });

    it('should handle upload error', done => {
      const mockFile = new File([''], 'logo.png', { type: 'image/png' });
      const storageSpy = mockSupabaseClient.storage.from();
      storageSpy.upload.and.returnValue(
        Promise.resolve({ data: null, error: { message: 'Upload failed' } }),
      );

      service.uploadTeamLogo('team-123', mockFile).subscribe({
        next: () => fail('Should have thrown an error'),
        error: error => {
          expect(error.message).toContain('Upload failed');
          done();
        },
      });
    });
  });

  describe('updateTeamLogo', () => {
    it('should update team logo successfully', done => {
      service.updateTeamLogo('team-123', 'https://example.com/logo.png').subscribe({
        next: () => {
          expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
          done();
        },
        error: () => fail('Should not error'),
      });
    });

    it('should handle update error', done => {
      const updateSpy = mockSupabaseClient.from().update;
      updateSpy().eq.and.returnValue(
        Promise.resolve({ data: null, error: { message: 'Update failed' } }),
      );

      service.updateTeamLogo('team-123', 'https://example.com/logo.png').subscribe({
        next: () => fail('Should have thrown an error'),
        error: error => {
          expect(error.message).toContain('Update failed');
          done();
        },
      });
    });
  });

  describe('getUserTeam', () => {
    it('should get user team successfully', done => {
      service.getUserTeam().subscribe({
        next: team => {
          expect(team).toEqual(mockTeam);
          expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
          expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
          done();
        },
        error: () => fail('Should not error'),
      });
    });

    it('should return null when no team found', done => {
      const selectSpy = mockSupabaseClient.from().select;
      selectSpy()
        .eq()
        .single.and.returnValue(Promise.resolve({ data: null, error: { code: 'PGRST116' } }));

      service.getUserTeam().subscribe({
        next: team => {
          expect(team).toBeNull();
          done();
        },
        error: () => fail('Should not error'),
      });
    });

    it('should handle unauthenticated user', done => {
      mockSupabaseClient.auth.getUser.and.returnValue(
        Promise.resolve({ data: { user: null }, error: null }),
      );

      service.getUserTeam().subscribe({
        next: team => {
          expect(team).toBeNull();
          done();
        },
        error: () => fail('Should not error'),
      });
    });
  });

  describe('getTeamById', () => {
    it('should get team by ID successfully', done => {
      service.getTeamById('team-123').subscribe({
        next: team => {
          expect(team).toEqual(mockTeam);
          expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
          done();
        },
        error: () => fail('Should not error'),
      });
    });

    it('should return null when team not found', done => {
      const selectSpy = mockSupabaseClient.from().select;
      selectSpy()
        .eq()
        .single.and.returnValue(Promise.resolve({ data: null, error: { message: 'Not found' } }));

      service.getTeamById('team-123').subscribe({
        next: team => {
          expect(team).toBeNull();
          done();
        },
        error: () => fail('Should not error'),
      });
    });
  });
});
