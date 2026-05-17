import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

interface NavItem {
  label: string;
  route?: string;
  children?: { label: string; route: string }[];
}

@Component({
  standalone: true,
  selector: 'app-site-header',
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss',
})
export class SiteHeaderComponent {
  readonly theme = inject(ThemeService);

  mobileMenuOpen = false;

  navItems: NavItem[] = [
    { label: 'Home', route: '/' },
    {
      label: 'About',
      children: [
        { label: 'About EatFit247', route: '/about-us' },
        { label: 'About Shweta Shah', route: '/about-shweta-shah' },
      ],
    },
    {
      label: 'Programs',
      children: [
        { label: '1:1 Programs', route: '/our-programs' },
        { label: 'Seasonal Plans', route: '/seasonal-plans' },
      ],
    },
    { label: 'Product', route: '/product/de-bloat' },
    { label: 'Success Stories', route: '/success-stories' },
    { label: 'Press and Media', route: '/press-and-media' },
    { label: 'Blogs', route: '/blog' },
    { label: 'Contact Us', route: '/contact-us' },
  ];

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleTheme(): void {
    this.theme.toggleTheme();
  }
}
