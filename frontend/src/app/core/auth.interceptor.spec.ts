import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  function signIn(): void {
    TestBed.inject(AuthService).login('alice', 'pw').subscribe();
    backend.expectOne('/api/token/').flush({ access: 'abc', refresh: 'r' });
  }

  it('attaches the bearer token to API requests after login', () => {
    signIn();
    http.get('/api/courses/').subscribe();
    expect(backend.expectOne('/api/courses/').request.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('never sends the token to non-API URLs', () => {
    signIn();
    http.get('https://example.com/x').subscribe();
    expect(backend.expectOne('https://example.com/x').request.headers.has('Authorization')).toBe(false);
  });

  it('logs out and redirects to /login when the API returns 401', () => {
    signIn();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    http.get('/api/courses/').subscribe({ error: () => {} });
    backend.expectOne('/api/courses/').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
