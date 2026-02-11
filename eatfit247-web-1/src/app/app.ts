import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { SEOService } from './core/services/seo.service';
import { HttpService } from './core/services/http.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly seoService = inject(SEOService);
  private readonly httpService = inject(HttpService);

  async ngOnInit(): Promise<void> {
    // Theme is initialized in ThemeService constructor
    
    // Set HTTP service base URL for API calls
    // TODO: Move this to environment configuration or APP_INITIALIZER
    // For now, using default localhost. Update for production.
    // In production, this should be set from environment variables or config
    const apiBaseUrl = 'http://localhost:3000/api/v2';
    this.httpService.setBaseUrl(apiBaseUrl);
    
    // Initialize SEO for the current route
    await this.seoService.initializeSeo();
  }
}
