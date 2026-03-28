import { Component, HostListener, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SiteHeaderComponent } from '../header/site-header.component';
import { SiteFooterComponent } from '../footer/site-footer.component';
import { ContainerComponent } from '@shared-ui/layout';

@Component({
  standalone: true,
  selector: 'app-public-shell',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    SiteHeaderComponent,
    SiteFooterComponent,
    ContainerComponent,
  ],
  template: `
    <header>
      <app-site-header></app-site-header>
    </header>
    <main role="main">
      <app-container>
        <router-outlet></router-outlet>
      </app-container>
    </main>
    <footer>
      <app-site-footer></app-site-footer>
    </footer>
    <!-- Sticky mobile CTA -->
    <div
      class="sticky-fab"
      [class.sticky-fab--hidden]="fabHidden()"
      aria-hidden="true"
    >
      <a
        routerLink="/our-programs"
        mat-fab
        extended
        color="primary"
        class="sticky-fab__btn"
        aria-label="Book a consultation"
      >
        <mat-icon>calendar_month</mat-icon>
        Book Consultation
      </a>
    </div>
  `,
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent {
  private platformId = inject(PLATFORM_ID);
  readonly fabHidden = signal(false);
  private lastScrollY = 0;

  @HostListener('window:scroll')
  onScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const currentScrollY = window.scrollY;
    if (currentScrollY < 100) {
      this.fabHidden.set(false);
    } else {
      this.fabHidden.set(currentScrollY > this.lastScrollY);
    }
    this.lastScrollY = currentScrollY;
  }
}


