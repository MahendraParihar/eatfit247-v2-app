/**
 * Saves a downloaded Blob in the browser. Admin keeps the access token in memory, so
 * protected files are fetched over XHR (as a Blob) instead of through a plain <a href>.
 */
export function saveBlobAsFile(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/** Snackbar text for a failed protected download (HttpService errors carry status + server message). */
export function downloadErrorMessage(error: unknown, what: string): string {
  const { status, message } = (error ?? {}) as { status?: number; message?: string };
  if (status === 403) {
    return `You don't have access to download this ${what}.`;
  }
  if (status === 404 && message) {
    return message;
  }
  return `Could not download the ${what}. Please try again.`;
}
