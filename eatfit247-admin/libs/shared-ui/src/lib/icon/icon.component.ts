import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type IconSize = 'large' | 'medium' | 'regular' | 'small';

@Component({
  selector: 'shared-ui-icon',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss'
})
export class IconComponent {
  @Input() name!: string;
  @Input() size: IconSize = 'regular';

  get fontSizePx(): number {
    switch (this.size) {
      case 'large':
        return 48;
      case 'medium':
        return 36;
      case 'small':
        return 18;
      case 'regular':
      default:
        return 24;
    }
  }
}

