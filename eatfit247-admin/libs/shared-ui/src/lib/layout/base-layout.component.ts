/**
 * Base Layout Component
 *
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * Base layout with toolbar, sidenav, and main container for all components
 */
import { Component, computed, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, NavigationService, ThemeService } from '@core';
import { IAuthUser } from '@eatfit247-shared-lib';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'shared-ui-base-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    BreadcrumbComponent,
  ],
  templateUrl: './base-layout.component.html',
  styleUrl: './base-layout.component.scss',
})
export class BaseLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatSidenav;

  currentUser: IAuthUser | null = null;
  isAuthenticated = false;

  readonly isMobile = signal(false);

  readonly sidenavMode = computed(() => (this.isMobile() ? 'over' : 'side'));
  readonly sidenavOpened = computed(() => !this.isMobile());

  expandedMenus: Set<string> = new Set();

  private readonly navigationService = inject(NavigationService);
  readonly navSections = this.navigationService.navSections;

  private userSubscription?: Subscription;
  private routerSubscription?: Subscription;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe((result) => {
        this.isMobile.set(result.matches);
      });

    this.routerSubscription = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile() && this.drawer?.opened) {
          this.drawer.close();
        }
      });

    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isAuthenticated = this.authService.isAuthenticated();
    });

    if (this.authService.isAuthenticated()) {
      this.loadUserProfile();
    }
  }

  private async loadUserProfile(): Promise<void> {
    try {
      await this.authService.getProfile();
    } catch {
      this.currentUser = this.authService.getCurrentUser();
      this.isAuthenticated = !!this.currentUser;
    }
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  toggleMenu(menuLabel: string): void {
    if (this.expandedMenus.has(menuLabel)) {
      this.expandedMenus.delete(menuLabel);
    } else {
      this.expandedMenus.add(menuLabel);
    }
  }

  isMenuExpanded(menuLabel: string): boolean {
    return this.expandedMenus.has(menuLabel);
  }

  getUserDisplayName(): string {
    if (!this.currentUser) {
      return '';
    }
    if (this.currentUser.firstName || this.currentUser.lastName) {
      return (
        [this.currentUser.firstName, this.currentUser.lastName]
          .filter(Boolean)
          .join(' ') || this.currentUser.emailId
      );
    }
    return this.currentUser.emailId;
  }

  getUserInitials(): string {
    const name = this.getUserDisplayName();
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  async onLogout(): Promise<void> {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  onSetting(): void {
    this.router.navigate(['/setting']);
  }

  onResetPassword(): void {
    this.router.navigate(['/change-password']);
  }
}
