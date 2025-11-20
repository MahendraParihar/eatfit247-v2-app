/**
 * Validation Utilities
 * Common validation functions shared across applications
 */
export declare class ValidationUtil {
    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean;
    /**
     * Validate phone number (Indian format)
     */
    static isValidPhone(phone: string): boolean;
    /**
     * Validate password strength
     * Minimum 8 characters, at least one letter and one number
     */
    static isValidPassword(password: string): boolean;
    /**
     * Validate PAN card number (Indian)
     */
    static isValidPAN(pan: string): boolean;
    /**
     * Validate GST number (Indian)
     */
    static isValidGST(gst: string): boolean;
    /**
     * Validate Aadhar number (Indian)
     */
    static isValidAadhar(aadhar: string): boolean;
    /**
     * Check if string is empty or whitespace
     */
    static isEmpty(value: string | null | undefined): boolean;
    /**
     * Check if value is numeric
     */
    static isNumeric(value: string): boolean;
}
//# sourceMappingURL=validation.util.d.ts.map