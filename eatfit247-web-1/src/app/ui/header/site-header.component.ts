import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, HostListener, inject, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { filter, Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-site-header',
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
  ],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss',
})
export class SiteHeaderComponent implements OnDestroy, AfterViewInit {
  @ViewChild('mobileSidenav') mobileSidenav!: MatSidenav;
  isMobileMenuOpen = false;
  isAboutActive = false;
  private sidenavSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  ngAfterViewInit(): void {
    if (this.mobileSidenav && isPlatformBrowser(this.platformId)) {
      this.sidenavSubscription = this.mobileSidenav.openedChange.subscribe((opened: boolean) => {
        this.isMobileMenuOpen = opened;
        if (opened) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      });
    }
    this.updateActiveStates(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => this.updateActiveStates((e as NavigationEnd).url));
  }

  private updateActiveStates(url: string): void {
    this.isAboutActive = url.startsWith('/about-us') || url.startsWith('/about-shweta-shah');
  }

  toggleMobileMenu(): void {
    if (this.mobileSidenav) {
      if (this.isMobileMenuOpen) {
        this.mobileSidenav.close();
      } else {
        this.mobileSidenav.open();
      }
    }
  }

  closeMobileMenu(): void {
    if (this.mobileSidenav) {
      this.mobileSidenav.close();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (isPlatformBrowser(this.platformId) && window.innerWidth > 1024 && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
    this.sidenavSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }
}


