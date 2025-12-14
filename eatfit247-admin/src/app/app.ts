/**
 * App Component
 * 
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 */

import { Component, OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'eatfit247-admin';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Theme service initializes automatically via constructor
    // This ensures theme is applied on app load (class-based: .light-theme or .dark-theme)
    // Per design system: Themes are applied ONLY via class (.light-theme or .dark-theme)
    if (!document.documentElement.classList.contains('light-theme') && 
        !document.documentElement.classList.contains('dark-theme')) {
      // Apply default light theme if no theme class is present
      document.documentElement.classList.add('light-theme');
    }
  }
}
