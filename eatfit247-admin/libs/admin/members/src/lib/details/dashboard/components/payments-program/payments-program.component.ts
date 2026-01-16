import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { EmptyStateComponent, EmptyStateType, LoaderComponent } from '@shared';

@Component({
  selector: 'lib-payments-program',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './payments-program.component.html',
  styleUrl: './payments-program.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsProgramComponent {
  @Input() data: any;
  @Input() memberId!: number;
  @Input() loading = false;

  EmptyStateType = EmptyStateType;

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getPaymentStatusColor(status: string): string {
    const statusMap: Record<string, string> = {
      completed: 'primary',
      pending: 'warn',
      failed: 'warn',
      refunded: 'accent',
    };
    return statusMap[status?.toLowerCase()] || 'primary';
  }
}

