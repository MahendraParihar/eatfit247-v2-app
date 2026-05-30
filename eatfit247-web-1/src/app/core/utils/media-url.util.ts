export function buildMediaUrl(webUrl: string | undefined | null): string {
  if (!webUrl) {
    return '';
  }
  // If already a full URL, return as-is
  if (webUrl.startsWith('http://') || webUrl.startsWith('https://')) {
    return webUrl;
  }
  // Normalize path - remove leading slash if present
  const normalizedPath = webUrl.startsWith('/') ? webUrl.substring(1) : webUrl;
  // Encode each path segment so filenames containing '#', '?', spaces, or
  // unicode (e.g. emojis) don't break the URL when used as a src.
  return normalizedPath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

