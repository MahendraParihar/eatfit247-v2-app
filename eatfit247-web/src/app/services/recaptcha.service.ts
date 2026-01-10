import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/**
 * Service to handle Google reCAPTCHA v3 token generation
 * 
 * This service loads the reCAPTCHA script dynamically and provides
 * methods to generate tokens for form submissions.
 */
@Injectable({
  providedIn: 'root'
})
export class RecaptchaService {
  private readonly siteKey = environment.recaptcha?.siteKey;
  private scriptLoaded = false;
  private scriptLoading = false;

  /**
   * Load the reCAPTCHA script if not already loaded
   * @returns Promise that resolves when script is loaded
   */
  private async loadScript(): Promise<void> {
    if (this.scriptLoaded) {
      return;
    }

    if (this.scriptLoading) {
      // Wait for existing load to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.scriptLoaded) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    if (!this.siteKey) {
      throw new Error('reCAPTCHA site key is not configured');
    }

    this.scriptLoading = true;

    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`);
      if (existingScript) {
        this.scriptLoaded = true;
        this.scriptLoading = false;
        resolve();
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.scriptLoaded = true;
        this.scriptLoading = false;
        resolve();
      };
      
      script.onerror = () => {
        this.scriptLoading = false;
        reject(new Error('Failed to load reCAPTCHA script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Get a reCAPTCHA token for a specific action
   * @param action - The action name (e.g., 'member_creation', 'contact_form_submit')
   * @returns Promise that resolves with the reCAPTCHA token
   */
  async getToken(action: string): Promise<string> {
    try {
      // Ensure script is loaded
      await this.loadScript();

      // Wait for grecaptcha to be ready
      return new Promise((resolve, reject) => {
        if (!window.grecaptcha) {
          reject(new Error('reCAPTCHA is not available'));
          return;
        }

        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(this.siteKey!, { action });
            resolve(token);
          } catch (error: any) {
            reject(new Error(`Failed to execute reCAPTCHA: ${error.message}`));
          }
        });
      });
    } catch (error: any) {
      throw new Error(`Failed to get reCAPTCHA token: ${error.message}`);
    }
  }

  /**
   * Check if reCAPTCHA is available and configured
   * @returns true if reCAPTCHA is configured
   */
  isAvailable(): boolean {
    return !!this.siteKey;
  }
}

