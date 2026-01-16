/**
 * ThemeService - Theme management service
 * 
 * ⚠️ DESIGN SYSTEM: Implements theme rules from DESIGN_SYSTEM.md
 * ⚠️ STORYBOOK IS PRIMARY SOURCE: http://localhost:4400
 * - Defaults to system preference (auto mode)
 * - User override saved in localStorage (key: 'eatfit247-theme')
 * - Class-based switching: .light-theme or .dark-theme (ONLY via class per design system)
 */
import { effect, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'eatfit247-theme';
  private readonly prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Signal for current theme mode
  themeMode = signal<ThemeMode>(this.getStoredTheme() || 'auto');
  
  // Signal for effective theme (resolved from auto)
  effectiveTheme = signal<'light' | 'dark'>('light');

  constructor() {
    // Load initial theme
    this.applyTheme(this.themeMode());

    // Watch for system preference changes when in auto mode
    this.prefersDarkQuery.addEventListener('change', (e) => {
      if (this.themeMode() === 'auto') {
        this.effectiveTheme.set(e.matches ? 'dark' : 'light');
        this.applyThemeClass(e.matches ? 'dark' : 'light');
      }
    });

    // Effect to apply theme when mode changes
    effect(() => {
      const mode = this.themeMode();
      const effective = this.resolveTheme(mode);
      this.effectiveTheme.set(effective);
      this.applyTheme(mode);
    });
  }

  /**
   * Set theme mode (light, dark, or auto)
   */
  setTheme(mode: ThemeMode): void {
    this.themeMode.set(mode);
    localStorage.setItem(this.THEME_KEY, mode);
  }

  /**
   * Toggle between light and dark (ignores auto mode)
   */
  toggleTheme(): void {
    const current = this.effectiveTheme();
    const newTheme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Get stored theme from localStorage
   */
  private getStoredTheme(): ThemeMode | null {
    const stored = localStorage.getItem(this.THEME_KEY);
    return stored as ThemeMode | null;
  }

  /**
   * Resolve effective theme from mode
   */
  private resolveTheme(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'auto') {
      return this.prefersDarkQuery.matches ? 'dark' : 'light';
    }
    return mode;
  }

  /**
   * Apply theme to document
   */
  private applyTheme(mode: ThemeMode): void {
    const effective = this.resolveTheme(mode);
    this.applyThemeClass(effective);
  }

  /**
   * Apply theme class to document root
   * Per design system: Themes are applied ONLY via class (.light-theme or .dark-theme)
   */
  private applyThemeClass(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    // Remove both classes first
    root.classList.remove('light-theme', 'dark-theme');
    // Add the appropriate class
    root.classList.add(`${theme}-theme`);
  }
}

