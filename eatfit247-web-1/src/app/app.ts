import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SEOService } from './core/services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet />`,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly seoService = inject(SEOService);

  async ngOnInit(): Promise<void> {
    // Initialize SEO for the current route
    await this.seoService.initializeSeo();
  }
}
