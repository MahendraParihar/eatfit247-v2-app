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
import { AuthService, ThemeService } from '@core';
import { IAuthUser } from '@eatfit247-shared-lib';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

interface NavSection {
  label: string;
  items: MenuItem[];
}

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

  readonly navSections: NavSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
      ],
    },
    {
      label: 'Content',
      items: [
        { label: 'Blogs', icon: 'article', route: '/blogs' },
        { label: 'FAQ', icon: 'help', route: '/faq' },
        { label: 'Recipes', icon: 'restaurant', route: '/recipes' },
        { label: 'Pocket Guide', icon: 'menu_book', route: '/pocket-guide' },
        { label: 'Media & Press', icon: 'perm_media', route: '/media-press' },
        { label: 'Banners', icon: 'image', route: '/banners' },
        { label: 'Success Stories', icon: 'emoji_events', route: '/success-stories' },
        { label: 'Legal Pages', icon: 'gavel', route: '/legal-pages' },
        { label: 'SEO Pages', icon: 'search', route: '/seo-page' },
      ],
    },
    {
      label: 'Commerce',
      items: [
        { label: 'Members', icon: 'people', route: '/members' },
        { label: 'Programs', icon: 'fitness_center', route: '/programs' },
        { label: 'Program Plans', icon: 'payment', route: '/program-plans' },
        { label: 'Products', icon: 'inventory', route: '/products' },
        { label: 'Promo Codes', icon: 'local_offer', route: '/promo-code' },
        { label: 'Tax Master', icon: 'account_balance', route: '/tax-master' },
        { label: 'Diet Template', icon: 'restaurant_menu', route: '/diet-template' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { label: 'Call Logs', icon: 'phone', route: '/call-logs' },
        { label: 'Referrer', icon: 'person_add', route: '/referrer' },
        { label: 'Franchise', icon: 'business', route: '/franchise' },
        {
          label: 'Reports',
          icon: 'assessment',
          children: [
            { label: 'Payment Report', icon: 'payment', route: '/reports/payment' },
            { label: 'Contact Form Report', icon: 'contact_mail', route: '/reports/contact-form' },
            { label: 'Member Product Report', icon: 'inventory', route: '/reports/member-product' },
            { label: 'Member Issues Report', icon: 'report_problem', route: '/reports/member-issues' },
          ],
        },
        {
          label: 'Delivery',
          icon: 'local_shipping',
          children: [
            { label: 'Courier Providers', icon: 'business', route: '/delivery/courier-providers' },
            { label: 'Courier Provider Accounts', icon: 'account_circle', route: '/delivery/courier-provider-accounts' },
            { label: 'Warehouses', icon: 'warehouse', route: '/delivery/warehouses' },
            { label: 'Courier Provider Warehouse Mapping', icon: 'local_shipping', route: '/delivery/courier-provider-warehouses' },
          ],
        },
      ],
    },
    {
      label: 'System',
      items: [
        { label: 'Admin Users', icon: 'admin_panel_settings', route: '/admin-user' },
        {
          label: 'LOV Master',
          icon: 'list',
          children: [
            { label: 'Gender', icon: 'person', route: '/lov-master/gender' },
            { label: 'Blood Sugar', icon: 'bloodtype', route: '/lov-master/blood-sugar' },
            { label: 'Health Issue', icon: 'health_and_safety', route: '/lov-master/health-issue' },
            { label: 'Eating Habit', icon: 'restaurant_menu', route: '/lov-master/eating-habit' },
            { label: 'Lifestyle', icon: 'self_improvement', route: '/lov-master/lifestyle' },
            { label: 'Marital Status', icon: 'favorite', route: '/lov-master/marital-status' },
            { label: 'Religion', icon: 'church', route: '/lov-master/religion' },
            { label: 'Sleeping Pattern', icon: 'bedtime', route: '/lov-master/sleeping-pattern' },
            { label: 'Type of Exercise', icon: 'fitness_center', route: '/lov-master/type-of-exercise' },
            { label: 'Urine Output', icon: 'water_drop', route: '/lov-master/urine-output' },
            { label: 'Health Parameter', icon: 'monitor_heart', route: '/lov-master/health-parameter' },
            { label: 'Health Parameter Unit', icon: 'straighten', route: '/lov-master/health-parameter-unit' },
            { label: 'Call Purpose', icon: 'phone_callback', route: '/lov-master/call-purpose' },
            { label: 'Call Log Status', icon: 'phone_in_talk', route: '/lov-master/call-log-status' },
            { label: 'Call Type', icon: 'call', route: '/lov-master/call-type' },
            { label: 'Blog Author', icon: 'person', route: '/lov-master/blog-author' },
            { label: 'Blog Category', icon: 'category', route: '/lov-master/blog-category' },
            { label: 'Blog Comments', icon: 'comment', route: '/lov-master/blog-comments' },
            { label: 'FAQ Category', icon: 'help_outline', route: '/lov-master/faq-category' },
            { label: 'Issue Category', icon: 'category', route: '/lov-master/issue-category' },
            { label: 'Issue Status', icon: 'flag', route: '/lov-master/issue-status' },
            { label: 'Program Category', icon: 'category', route: '/lov-master/program-category' },
            { label: 'Recipe Category', icon: 'category', route: '/lov-master/recipe-category' },
            { label: 'Recipe Cuisine', icon: 'restaurant', route: '/lov-master/recipe-cuisine' },
            { label: 'Recipe Type', icon: 'restaurant_menu', route: '/lov-master/recipe-type' },
            { label: 'Country', icon: 'public', route: '/lov-master/country' },
            { label: 'State', icon: 'map', route: '/lov-master/state' },
          ],
        },
      ],
    },
  ];

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
