import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '@shared';
import { INutritionistKpis } from '@eatfit247-shared-lib';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
import { DashboardApiService } from '../../api.service';

@Component({
  selector: 'lib-nutritionist-kpi-section',
  standalone: true,
  imports: [CommonModule, LoaderComponent, KpiCardComponent],
  templateUrl: './nutritionist-kpi-section.component.html',
  styleUrl: './nutritionist-kpi-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutritionistKpiSectionComponent implements OnInit {
  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  kpis?: INutritionistKpis;
  loading = false;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.kpis = await this.apiService.getNutritionistKpis();
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
