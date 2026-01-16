import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent, EmptyStateType, LoaderComponent } from '@shared';

@Component({
  selector: 'lib-diet-engagement',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './diet-engagement.component.html',
  styleUrl: './diet-engagement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietEngagementComponent {
  @Input() data: any;
  @Input() memberId!: number;
  @Input() loading = false;

  EmptyStateType = EmptyStateType;

  getProgressColor(value: number): string {
    if (value >= 80) return 'primary';
    if (value >= 50) return 'accent';
    return 'warn';
  }
}

