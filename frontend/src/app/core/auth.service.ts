import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';

import { TokenPair } from './models';

const TOKEN_KEY = 'campusiq.access';

/**
 * Obtains a JWT from the backend and holds the access token for the interceptor.
 * A single app-wide instance (providedIn: 'root'), so every part of the app sees the same session.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  // Seeded from localStorage so a page reload keeps the user signed in.
  private readonly token = signal<string | null>(readStoredToken());

  /** True while a token is held. A signal, so the header and guard update on login/logout. */
  readonly isLoggedIn = computed(() => this.token() !== null);

  /** The current access token, or null when signed out. Read by the interceptor on each request. */
  accessToken(): string | null {
    return this.token();
  }

  /**
   * Exchanges username/password for a token pair at POST /api/token/ and stores the access token.
   * Errors (e.g. 401 for bad credentials) are passed through for the caller to display.
   */
  login(username: string, password: string): Observable<void> {
    return this.http.post<TokenPair>('/api/token/', { username, password }).pipe(
      map(({ access }) => {
        // Only the access token is kept: refresh is deferred (see docs/DECISIONS.md).
        this.token.set(access);
        try {
          localStorage.setItem(TOKEN_KEY, access);
        } catch {
          // Storage unavailable (e.g. private mode): the session just won't survive a reload.
        }
      }),
    );
  }

  /** Forgets the token in memory and in storage. Navigation is left to the caller. */
  logout(): void {
    this.token.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing stored to clear.
    }
  }
}

/** Reads the saved token at startup; null if there is none or storage is blocked. */
function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
