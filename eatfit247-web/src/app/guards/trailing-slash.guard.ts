import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

/**
 * Guard that redirects URLs with trailing slashes to their normalized version
 * (without trailing slash, except for root)
 * This ensures consistent URLs for SEO purposes
 * 
 * Note: This guard checks the browser's location directly to catch URLs
 * before they are normalized by the URL serializer
 */
export const trailingSlashGuard: CanActivateFn = (): boolean | UrlTree => {
  const router = inject(Router);
  
  // Get the original URL from browser location (before normalization)
  const originalUrl = window.location.pathname + window.location.search + window.location.hash;
  const path = window.location.pathname;

  // Don't modify root path
  if (path === '/' || path === '') {
    return true;
  }

  // Check if URL has trailing slash
  if (path.endsWith('/') && path.length > 1) {
    // Redirect to URL without trailing slash
    const normalizedPath = path.slice(0, -1);
    const queryAndFragment = originalUrl.substring(path.length);
    const normalizedUrl = normalizedPath + queryAndFragment;
    
    // Return UrlTree for redirect
    return router.createUrlTree([normalizedUrl]);
  }

  return true;
};

