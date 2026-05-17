/**
 * Token Refresh Service
 *
 * Serializes concurrent token refresh requests.
 * When multiple requests receive 401 simultaneously, only the first
 * triggers an actual refresh call — subsequent callers share the
 * same in-flight promise and receive the same new token.
 */
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TokenRefreshService {
  private readonly auth = inject(AuthService);
  private refreshPromise: Promise<string> | null = null;

  /**
   * Returns a fresh access token. If a refresh is already in progress,
   * returns the same promise so only one refresh HTTP call is made.
   */
  ensureFreshToken(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.auth
        .refreshToken()
        .then((token) => {
          this.auth.setToken(token.accessToken);
          return token.accessToken;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }
}
