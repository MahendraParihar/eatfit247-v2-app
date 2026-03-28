import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SocialSiteComponent, SocialSiteItem } from '@shared-ui';
import { CONTACT_EMAIL, CONTACT_NUMBER, SOCIAL_LINKS } from '../../core/utils/constants';

@Component({
  standalone: true,
  selector: 'app-site-footer',
  imports: [CommonModule, RouterModule, SocialSiteComponent],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  readonly currentYear = new Date().getFullYear();
  readonly socialLinks: SocialSiteItem[] = SOCIAL_LINKS;
  readonly contactEmail = CONTACT_EMAIL;
  readonly contactNumber = CONTACT_NUMBER;


}
