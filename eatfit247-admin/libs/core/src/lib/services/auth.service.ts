/**
 * Auth Service
 *
 * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md (authoritative)
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 *
 * Authentication service implementing secure token management:
 * - Access Token: In-memory only (10-15 min expiry)
 * - Refresh Token: HttpOnly, Secure Cookie (7-14 days expiry)
 * - Token Rotation: Enabled (new refresh token on each refresh)
 * - Logout: Revokes refresh token on server
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { HttpService } from './http.service';
import { StorageService } from './storage.service';
import {
  IAuthUser,
  ILogin,
  IToken,
  IChangePassword,
  IForgotPasswordRequest,
  IResetPasswordRequest, IResponse
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends ApiBaseService {
  private currentUserSubject = new BehaviorSubject<IAuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly endpoint = '/auth';

  constructor(httpService: HttpService, private storage: StorageService) {
    super(httpService);
    // Load user from storage on init
    const user = this.storage.getUser();
    if (user) {
      this.currentUserSubject.next(user);
    }
    // Note: Token refresh on app init is handled by AuthGuard to avoid circular dependency
  }

  /**
   * Login - POST /auth/login
   * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md
   * Server sets refresh token as HttpOnly, Secure cookie
   * Server returns access token in response body
   */
  async signIn(credentials: ILogin): Promise<IToken> {
    try {
      // withCredentials is set automatically by AuthInterceptor
      const response = await this.httpService.post<IResponse<IToken>>(`${this.endpoint}/login`, credentials);
      const token = response.data as IToken;
      if (token.accessToken) {
        // Store access token in memory only (not localStorage)
        this.storage.setToken(token.accessToken);
        // Refresh token is automatically stored as HttpOnly cookie by server
        // Client cannot access it (security best practice)
        // Fetch user setting after successful login
        try {
          const user = await this.getProfile();
          this.storage.setUser(user);
          this.currentUserSubject.next(user);
        } catch {
          // If setting fetch fails, decode token as fallback
          const decoded = this.decodeToken(token.accessToken);
          if (decoded) {
            // Create minimal user object from token
            const user: IAuthUser = {
              adminId: decoded.adminUserId || decoded.adminId,
              emailId: decoded.emailId || ''
            };
            this.storage.setUser(user);
            this.currentUserSubject.next(user);
          }
        }
      }
      return token;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout - POST /auth/logout
   * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md
   * Server revokes refresh token in DB and clears cookie
   */
  async signOut(): Promise<void> {
    try {
      // withCredentials is set automatically by AuthInterceptor
      await this.httpService.post<void>(`${this.endpoint}/logout`, {});
      this.storage.clear();
      this.currentUserSubject.next(null);
    } catch {
      // Clear storage even if API call fails
      this.storage.clear();
      this.currentUserSubject.next(null);
      throw new Error('Sign out failed');
    }
  }

  /**
   * Refresh access token - POST /auth/refresh
   * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md
   * Token rotation: Server returns new refresh token on each refresh
   * Refresh token is automatically sent from HttpOnly cookie
   * CSRF protection: Server validates CSRF token from cookie
   */
  async refreshToken(): Promise<IToken> {
    // Refresh token is in HttpOnly cookie, sent automatically by browser
    // No need to pass it in request body
    // withCredentials is set automatically by AuthInterceptor
    const response = await this.httpService.post<IResponse<IToken>>(
      `${this.endpoint}/refresh`,
      {} // Empty body - refresh token comes from cookie
    );
    const token = response.data as IToken;
    if (token.accessToken) {
      // Store new access token in memory
      this.storage.setToken(token.accessToken);
      // New refresh token is automatically set as HttpOnly cookie by server (token rotation)
      // Client cannot access it (security best practice)
    }
    return token;
  }

  async getProfile(): Promise<IAuthUser> {
    // withCredentials is set automatically by AuthInterceptor
    const res = await this.httpService.get<IResponse<IAuthUser>>(`${this.endpoint}/profile`);
    const user = res.data as IAuthUser;
    this.storage.setUser(user);
    this.currentUserSubject.next(user);
    return user;
  }

  async forgotPassword(request: IForgotPasswordRequest): Promise<string> {
    // withCredentials is set automatically by AuthInterceptor
    const res = await this.httpService.post<IResponse<string>>(`${this.endpoint}/forgot-password`, request);
    return res.data as string;
  }

  async resetPassword(request: IResetPasswordRequest): Promise<boolean> {
    // withCredentials is set automatically by AuthInterceptor
    return (await this.httpService.post<IResponse<boolean>>(`${this.endpoint}/reset-password`, request)).data as boolean;
  }

  async changePassword(request: IChangePassword): Promise<void> {
    // withCredentials is set automatically by AuthInterceptor
    return await this.httpService.post<void>(`${this.endpoint}/change-password`, request);
  }

  logout(): void {
    this.storage.clear();
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.storage.getToken();
  }

  getCurrentUser(): IAuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get access token from storage
   */
  getToken(): string | null {
    return this.storage.getToken();
  }

  /**
   * Set access token in storage
   */
  setToken(token: string): void {
    this.storage.setToken(token);
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }
}

