import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from '../header/site-header.component';
import { SiteFooterComponent } from '../footer/site-footer.component';

@Component({
  standalone: true,
  selector: 'app-public-shell',
  imports: [
    CommonModule,
    RouterOutlet,
    SiteHeaderComponent,
    SiteFooterComponent,
  ],
  template: `
    <app-site-header></app-site-header>
    <main role="main" class="site-main">
      <router-outlet></router-outlet>
    </main>
    <app-site-footer></app-site-footer>
  `,
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent {}
