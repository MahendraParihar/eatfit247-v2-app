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
  return `${normalizedPath}`;
}

