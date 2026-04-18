/**
 * Crypto Utilities
 * Base64 encoding/decoding and hashing functions.
 * WARNING: encode/toBase64 and decode/fromBase64 are NOT encryption —
 * they only perform Base64 encoding. Do NOT use them to protect sensitive data.
 */

export class CryptoUtil {
  /**
   * Base64 encode (NOT encryption — use only for data serialization, not security).
   * Works in both browser (btoa) and Node.js (Buffer) environments.
   */
  static encode(str: string): string {
    try {
      if (typeof btoa !== 'undefined') {
        // Browser environment
        return btoa(encodeURIComponent(str));
      } else {
        // Node.js environment
        return Buffer.from(str, 'utf8').toString('base64');
      }
    } catch (e) {
      console.error('Encoding error:', e);
      return str;
    }
  }

  /** Alias for encode() */
  static toBase64(str: string): string {
    return CryptoUtil.encode(str);
  }

  /**
   * Base64 decode (NOT decryption — use only for data deserialization, not security).
   * Works in both browser (atob) and Node.js (Buffer) environments.
   */
  static decode(str: string): string {
    try {
      if (typeof atob !== 'undefined') {
        // Browser environment
        return decodeURIComponent(atob(str));
      } else {
        // Node.js environment
        return Buffer.from(str, 'base64').toString('utf8');
      }
    } catch (e) {
      console.error('Decoding error:', e);
      return str;
    }
  }

  /** Alias for decode() */
  static fromBase64(str: string): string {
    return CryptoUtil.decode(str);
  }

  /**
   * Hash a string using SHA-256.
   * In Node.js uses crypto module; in browser falls back to a simple djb2 hash.
   */
  static simpleHash(str: string): string {
    if (typeof globalThis !== 'undefined' && typeof require === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(str).digest('hex');
      } catch {
        // Fall through to browser fallback
      }
    }
    // Browser fallback (non-cryptographic, for display/caching purposes only)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Generate UUID v4 using cryptographically secure random source.
   */
  static generateUUID(): string {
    // Use native crypto.randomUUID when available (Node 19+, modern browsers)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback using crypto.getRandomValues (older browsers)
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    // Last resort fallback (should not happen in modern environments)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

