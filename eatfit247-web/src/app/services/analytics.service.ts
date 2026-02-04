import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

/**
 * Service to handle Google Analytics 4 (GA4) tracking
 * 
 * This service loads the GA4 script dynamically and provides
 * methods to track page views, events, and custom interactions.
 * Works with SSR by checking for browser platform.
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly trackingId = environment.googleAnalytics?.trackingId;
  private scriptLoaded = false;
  private scriptLoading = false;
  private router = inject(Router);

  /**
   * Initialize Google Analytics
   * Should be called once when the app starts
   */
  initialize(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip on server-side
    }

    if (!this.trackingId) {
      console.warn('Google Analytics tracking ID not configured');
      return;
    }

    // Load GA4 script
    this.loadScript().then(() => {
      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };

      // Configure GA4
      window.gtag('js', new Date());
      window.gtag('config', this.trackingId!, {
        send_page_view: false // We'll handle page views manually
      });

      // Track initial page view
      this.trackPageView(this.router.url);

      // Track subsequent route changes
      this.trackRouteChanges();
    });
  }

  /**
   * Load the Google Analytics script if not already loaded
   * @returns Promise that resolves when script is loaded
   */
  private loadScript(): Promise<void> {
    if (this.scriptLoaded) {
      return Promise.resolve();
    }

    if (this.scriptLoading) {
      // Wait for existing load to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.scriptLoaded) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    this.scriptLoading = true;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;
      script.onload = () => {
        this.scriptLoaded = true;
        this.scriptLoading = false;
        resolve();
      };
      script.onerror = () => {
        this.scriptLoading = false;
        reject(new Error('Failed to load Google Analytics script'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Track page view
   * @param url - The URL to track (defaults to current URL)
   * @param title - Optional page title
   */
  trackPageView(url?: string, title?: string): void {
    if (!isPlatformBrowser(this.platformId) || !this.scriptLoaded) {
      return;
    }

    const pagePath = url || window.location.pathname + window.location.search;
    const pageTitle = title || document.title;

    window.gtag('config', this.trackingId!, {
      page_path: pagePath,
      page_title: pageTitle
    });
  }

  /**
   * Track custom event
   * @param eventName - Name of the event
   * @param eventParams - Optional event parameters
   */
  trackEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (!isPlatformBrowser(this.platformId) || !this.scriptLoaded) {
      return;
    }

    window.gtag('event', eventName, eventParams || {});
  }

  /**
   * Track route changes automatically
   */
  private trackRouteChanges(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  /**
   * Track button click or user interaction
   * @param buttonName - Name/identifier of the button
   * @param location - Optional location context
   */
  trackButtonClick(buttonName: string, location?: string): void {
    this.trackEvent('button_click', {
      button_name: buttonName,
      location: location || window.location.pathname
    });
  }

  /**
   * Track form submission
   * @param formName - Name/identifier of the form
   * @param formStatus - Status of submission (success, error, etc.)
   */
  trackFormSubmission(formName: string, formStatus: 'success' | 'error' = 'success'): void {
    this.trackEvent('form_submit', {
      form_name: formName,
      form_status: formStatus
    });
  }

  /**
   * Track product view
   * @param productName - Name of the product
   * @param productId - Optional product ID
   */
  trackProductView(productName: string, productId?: string): void {
    this.trackEvent('view_item', {
      item_name: productName,
      item_id: productId
    });
  }

  /**
   * Track blog post view
   * @param postTitle - Title of the blog post
   * @param postId - Optional post ID
   */
  trackBlogView(postTitle: string, postId?: string): void {
    this.trackEvent('view_blog_post', {
      post_title: postTitle,
      post_id: postId
    });
  }
}

