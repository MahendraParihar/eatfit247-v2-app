import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SocialIconsComponent, SocialLink } from '../shared/social-icons/social-icons.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, SocialIconsComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();

  readonly quickLinks = [
    { label: 'About EatFit', url: '/about-us' },
    { label: 'About Shweta Shah', url: '/about-shweta-shah' },
    { label: 'Our Programs', url: '/our-programs' },
    { label: 'Success Stories', url: '/success-stories' },
    { label: 'Press & Media', url: '/press-and-media' },
    { label: 'Blog', url: '/blog' },
    { label: 'Contact Us', url: '/contact-us' },
  ];

  readonly programs = [
    { label: 'Program', url: '/our-programs' },
    { label: 'Product', url: '/product' },
  ];

  readonly socialLinks: SocialLink[] = [
    {
      name: 'Facebook',
      icon: 'assets/images/social/facebook.svg',
      url: 'https://www.facebook.com/eatfit24by7',
    },
    {
      name: 'Twitter',
      icon: 'assets/images/social/twitter.svg',
      url: 'https://twitter.com/eatfit24by7',
    },
    {
      name: 'Instagram',
      icon: 'assets/images/social/instagram.svg',
      url: 'https://www.instagram.com/eatfit24by7',
    },
    {
      name: 'YouTube',
      icon: 'assets/images/social/youtube.svg',
      url: 'https://www.youtube.com/eatfit24by7',
    },
    {
      name: 'Pinterest',
      icon: 'assets/images/social/pinterest.svg',
      url: 'https://www.pinterest.com/eatfit24by7',
    },
    {
      name: 'LinkedIn',
      icon: 'assets/images/social/linkedin.svg',
      url: 'https://www.linkedin.com/company/eatfit24by7',
    },
  ];

  readonly contactInfo = {
    phone: '+91-859-185-4209',
    email: 'eatfit24by7@gmail.com',
  };
}

