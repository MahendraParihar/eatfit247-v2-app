import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

/**
 * Base Layout Component
 * Provides the main layout structure with header, sidebar, and content area
 */
@Component({
  selector: 'app-base-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatExpansionModule,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './base-layout.component.html',
  styleUrl: './base-layout.component.scss',
})
export class BaseLayoutComponent {
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

  // Component state
  readonly sidenavOpen = signal(false);
  readonly expandedItems = signal<Set<string>>(new Set());

  // Navigation items for mobile sidebar
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
      label: 'Products',
      url: '/product',
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

  /**
   * Toggle sidebar open/close state
   */
  toggleSidenav(): void {
    this.sidenavOpen.update((open) => !open);
  }

  /**
   * Close sidebar (useful for mobile)
   */
  closeSidenav(): void {
    this.sidenavOpen.set(false);
  }

  /**
   * Open sidebar
   */
  openSidenav(): void {
    this.sidenavOpen.set(true);
  }

  /**
   * Toggle expanded state for nested menu items
   */
  toggleExpanded(itemLabel: string): void {
    const expanded = new Set(this.expandedItems());
    if (expanded.has(itemLabel)) {
      expanded.delete(itemLabel);
    } else {
      expanded.add(itemLabel);
    }
    this.expandedItems.set(expanded);
  }

  /**
   * Check if item is expanded
   */
  isExpanded(itemLabel: string): boolean {
    return this.expandedItems().has(itemLabel);
  }

  /**
   * Check if item has children
   */
  hasChildren(item: any): boolean {
    return item.children && item.children.length > 0;
  }

  /**
   * Handle menu toggle from header
   */
  onMenuToggle(): void {
    this.toggleSidenav();
  }
}

