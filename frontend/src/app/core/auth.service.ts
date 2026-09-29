import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';

import { TokenPair } from './models';

const TOKEN_KEY = 'campusiq.access';

/** Obtains a JWT from the backend and holds the access token for the interceptor. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly token = signal<string | null>(readStoredToken());

  readonly isLoggedIn = computed(() => this.token() !== null);

  accessToken(): string | null {
    return this.token();
  }

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

  logout(): void {
    this.token.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing stored to clear.
    }
  }
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
