import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Single social site configuration.
 */
export interface SocialSiteItem {
  link: string;
  icon: string;
  type?: 'external' | 'internal';
}

/**
 * Reusable social links component.
 *
 * Input:
 *  - items: array of { link, icon, type }
 *  - type: default type when item.type is not provided
 *
 * Output:
 *  - clicked: emits info about which item was clicked
 */
@Component({
  standalone: true,
  selector: 'app-social-site',
  imports: [CommonModule, RouterModule],
  templateUrl: './social-site.component.html',
  styleUrl: './social-site.component.scss',
})
export class SocialSiteComponent {
  /**
   * List of social links to render.
   */
  @Input() items: SocialSiteItem[] = [];

  /**
   * Default link type used when an item does not specify `type`.
   *  - external: regular anchor with href + target="_blank"
   *  - internal: routerLink navigation
   */
  @Input() type: 'external' | 'internal' = 'external';

  /**
   * Emits whenever a social item is clicked.
   */
  @Output() clicked = new EventEmitter<{
    event: MouseEvent;
    item: SocialSiteItem;
    index: number;
  }>();

  onClick(event: MouseEvent, item: SocialSiteItem, index: number): void {
    this.clicked.emit({ event, item, index });
  }

  /**
   * Compute icon src for an item, falling back to the ` /name.svg `
   * convention used in the footer.
   */
  iconSrc(item: SocialSiteItem): string {
    if (!item.icon) {
      return '';
    }
    if (item.icon.startsWith('/')) {
      return item.icon;
    }
    if (item.icon.endsWith('.svg')) {
      return `/${item.icon}`;
    }
    return `/${item.icon}.svg`;
  }

  /**
   * Accessible label based on icon name.
   */
  ariaLabel(item: SocialSiteItem): string {
    const key = this.iconKey(item);
    if (!key) {
      return 'Social link';
    }
    const labels: Record<string, string> = {
      facebook: 'Follow us on Facebook',
      instagram: 'Follow us on Instagram',
      linkedin: 'Follow us on LinkedIn',
      pinterest: 'Follow us on Pinterest',
      telegram: 'Follow us on Telegram',
      youtube: 'Subscribe to our YouTube channel',
    };
    return labels[key] ?? `Visit our ${this.capitalize(key)} page`;
  }

  private iconKey(item: SocialSiteItem): string | null {
    if (!item.icon) return null;
    const file = item.icon.split('/').pop() ?? item.icon;
    const withoutExt = file.replace(/\.svg$/i, '');
    return withoutExt.toLowerCase();
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}


