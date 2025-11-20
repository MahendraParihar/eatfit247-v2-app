/**
 * Crypto Utilities
 * Simple encryption/decryption functions for frontend use
 * Note: Use crypto-js for more secure implementations
 */
export declare class CryptoUtil {
    /**
     * Base64 encode
     */
    static encode(str: string): string;
    /**
     * Base64 decode
     */
    static decode(str: string): string;
    /**
     * Simple hash function (for client-side use only, not cryptographically secure)
     */
    static simpleHash(str: string): string;
    /**
     * Generate UUID v4
     */
    static generateUUID(): string;
}
//# sourceMappingURL=crypto.util.d.ts.map