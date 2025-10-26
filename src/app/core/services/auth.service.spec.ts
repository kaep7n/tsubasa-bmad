import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Create mock Supabase client with auth methods
    mockSupabaseClient = {
      auth: {
        getSession: jasmine
          .createSpy('getSession')
          .and.returnValue(Promise.resolve({ data: { session: null }, error: null })),
        onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.returnValue({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        signUp: jasmine.createSpy('signUp'),
        signInWithPassword: jasmine.createSpy('signInWithPassword'),
        signInWithOAuth: jasmine.createSpy('signInWithOAuth'),
        signOut: jasmine.createSpy('signOut'),
      },
    };

    // Create mock SupabaseService
    mockSupabaseService = {
      client: mockSupabaseClient,
    } as any;

    // Create mock Router
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signUp', () => {
    it('should successfully sign up a user', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };

      const mockResponse = {
        data: {
          user: mockUser,
          session: {
            access_token: 'test-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Date.now() + 3600000,
            token_type: 'bearer',
            user: mockUser,
          },
        },
        error: null,
      };

      mockSupabaseClient.auth.signUp.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.signUp('test@example.com', 'password123');

      expect(result.error).toBeNull();
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error when signup fails', async () => {
      const mockError = {
        message: 'User already registered',
        status: 400,
      };

      const mockResponse = {
        data: { user: null, session: null },
        error: mockError,
      };

      mockSupabaseClient.auth.signUp.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.signUp('test@example.com', 'password123');

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('already exists');
      expect(result.user).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };

      const mockResponse = {
        data: {
          user: mockUser,
          session: {
            access_token: 'test-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Date.now() + 3600000,
            token_type: 'bearer',
            user: mockUser,
          },
        },
        error: null,
      };

      mockSupabaseClient.auth.signInWithPassword.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.signIn('test@example.com', 'password123');

      expect(result.error).toBeNull();
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error for invalid credentials', async () => {
      const mockError = {
        message: 'Invalid login credentials',
        status: 400,
      };

      const mockResponse = {
        data: { user: null, session: null },
        error: mockError,
      };

      mockSupabaseClient.auth.signInWithPassword.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.signIn('test@example.com', 'wrongpassword');

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid email or password');
      expect(result.user).toBeNull();
    });
  });

  describe('signInWithGoogle', () => {
    it('should initiate Google OAuth flow', async () => {
      const mockResponse = {
        data: { provider: 'google', url: 'https://accounts.google.com/oauth' },
        error: null,
      };

      mockSupabaseClient.auth.signInWithOAuth.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.signInWithGoogle();

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: jasmine.stringContaining('/auth/callback'),
        },
      });
    });

    it('should return error when OAuth fails', async () => {
      const mockError = {
        message: 'OAuth error',
        status: 500,
      };

      const mockResponse = {
        data: null,
        error: mockError,
      };

      mockSupabaseClient.auth.signInWithOAuth.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.signInWithGoogle();

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('OAuth error');
    });
  });

  describe('signOut', () => {
    it('should sign out user and redirect to login', async () => {
      mockSupabaseClient.auth.signOut.and.returnValue(Promise.resolve({ error: null }));

      await service.signOut();

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should redirect to login even if signOut fails', async () => {
      mockSupabaseClient.auth.signOut.and.returnValue(Promise.reject(new Error('Sign out failed')));

      await service.signOut();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getCurrentUser', () => {
    it('should return observable of current user', done => {
      service.getCurrentUser().subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });

    it('should emit user when authenticated', done => {
      const mockUser: User = {
        id: 'test-id',
        email: 'test@example.com',
        created_at: new Date(),
      };

      // Simulate user authentication by directly setting the subject
      (service as any).currentUserSubject.next(mockUser);

      service.getCurrentUser().subscribe(user => {
        expect(user).toBeDefined();
        expect(user?.email).toBe('test@example.com');
        done();
      });
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no user is authenticated', done => {
      service.isAuthenticated().subscribe(isAuth => {
        expect(isAuth).toBe(false);
        done();
      });
    });

    it('should return true when user is authenticated', done => {
      const mockUser: User = {
        id: 'test-id',
        email: 'test@example.com',
        created_at: new Date(),
      };

      (service as any).currentUserSubject.next(mockUser);

      service.isAuthenticated().subscribe(isAuth => {
        expect(isAuth).toBe(true);
        done();
      });
    });
  });
});
