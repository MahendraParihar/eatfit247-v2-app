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
import { IOrdersByStatus } from '@eatfit247-shared-lib';
import { DashboardApiService } from '../../api.service';

@Component({
  selector: 'lib-orders-by-status',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, LoaderComponent, EmptyStateComponent],
  templateUrl: './orders-by-status.component.html',
  styleUrl: './orders-by-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersByStatusComponent implements OnInit {
  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  data: IOrdersByStatus[] = [];
  loading = false;

  private readonly statusColors: Record<string, string> = {
    pending: 'var(--status-warning)',
    processing: 'var(--status-info)',
    shipped: 'var(--md-sys-color-tertiary)',
    delivered: 'var(--status-success)',
    cancelled: 'var(--status-error)',
  };

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.data = await this.apiService.getOrdersByStatus();
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  getStatusColor(status: string): string {
    return this.statusColors[status.toLowerCase()] || 'var(--md-sys-color-primary)';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: 'hourglass_empty',
      processing: 'sync',
      shipped: 'local_shipping',
      delivered: 'check_circle',
      cancelled: 'cancel',
    };
    return icons[status.toLowerCase()] || 'circle';
  }
}
