import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map, startWith } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'eatfit247-theme';

  private readonly prefersDark = isPlatformBrowser(this.platformId)
    ? toSignal(
        fromEvent<MediaQueryListEvent>(
          window.matchMedia('(prefers-color-scheme: dark)'),
          'change'
        ).pipe(
          startWith(window.matchMedia('(prefers-color-scheme: dark)')),
          map((media) => media.matches)
        ),
        { initialValue: window.matchMedia('(prefers-color-scheme: dark)').matches }
      )
    : null;

  readonly currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme(this.currentTheme());
    }
  }

  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    this.persistTheme(theme);
  }

  private getInitialTheme(): Theme {
    if (!isPlatformBrowser(this.platformId)) {
      return 'light';
    }

    const stored = localStorage.getItem(this.storageKey) as Theme | null;
    if (stored && (stored === 'light' || stored === 'dark')) {
      return stored;
    }
    return this.prefersDark?.() ? 'dark' : 'light';
  }

  private applyTheme(theme: Theme): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const body = this.document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${theme}-theme`);
    this.document.documentElement.setAttribute('data-theme', theme);
  }

  private persistTheme(theme: Theme): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.warn('Failed to persist theme preference:', error);
    }
  }
}

