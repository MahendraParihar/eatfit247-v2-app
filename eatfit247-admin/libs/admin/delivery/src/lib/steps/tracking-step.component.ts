import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { LoaderComponent, EmptyStateComponent } from '@shared';
import { ITrackingInfo, IShipmentDetails, ShipmentStatusEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-tracking-step',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    LoaderComponent,
    EmptyStateComponent
  ],
  templateUrl: './tracking-step.component.html',
  styleUrl: './tracking-step.component.scss'
})
export class TrackingStepComponent {
  @Input() trackingInfo: ITrackingInfo | null = null;
  @Input() shipmentDetails: IShipmentDetails | null = null;
  @Input() loading = false;
  @Input() showRetryButton = false;
  @Output() refresh = new EventEmitter<void>();
  @Output() retryBooking = new EventEmitter<void>();

  getStatusClass(status: string): string {
    const statusUpper = status.toUpperCase();
    if (statusUpper === ShipmentStatusEnum.BOOKED || statusUpper === 'PICKUP_SCHEDULED') {
      return 'status-booked';
    } else if (statusUpper === ShipmentStatusEnum.IN_TRANSIT || statusUpper === 'OUT_FOR_DELIVERY') {
      return 'status-in-transit';
    } else if (statusUpper === ShipmentStatusEnum.DELIVERED) {
      return 'status-delivered';
    } else if (statusUpper === ShipmentStatusEnum.FAILED || statusUpper === 'CANCELLED' || statusUpper === 'RTO') {
      return 'status-failed';
    }
    return '';
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onRetry(): void {
    this.retryBooking.emit();
  }
}

