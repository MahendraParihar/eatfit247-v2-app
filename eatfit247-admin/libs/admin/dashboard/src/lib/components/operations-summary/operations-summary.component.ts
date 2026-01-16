import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent, LoaderComponent } from '@shared';
import { IOperationsSnapshot } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-operations-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, LoaderComponent, EmptyStateComponent],
  templateUrl: './operations-summary.component.html',
  styleUrl: './operations-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsSummaryComponent {
  @Input() data?: IOperationsSnapshot;
  @Input() loading = false;

  getStatusClass(value: number): 'info' | 'warning' | 'error' {
    if (value === 0) return 'info';
    if (value < 10) return 'warning';
    return 'error';
  }

  getStatusIcon(value: number): string {
    if (value === 0) return 'check_circle';
    if (value < 10) return 'warning';
    return 'error';
  }
}

