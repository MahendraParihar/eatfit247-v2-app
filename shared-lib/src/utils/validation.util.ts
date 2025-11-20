/**
 * Validation Utilities
 * Common validation functions shared across applications
 */

export class ValidationUtil {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (Indian format)
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate password strength
   * Minimum 8 characters, at least one letter and one number
   */
  static isValidPassword(password: string): boolean {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  }

  /**
   * Validate PAN card number (Indian)
   */
  static isValidPAN(pan: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  }

  /**
   * Validate GST number (Indian)
   */
  static isValidGST(gst: string): boolean {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  }

  /**
   * Validate Aadhar number (Indian)
   */
  static isValidAadhar(aadhar: string): boolean {
    const aadharRegex = /^[2-9]{1}[0-9]{11}$/;
    return aadharRegex.test(aadhar.replace(/\s/g, ''));
  }

  /**
   * Check if string is empty or whitespace
   */
  static isEmpty(value: string | null | undefined): boolean {
    return !value || value.trim().length === 0;
  }

  /**
   * Check if value is numeric
   */
  static isNumeric(value: string): boolean {
    return !isNaN(Number(value)) && !isNaN(parseFloat(value));
  }
}

