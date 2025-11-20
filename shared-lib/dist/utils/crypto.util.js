/**
 * Crypto Utilities
 * Simple encryption/decryption functions for frontend use
 * Note: Use crypto-js for more secure implementations
 */
export class CryptoUtil {
    /**
     * Base64 encode
     */
    static encode(str) {
        try {
            return btoa(encodeURIComponent(str));
        }
        catch (e) {
            console.error('Encoding error:', e);
            return str;
        }
    }
    /**
     * Base64 decode
     */
    static decode(str) {
        try {
            return decodeURIComponent(atob(str));
        }
        catch (e) {
            console.error('Decoding error:', e);
            return str;
        }
    }
    /**
     * Simple hash function (for client-side use only, not cryptographically secure)
     */
    static simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
    /**
     * Generate UUID v4
     */
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}
