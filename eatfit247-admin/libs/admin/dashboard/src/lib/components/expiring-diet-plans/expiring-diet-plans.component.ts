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
import { IExpiringDietPlan } from '@eatfit247-shared-lib';
import { DashboardApiService } from '../../api.service';

@Component({
  selector: 'lib-expiring-diet-plans',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, LoaderComponent, EmptyStateComponent],
  templateUrl: './expiring-diet-plans.component.html',
  styleUrl: './expiring-diet-plans.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpiringDietPlansComponent implements OnInit {
  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  plans: IExpiringDietPlan[] = [];
  loading = false;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.plans = await this.apiService.getExpiringDietPlans();
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  getUrgencyClass(daysRemaining: number): string {
    if (daysRemaining <= 1) return 'urgency-critical';
    if (daysRemaining <= 3) return 'urgency-high';
    if (daysRemaining <= 7) return 'urgency-medium';
    return 'urgency-low';
  }

  getUrgencyIcon(daysRemaining: number): string {
    if (daysRemaining <= 1) return 'error';
    if (daysRemaining <= 3) return 'warning';
    return 'schedule';
  }
}
