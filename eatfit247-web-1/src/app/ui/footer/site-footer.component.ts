import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  CONTACT_EMAIL,
  CONTACT_NUMBER,
  SOCIAL_LINKS,
} from '../../core/utils/constants';

@Component({
  standalone: true,
  selector: 'app-site-footer',
  imports: [CommonModule, RouterModule],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  readonly currentYear = new Date().getFullYear();
  readonly contactEmail = CONTACT_EMAIL;
  readonly contactNumber = CONTACT_NUMBER;

  readonly facebookUrl = SOCIAL_LINKS.find((s) => s.icon === 'facebook')?.link ?? '#';
  readonly instagramUrl = SOCIAL_LINKS.find((s) => s.icon === 'instagram')?.link ?? '#';
  readonly linkedinUrl = SOCIAL_LINKS.find((s) => s.icon === 'linkedin')?.link ?? '#';
  readonly pinterestUrl = SOCIAL_LINKS.find((s) => s.icon === 'pinterest')?.link ?? '#';
  readonly telegramUrl = SOCIAL_LINKS.find((s) => s.icon === 'telegram')?.link ?? '#';
  readonly youtubeUrl = SOCIAL_LINKS.find((s) => s.icon === 'youtube')?.link ?? '#';
}
