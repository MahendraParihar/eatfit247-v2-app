import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lib-kpi-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardComponent {
  @Input() icon!: string;
  @Input() label!: string;
  @Input() value!: string | number;
  @Input() trend?: number;
  @Input() trendLabel?: string;

  getTrendValue(): number {
    return this.trend !== undefined ? Math.abs(this.trend) : 0;
  }
}

