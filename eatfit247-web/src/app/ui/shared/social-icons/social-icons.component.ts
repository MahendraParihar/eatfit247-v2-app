import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SocialLink {
  name: string;
  icon: string; // Path to SVG icon
  url: string;
}

@Component({
  selector: 'app-social-icons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-icons.component.html',
  styleUrl: './social-icons.component.scss',
})
export class SocialIconsComponent {
  @Input() links: SocialLink[] = [];
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showLabels: boolean = false;
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';

  openSocialLink(url: string): void {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

