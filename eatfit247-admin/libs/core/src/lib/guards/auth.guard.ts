/**
 * Auth Guard
 * 
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * Protects routes and redirects unauthenticated users to login
 */

import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // If not authenticated but user data exists (page refresh scenario),
    // try to refresh token using refresh token cookie
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      try {
        // Attempt to refresh token - refresh token is in HttpOnly cookie
        await this.authService.refreshToken();
        // If refresh succeeds, user is authenticated
        if (this.authService.isAuthenticated()) {
          return true;
        }
      } catch (error) {
        // Token refresh failed - user needs to login again
        console.warn('Token refresh failed in AuthGuard:', error);
        this.authService.logout();
      }
    }

    // Redirect to login page with return URL
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

