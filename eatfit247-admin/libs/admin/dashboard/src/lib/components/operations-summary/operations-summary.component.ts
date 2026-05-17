import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent, LoaderComponent } from '@shared';
import { IOperationsSnapshot } from '@eatfit247-shared-lib';
import { DashboardApiService } from '../../api.service';

@Component({
  selector: 'lib-operations-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, LoaderComponent, EmptyStateComponent],
  templateUrl: './operations-summary.component.html',
  styleUrl: './operations-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsSummaryComponent implements OnInit {
  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  data?: IOperationsSnapshot;
  loading = false;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.data = await this.apiService.getOperationsSnapshot();
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

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
