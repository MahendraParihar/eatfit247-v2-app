import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';

interface NavItem {
  label: string;
  route?: string;
  children?: { label: string; route: string }[];
}

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
    MatIcon,
    MatMenu,
    MatMenuItem,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss',
})
export class SiteHeaderComponent {
  mobileMenuOpen = false;

  navItems: NavItem[] = [
    { label: 'Home', route: '/' },
    {
      label: 'About Us',
      children: [
        { label: 'About EatFit247', route: '/about-us' },
        { label: 'About Shweta Shah', route: '/about-shweta-shah' },
      ],
    },
    { label: 'Our Programs', route: '/our-programs' },
    { label: 'Product', route: '/product/de-bloat' },
    { label: 'Success Stories', route: '/success-stories' },
    { label: 'Press & Media', route: '/press-and-media' },
    { label: 'Blog', route: '/blog' },
    { label: 'Contact Us', route: '/contact-us' },
  ];

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}
