import { Component, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

/**
 * Header Component
 * Provides the header toolbar with navigation, search, and region selector
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Output() menuToggle = new EventEmitter<void>();

  private readonly breakpointObserver = new BreakpointObserver([
    Breakpoints.Handset,
    Breakpoints.Tablet,
  ]);

  // Responsive breakpoint
  readonly isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(
      map((result) => result.matches)
    ),
    { initialValue: false }
  );

  // Desktop breakpoint (for showing menu items in toolbar)
  readonly isDesktop = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(
      map((result) => !result.matches)
    ),
    { initialValue: true }
  );

  // Search state
  readonly searchExpanded = signal(false);
  searchQuery = '';

  // Navigation items with nested support
  readonly navItems = signal([
    {
      label: 'Home',
      url: '/',
      exact: true,
    },
    {
      label: 'About Us',
      url: '/',
      children: [
        {
          label: 'About EatFit',
          url: '/about-us',
        },
        {
          label: 'About Shweta Shah',
          url: '/about-shweta-shah',
        },
      ],
    },
    {
      label: 'Our Programs',
      url: '/our-programs',
    },
    {
      label: 'Quiz',
      url: '/',
      children: [
        {
          label: 'Do you know your body dosha?',
          url: '/know-your-body-dosha',
        },
        {
          label: 'Know your current immunity score',
          url: '/know-your-current-immunity-score',
        },
      ],
    },
    {
      label: 'Press & Media',
      url: '/press-and-media',
    },
    {
      label: 'Success Stories',
      url: '/success-stories',
    },
    {
      label: 'Blog',
      url: '/blog',
    },
    {
      label: 'Contact Us',
      url: '/contact-us',
    },
  ]);

  // Region selection
  readonly selectedRegion = signal<string>('IN');
  readonly regions = [
    { code: 'IN', label: 'IN' },
    { code: 'UAE', label: 'UAE' },
    { code: 'USA', label: 'USA' },
  ];

  // Timeout references for hover delays
  private aboutMenuTimeout: any = null;
  private quizMenuTimeout: any = null;

  /**
   * Toggle search field expansion
   */
  toggleSearch(): void {
    this.searchExpanded.update((expanded) => !expanded);
    if (this.searchExpanded()) {
      setTimeout(() => {
        const input = document.querySelector('.search-input') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }

  /**
   * Close search field
   */
  closeSearch(): void {
    this.searchExpanded.set(false);
    this.searchQuery = '';
  }

  /**
   * Handle search input blur - close if empty
   */
  onSearchBlur(): void {
    if (!this.searchQuery.trim()) {
      this.closeSearch();
    }
  }

  /**
   * Handle global search
   */
  onSearch(query: string): void {
    this.searchQuery = query;
    // TODO: Implement global search functionality
    console.log('Search query:', query);
  }

  /**
   * Check if item has children
   */
  hasChildren(item: any): boolean {
    return item.children && item.children.length > 0;
  }

  /**
   * Open About Us menu on hover
   */
  openAboutMenu(trigger: MatMenuTrigger): void {
    if (this.aboutMenuTimeout) {
      clearTimeout(this.aboutMenuTimeout);
      this.aboutMenuTimeout = null;
    }
    if (!trigger.menuOpen) {
      trigger.openMenu();
    }
  }

  /**
   * Handle About Us menu opened event - attach hover to panel and items
   */
  onAboutMenuOpened(): void {
    setTimeout(() => {
      const overlay = document.querySelector('.cdk-overlay-container');
      if (overlay) {
        const panel = overlay.querySelector('.mat-mdc-menu-panel') as HTMLElement;
        if (panel) {
          const panelMouseEnter = () => {
            this.cancelCloseAboutMenu();
          };
          panel.addEventListener('mouseenter', panelMouseEnter);
          
          const menuItems = panel.querySelectorAll('a[mat-menu-item]');
          menuItems.forEach((item: Element) => {
            const itemElement = item as HTMLElement;
            itemElement.addEventListener('mouseenter', () => {
              this.cancelCloseAboutMenu();
            });
            itemElement.addEventListener('mouseleave', () => {
              this.cancelCloseAboutMenu();
            });
          });
        }
      }
    }, 100);
  }

  /**
   * Close About Us menu with delay
   */
  closeAboutMenu(trigger: MatMenuTrigger): void {
    if (this.aboutMenuTimeout) {
      clearTimeout(this.aboutMenuTimeout);
    }
    this.aboutMenuTimeout = setTimeout(() => {
      if (trigger.menuOpen) {
        trigger.closeMenu();
      }
      this.aboutMenuTimeout = null;
    }, 800);
  }

  /**
   * Cancel About Us menu close
   */
  cancelCloseAboutMenu(): void {
    if (this.aboutMenuTimeout) {
      clearTimeout(this.aboutMenuTimeout);
      this.aboutMenuTimeout = null;
    }
  }

  /**
   * Open Quiz menu on hover
   */
  openQuizMenu(trigger: MatMenuTrigger): void {
    if (this.quizMenuTimeout) {
      clearTimeout(this.quizMenuTimeout);
      this.quizMenuTimeout = null;
    }
    if (!trigger.menuOpen) {
      trigger.openMenu();
    }
  }

  /**
   * Handle Quiz menu opened event - attach hover to panel and items
   */
  onQuizMenuOpened(): void {
    setTimeout(() => {
      const overlay = document.querySelector('.cdk-overlay-container');
      if (overlay) {
        const panel = overlay.querySelector('.mat-mdc-menu-panel') as HTMLElement;
        if (panel) {
          const panelMouseEnter = () => {
            this.cancelCloseQuizMenu();
          };
          panel.addEventListener('mouseenter', panelMouseEnter);
          
          const menuItems = panel.querySelectorAll('a[mat-menu-item]');
          menuItems.forEach((item: Element) => {
            const itemElement = item as HTMLElement;
            itemElement.addEventListener('mouseenter', () => {
              this.cancelCloseQuizMenu();
            });
            itemElement.addEventListener('mouseleave', () => {
              this.cancelCloseQuizMenu();
            });
          });
        }
      }
    }, 100);
  }

  /**
   * Close Quiz menu with delay
   */
  closeQuizMenu(trigger: MatMenuTrigger): void {
    if (this.quizMenuTimeout) {
      clearTimeout(this.quizMenuTimeout);
    }
    this.quizMenuTimeout = setTimeout(() => {
      if (trigger.menuOpen) {
        trigger.closeMenu();
      }
      this.quizMenuTimeout = null;
    }, 800);
  }

  /**
   * Cancel Quiz menu close
   */
  cancelCloseQuizMenu(): void {
    if (this.quizMenuTimeout) {
      clearTimeout(this.quizMenuTimeout);
      this.quizMenuTimeout = null;
    }
  }

  /**
   * Handle region change
   */
  onRegionChange(regionCode: string): void {
    this.selectedRegion.set(regionCode);
    // TODO: Implement region change logic (e.g., update API endpoints, locale, etc.)
    console.log('Region changed to:', regionCode);
  }

  /**
   * Get current region label
   */
  getCurrentRegionLabel(): string {
    const region = this.regions.find((r) => r.code === this.selectedRegion());
    return region?.label || 'India';
  }

  /**
   * Emit menu toggle event
   */
  onMenuToggle(): void {
    this.menuToggle.emit();
  }
}

