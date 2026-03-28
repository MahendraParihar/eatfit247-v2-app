import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JsonLdService, SEOService, ThemeService } from './core/services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly seoService = inject(SEOService);
  private readonly themeService = inject(ThemeService);
  private readonly jsonLdService = inject(JsonLdService);

  async ngOnInit(): Promise<void> {
    this.jsonLdService.injectGlobalSchemas();
    await this.seoService.initializeSeo();
  }
}
