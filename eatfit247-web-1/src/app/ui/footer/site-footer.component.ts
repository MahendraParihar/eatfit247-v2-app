import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SocialSiteComponent, SocialSiteItem } from '@shared-ui';

@Component({
  standalone: true,
  selector: 'app-site-footer',
  imports: [CommonModule, RouterModule, SocialSiteComponent],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  readonly currentYear = new Date().getFullYear();

  readonly socialLinks: SocialSiteItem[] = [
    {
      link: 'https://www.facebook.com/eatfit24by7',
      icon: 'facebook',
      type: 'external',
    },
    {
      link: 'https://www.instagram.com/eatfit24by7',
      icon: 'instagram',
      type: 'external',
    },
    {
      link: 'https://www.linkedin.com/company/eatfit24by7',
      icon: 'linkedin',
      type: 'external',
    },
    {
      link: 'https://www.pinterest.com/eatfit24by7',
      icon: 'pinterest',
      type: 'external',
    },
    {
      link: 'https://t.me/eatfit24by7',
      icon: 'telegram',
      type: 'external',
    },
    {
      link: 'https://www.youtube.com/@shwetashahEatfit247',
      icon: 'youtube',
      type: 'external',
    },
  ];
}


