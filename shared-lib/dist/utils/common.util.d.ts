/**
 * Common Utility Functions
 * Shared across all EatFit247 applications
 */
export declare class CommonUtil {
    /**
     * Format date to DD/MM/YYYY
     */
    static formatDate(date: Date | string): string;
    /**
     * Format date to YYYY-MM-DD for API
     */
    static formatDateForAPI(date: Date | string): string;
    /**
     * Format number as Indian currency
     */
    static formatCurrency(amount: number): string;
    /**
     * Generate random string
     */
    static generateRandomString(length?: number): string;
    /**
     * Deep clone object
     */
    static deepClone<T>(obj: T): T;
    /**
     * Calculate age from date of birth
     */
    static calculateAge(dob: Date | string): number;
    /**
     * Get file extension from filename
     */
    static getFileExtension(filename: string): string;
    /**
     * Convert bytes to human readable format
     */
    static formatBytes(bytes: number, decimals?: number): string;
    /**
     * Capitalize first letter
     */
    static capitalizeFirst(str: string): string;
    /**
     * Sanitize string for URL
     */
    static slugify(str: string): string;
}
//# sourceMappingURL=common.util.d.ts.map