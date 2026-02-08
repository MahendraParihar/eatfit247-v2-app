/**
 * Breadcrumb Service
 * 
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * Service to build breadcrumbs from the current route
 */
import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';
import { BreadcrumbItem } from '../interfaces/breadcrumb-item';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly breadcrumbsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  public readonly breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  constructor() {
    // Subscribe to route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const breadcrumbs = this.buildBreadcrumbs(this.router.routerState.root);
        this.breadcrumbsSubject.next(breadcrumbs);
      });

    // Build initial breadcrumbs
    const breadcrumbs = this.buildBreadcrumbs(this.router.routerState.root);
    this.breadcrumbsSubject.next(breadcrumbs);
  }

  /**
   * Build breadcrumbs from the route tree
   */
  private buildBreadcrumbs(
    route: ActivatedRoute,
    url = '',
    breadcrumbs: BreadcrumbItem[] = []
  ): BreadcrumbItem[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      // Safely check if snapshot and url exist before accessing
      if (!child?.snapshot) {
        continue;
      }

      const urlSegments = child.snapshot.url;
      const routeURL: string = urlSegments && Array.isArray(urlSegments) && urlSegments.length > 0
        ? urlSegments.map((segment) => segment.path).join('/')
        : '';

      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      // Get route title from data, routeConfig title, or format from path
      const routeTitle = 
        child.snapshot.data?.['title'] || 
        child.snapshot.routeConfig?.title ||
        (routeURL ? this.formatLabel(routeURL) : null);

      // Skip if no title or empty route
      if (routeTitle && url && routeTitle !== 'Home') {
        breadcrumbs.push({
          title: routeTitle,
          path: url,
        });
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  /**
   * Format label from route path or title
   */
  private formatLabel(label: string): string {
    if (!label) {
      return 'Home';
    }

    // Convert kebab-case to Title Case
    return label
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/\//g, ' / ')
      .trim();
  }

  /**
   * Manually set breadcrumbs (useful for dynamic routes)
   */
  setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void {
    this.breadcrumbsSubject.next(breadcrumbs);
  }
}

