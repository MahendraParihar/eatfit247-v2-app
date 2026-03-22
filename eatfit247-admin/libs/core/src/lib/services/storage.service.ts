/**
 * Storage Service
 * 
 * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md (authoritative)
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * 
 * Secure token storage:
 * - Access Token: In-memory only (not localStorage) - 10-15 min expiry
 * - Refresh Token: HttpOnly, Secure Cookie (server-side, not accessible to JS) - 7-14 days expiry
 * - User Data: localStorage (non-sensitive)
 * 
 * Security Rules:
 * - ❌ No access token in localStorage
 * - ❌ No refresh token in JS
 * - ✅ Always use HttpOnly cookies for refresh tokens
 */
import { Injectable } from '@angular/core';
import { IAuthUser } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly USER_KEY = 'user_data';
  
  // In-memory access token storage (not localStorage for security)
  private accessToken: string | null = null;

  /**
   * Set access token in memory
   * Access tokens are stored in memory only, not in localStorage
   */
  setToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get access token from memory
   */
  getToken(): string | null {
    return this.accessToken;
  }

  /**
   * Remove access token from memory
   */
  removeToken(): void {
    this.accessToken = null;
  }

  /**
   * Refresh token is stored in HttpOnly, Secure cookie by the server
   * Client cannot access it directly (security best practice)
   * This method is kept for backward compatibility but does nothing
   * @deprecated Refresh token is now in HttpOnly cookie, not accessible to client
   */
  setRefreshToken(token: string): void {
    // Refresh token is set by server as HttpOnly cookie
    // Client cannot and should not store it
  }

  /**
   * Refresh token is in HttpOnly cookie, not accessible to client
   * @deprecated Refresh token is now in HttpOnly cookie, not accessible to client
   */
  getRefreshToken(): string | null {
    // Refresh token is in HttpOnly cookie, sent automatically by browser
    // Client cannot read it (security best practice)
    return null;
  }

  /**
   * Refresh token removal is handled by server on logout
   * @deprecated Refresh token is now in HttpOnly cookie, server handles removal
   */
  removeRefreshToken(): void {
    // Refresh token is in HttpOnly cookie, server handles removal
  }

  /**
   * Set user data in localStorage
   * User data is non-sensitive and can be stored in localStorage
   */
  setUser(user: IAuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Get user data from localStorage
   */
  getUser(): IAuthUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<IAuthUser>;
      if (parsed.adminId == null || !parsed.emailId) return null;
      return {
        ...parsed,
        adminId: parsed.adminId,
        emailId: parsed.emailId,
        roleKeys: parsed.roleKeys ?? [],
        franchiseIds: parsed.franchiseIds ?? [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Remove user data from localStorage
   */
  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Clear all stored data
   * Note: Refresh token cookie is cleared by server on logout
   */
  clear(): void {
    this.accessToken = null;
    localStorage.removeItem(this.USER_KEY);
  }
}

