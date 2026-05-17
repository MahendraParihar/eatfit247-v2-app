import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '@shared';
import { IFranchiseKpis } from '@eatfit247-shared-lib';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
import { DashboardApiService } from '../../api.service';

@Component({
  selector: 'lib-franchise-kpi-section',
  standalone: true,
  imports: [CommonModule, LoaderComponent, KpiCardComponent],
  templateUrl: './franchise-kpi-section.component.html',
  styleUrl: './franchise-kpi-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FranchiseKpiSectionComponent implements OnInit {
  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  kpis?: IFranchiseKpis;
  loading = false;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.kpis = await this.apiService.getFranchiseKpis();
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  formatCurrency(value: number): string {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
    return `₹${value}`;
  }
}
