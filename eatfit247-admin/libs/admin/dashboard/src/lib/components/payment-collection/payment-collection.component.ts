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
import { IPaymentCollectionStatus } from '@eatfit247-shared-lib';
import { DashboardApiService } from '../../api.service';

@Component({
  selector: 'lib-payment-collection',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, LoaderComponent, EmptyStateComponent],
  templateUrl: './payment-collection.component.html',
  styleUrl: './payment-collection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentCollectionComponent implements OnInit {
  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  data?: IPaymentCollectionStatus;
  loading = false;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.data = await this.apiService.getPaymentCollectionStatus();
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
