import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { EmptyStateComponent, LoaderComponent } from '@shared';
import { ITaxSummary } from '@eatfit247-shared-lib';
import { DashboardApiService } from '../../api.service';

@Component({
  selector: 'lib-tax-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, LoaderComponent, EmptyStateComponent],
  templateUrl: './tax-summary.component.html',
  styleUrl: './tax-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxSummaryComponent implements OnInit {
  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  data?: ITaxSummary;
  loading = false;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.data = await this.apiService.getTaxSummary();
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
