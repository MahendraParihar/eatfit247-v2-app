import { DefaultUrlSerializer, UrlSerializer, UrlTree } from '@angular/router';

/**
 * Custom URL serializer that normalizes trailing slashes
 * Removes trailing slashes from all URLs except the root path
 */
export class TrailingSlashUrlSerializer implements UrlSerializer {
  private defaultSerializer: DefaultUrlSerializer = new DefaultUrlSerializer();

  parse(url: string): UrlTree {
    // Normalize trailing slashes: remove trailing slash except for root
    const normalizedUrl = this.normalizeTrailingSlash(url);
    return this.defaultSerializer.parse(normalizedUrl);
  }

  serialize(tree: UrlTree): string {
    // Normalize trailing slashes in serialized URL
    const serialized = this.defaultSerializer.serialize(tree);
    return this.normalizeTrailingSlash(serialized);
  }

  /**
   * Normalize trailing slashes in URL
   * - Keep trailing slash for root path '/'
   * - Remove trailing slash for all other paths
   */
  private normalizeTrailingSlash(url: string): string {
    // Don't modify root path
    if (url === '/' || url === '') {
      return url;
    }

    // Remove trailing slash, but preserve query params and fragments
    const urlParts = url.split('?');
    const path = urlParts[0];
    const queryAndFragment = urlParts.slice(1).join('?');

    // Remove trailing slash from path (except root)
    const normalizedPath = path.endsWith('/') && path.length > 1
      ? path.slice(0, -1)
      : path;

    // Reconstruct URL with query params and fragments
    return queryAndFragment
      ? `${normalizedPath}?${queryAndFragment}`
      : normalizedPath;
  }
}

