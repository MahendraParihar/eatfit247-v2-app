import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IShipmentDetails, ShipmentStatusEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-overview-step',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './overview-step.component.html',
  styleUrl: './overview-step.component.scss',
})
export class OverviewStepComponent {
  @Input() shipmentDetails: IShipmentDetails | null = null;
  @Input() loading = false;
  @Output() getRates = new EventEmitter<void>();

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

  get showGetRatesButton(): boolean {
    const status = this.shipmentDetails?.status.toUpperCase();
    return status === ShipmentStatusEnum.DRAFT;
  }

  onGetRates(): void {
    this.getRates.emit();
  }
}

