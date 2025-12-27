/**
 * Base Layout Component
 *
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * Base layout with toolbar, sidenav, and main container for all components
 */
import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core';
import { IAuthUser } from '@eatfit247-shared-lib';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
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
  ],
  templateUrl: './base-layout.component.html',
  styleUrl: './base-layout.component.scss',
})
export class BaseLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatSidenav;
  currentUser: IAuthUser | null = null;
  isAuthenticated = false;
  private userSubscription?: Subscription;
  // Track expanded state for nested menus
  expandedMenus: Set<string> = new Set();
  // Menu items configuration
  menuItems: MenuItem[] = [
    {
      label: 'Members',
      icon: 'people',
      route: '/members',
    },
    {
      label: 'Blogs',
      icon: 'article',
      route: '/blogs',
    },
    {
      label: 'FAQ',
      icon: 'help',
      route: '/faq',
    },
    {
      label: 'Recipes',
      icon: 'restaurant',
      route: '/recipes',
    },
    {
      label: 'Programs',
      icon: 'fitness_center',
      route: '/programs',
    },
    {
      label: 'Program Plans',
      icon: 'payment',
      route: '/program-plans',
    },
    {
      label: 'Media & Press',
      icon: 'perm_media',
      route: '/media-press',
    },
    {
      label: 'Referrer',
      icon: 'person_add',
      route: '/referrer',
    },
    {
      label: 'Franchise',
      icon: 'business',
      route: '/franchise',
    },
    {
      label: 'Pocket Guide',
      icon: 'menu_book',
      route: '/pocket-guide',
    },
    {
      label: 'Diet Template',
      icon: 'restaurant_menu',
      route: '/diet-template',
    },
    {
      label: 'Call Logs',
      icon: 'phone',
      route: '/call-logs',
    },
    {
      label: 'Issues',
      icon: 'report_problem',
      route: '/issues',
    },
    {
      label: 'Admin Users',
      icon: 'admin_panel_settings',
      route: '/admin-user',
    },
    {
      label: 'LOV Master',
      icon: 'list',
      children: [
        // Assessment Master items
        {
          label: 'Gender',
          icon: 'person',
          route: '/lov-master/gender',
        },
        {
          label: 'Blood Sugar',
          icon: 'bloodtype',
          route: '/lov-master/blood-sugar',
        },
        {
          label: 'Health Issue',
          icon: 'health_and_safety',
          route: '/lov-master/health-issue',
        },
        {
          label: 'Eating Habit',
          icon: 'restaurant_menu',
          route: '/lov-master/eating-habit',
        },
        {
          label: 'Lifestyle',
          icon: 'self_improvement',
          route: '/lov-master/lifestyle',
        },
        {
          label: 'Marital Status',
          icon: 'favorite',
          route: '/lov-master/marital-status',
        },
        {
          label: 'Religion',
          icon: 'church',
          route: '/lov-master/religion',
        },
        {
          label: 'Sleeping Pattern',
          icon: 'bedtime',
          route: '/lov-master/sleeping-pattern',
        },
        {
          label: 'Type of Exercise',
          icon: 'fitness_center',
          route: '/lov-master/type-of-exercise',
        },
        {
          label: 'Urine Output',
          icon: 'water_drop',
          route: '/lov-master/urine-output',
        },
        {
          label: 'Health Parameter',
          icon: 'monitor_heart',
          route: '/lov-master/health-parameter',
        },
        {
          label: 'Health Parameter Unit',
          icon: 'straighten',
          route: '/lov-master/health-parameter-unit',
        },
        // Call Logs items
        {
          label: 'Call Purpose',
          icon: 'phone_callback',
          route: '/lov-master/call-purpose',
        },
        {
          label: 'Call Log Status',
          icon: 'phone_in_talk',
          route: '/lov-master/call-log-status',
        },
        {
          label: 'Call Type',
          icon: 'call',
          route: '/lov-master/call-type',
        },
        // Blog items
        {
          label: 'Blog Author',
          icon: 'person',
          route: '/lov-master/blog-author',
        },
        {
          label: 'Blog Category',
          icon: 'category',
          route: '/lov-master/blog-category',
        },
        {
          label: 'Blog Comments',
          icon: 'comment',
          route: '/lov-master/blog-comments',
        },
        // FAQ items
        {
          label: 'FAQ Category',
          icon: 'help_outline',
          route: '/lov-master/faq-category',
        },
        // Issue items
        {
          label: 'Issue Category',
          icon: 'category',
          route: '/lov-master/issue-category',
        },
        {
          label: 'Issue Status',
          icon: 'flag',
          route: '/lov-master/issue-status',
        },
        // Program items
        {
          label: 'Program Category',
          icon: 'category',
          route: '/lov-master/program-category',
        },
        // Recipe items
        {
          label: 'Recipe Category',
          icon: 'category',
          route: '/lov-master/recipe-category',
        },
        {
          label: 'Recipe Cuisine',
          icon: 'restaurant',
          route: '/lov-master/recipe-cuisine',
        },
        {
          label: 'Recipe Type',
          icon: 'restaurant_menu',
          route: '/lov-master/recipe-type',
        },
        // Location items
        {
          label: 'Country',
          icon: 'public',
          route: '/lov-master/country',
        },
        {
          label: 'State',
          icon: 'map',
          route: '/lov-master/state',
        },
        {
          label: 'Address Type',
          icon: 'location_on',
          route: '/lov-master/address-type',
        },
      ],
    },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Subscribe to auth state
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isAuthenticated = this.authService.isAuthenticated();
    });
    // Load current user if authenticated
    if (this.authService.isAuthenticated()) {
      this.loadUserProfile();
    }
  }

  private async loadUserProfile(): Promise<void> {
    try {
      await this.authService.getProfile();
    } catch {
      // If profile fetch fails, get from storage
      this.currentUser = this.authService.getCurrentUser();
      this.isAuthenticated = !!this.currentUser;
    }
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
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

  async onLogout(): Promise<void> {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch {
      // Force logout even if API call fails
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  onUpdateProfile(): void {
    this.router.navigate(['/profile']);
  }

  onResetPassword(): void {
    this.router.navigate(['/reset-password']);
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
}

