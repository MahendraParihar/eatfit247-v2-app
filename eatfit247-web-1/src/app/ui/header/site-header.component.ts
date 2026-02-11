import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, OnDestroy, ViewChild, AfterViewInit, inject, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';

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
  private sidenavSubscription?: Subscription;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    // Listen to sidenav events to keep state in sync
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
    // Close mobile menu on resize to desktop
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
    // Cleanup: restore body scroll if component is destroyed while menu is open
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
    if (this.sidenavSubscription) {
      this.sidenavSubscription.unsubscribe();
    }
  }
}


