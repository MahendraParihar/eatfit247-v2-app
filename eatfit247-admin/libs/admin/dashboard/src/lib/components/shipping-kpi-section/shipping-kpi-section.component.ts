import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '@shared';
import { IShippingKpis } from '@eatfit247-shared-lib';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
import { DashboardApiService } from '../../api.service';

@Component({
  selector: 'lib-shipping-kpi-section',
  standalone: true,
  imports: [CommonModule, LoaderComponent, KpiCardComponent],
  templateUrl: './shipping-kpi-section.component.html',
  styleUrl: './shipping-kpi-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShippingKpiSectionComponent implements OnInit {
  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  kpis?: IShippingKpis;
  loading = false;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.kpis = await this.apiService.getShippingKpis();
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
