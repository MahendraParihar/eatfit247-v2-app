/**
 * Login Guard
 * 
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * Redirects authenticated users away from login page to home
 */

import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class LoginGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      // Redirect authenticated users to home (members page)
      const returnUrl = route.queryParams['returnUrl'] || '/members';
      this.router.navigate([returnUrl]);
      return false;
    }
    return true;
  }
}

