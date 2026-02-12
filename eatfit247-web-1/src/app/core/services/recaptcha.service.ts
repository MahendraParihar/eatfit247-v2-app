import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpService } from './http.service';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class RecaptchaService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly httpService = inject(HttpService);
  /**
   * Cached reCAPTCHA site key.
   * - Initially loaded from environment if provided.
   * - If not present, fetched from backend config service.
   */
  private siteKey: string | null = null;
  private siteKeyLoadingPromise: Promise<string | null> | null = null;
  private scriptLoaded = false;
  private scriptLoading = false;

  /**
   * Ensure we have a site key, loading it from the backend if needed.
   */
  private async ensureSiteKey(): Promise<string> {
    // If already loaded (from env or previous fetch), return it
    if (this.siteKey) {
      return this.siteKey;
    }
    // If a fetch is already in progress, await it
    if (this.siteKeyLoadingPromise) {
      const existingKey = await this.siteKeyLoadingPromise;
      if (!existingKey) {
        throw new Error('reCAPTCHA site key is not configured');
      }
      return existingKey;
    }
    // Start fetching from backend config service
    this.siteKeyLoadingPromise = this.httpService
      .get<{ siteKey: string }>('config/recaptcha-site-key')
      .then((result) => {
        const key = result?.data.siteKey?.trim();
        if (key) {
          this.siteKey = key;
          return key;
        }
        return null;
      })
      .catch((error) => {
        console.error('Failed to load reCAPTCHA site key from server:', error);
        return null;
      });
    const loadedKey = await this.siteKeyLoadingPromise;
    if (!loadedKey) {
      throw new Error('reCAPTCHA site key is not configured');
    }
    return loadedKey;
  }

  private async loadScript(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }
    // Ensure we have a valid site key (from env or backend)
    const siteKey = await this.ensureSiteKey();
    if (this.scriptLoaded) {
      return;
    }
    if (this.scriptLoading) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.scriptLoaded) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
    this.scriptLoading = true;
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[src*=\"recaptcha/api.js\"]'
      );
      if (existingScript) {
        this.scriptLoaded = true;
        this.scriptLoading = false;
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
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

  async getToken(action: string): Promise<string> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('reCAPTCHA is only available in browser environment');
    }
    try {
      await this.loadScript();
      return new Promise((resolve, reject) => {
        if (!window.grecaptcha) {
          reject(new Error('reCAPTCHA is not available'));
          return;
        }
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(this.siteKey!, {
              action
            });
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

  isAvailable(): boolean {
    // On the frontend we can load the site key dynamically,
    // so only check that we're running in a browser environment.
    return isPlatformBrowser(this.platformId);
  }
}


