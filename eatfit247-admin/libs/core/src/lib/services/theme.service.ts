/**
 * ThemeService - Theme management service
 *
 * ⚠️ DESIGN SYSTEM: Implements theme rules from DESIGN_SYSTEM.md
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

  themeMode = signal<ThemeMode>(this.getStoredTheme() || 'auto');
  effectiveTheme = signal<'light' | 'dark'>('light');

  constructor() {
    this.applyTheme(this.themeMode());

    this.prefersDarkQuery.addEventListener('change', (e) => {
      if (this.themeMode() === 'auto') {
        this.effectiveTheme.set(e.matches ? 'dark' : 'light');
        this.applyThemeClass(e.matches ? 'dark' : 'light');
      }
    });

    effect(() => {
      const mode = this.themeMode();
      const effective = this.resolveTheme(mode);
      this.effectiveTheme.set(effective);
      this.applyTheme(mode);
    });
  }

  setTheme(mode: ThemeMode): void {
    this.themeMode.set(mode);
    localStorage.setItem(this.THEME_KEY, mode);
  }

  toggleTheme(): void {
    const current = this.effectiveTheme();
    const newTheme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private getStoredTheme(): ThemeMode | null {
    const stored = localStorage.getItem(this.THEME_KEY);
    return stored as ThemeMode | null;
  }

  private resolveTheme(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'auto') {
      return this.prefersDarkQuery.matches ? 'dark' : 'light';
    }
    return mode;
  }

  private applyTheme(mode: ThemeMode): void {
    const effective = this.resolveTheme(mode);
    this.applyThemeClass(effective);
  }

  private applyThemeClass(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    root.classList.remove('light-theme', 'dark-theme');
    root.classList.add(`${theme}-theme`);
  }
}
