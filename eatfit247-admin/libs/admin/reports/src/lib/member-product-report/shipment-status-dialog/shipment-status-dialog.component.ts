import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import {
  IShipment,
  IShipmentTrackingEvent,
  ITrackingEvent,
  ITrackingInfo,
  ShipmentStatusEnum,
} from '@eatfit247-shared-lib';
import { ShipmentAdminApiService } from '../shipment-admin-api.service';

export interface MemberProductShipmentStatusDialogData {
  shipmentId: number;
}

export interface MemberProductShipmentStatusDialogResult {
  retried?: boolean;
}

@Component({
  selector: 'lib-member-product-shipment-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    DatePipe,
  ],
  templateUrl: './shipment-status-dialog.component.html',
  styleUrl: './shipment-status-dialog.component.scss',
})
export class MemberProductShipmentStatusDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<MemberProductShipmentStatusDialogComponent, MemberProductShipmentStatusDialogResult>>(MatDialogRef);
  data = inject<MemberProductShipmentStatusDialogData>(MAT_DIALOG_DATA);
  private shipmentApi = inject(ShipmentAdminApiService);
  private snackBar = inject(MatSnackBar);

  shipment: IShipment | null = null;
  displayEvents: Array<ITrackingEvent | IShipmentTrackingEvent> = [];
  loading = true;
  refreshingTrack = false;
  retrying = false;
  trackError: string | null = null;

  readonly ShipmentStatusEnum = ShipmentStatusEnum;

  ngOnInit(): void {
    void this.loadShipment();
  }

  get canRefreshFromCarrier(): boolean {
    return !!this.shipment?.trackingNumber && !!this.shipment?.courierProviderId;
  }

  get showRetry(): boolean {
    return this.shipment?.status === ShipmentStatusEnum.FAILED;
  }

  private mergeEventsFromShipment(s: IShipment): void {
    const raw = s.trackingEvents ?? [];
    this.displayEvents = [...raw].sort(
      (a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
    );
  }

  private applyTrackingInfo(info: ITrackingInfo): void {
    this.displayEvents = [...(info.trackingEvents ?? [])].sort(
      (a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
    );
    this.trackError = null;
  }

  async loadShipment(): Promise<void> {
    this.loading = true;
    this.trackError = null;
    try {
      this.shipment = await this.shipmentApi.getShipment(this.data.shipmentId);
      this.mergeEventsFromShipment(this.shipment);
    } catch {
      this.shipment = null;
    } finally {
      this.loading = false;
    }
  }

  async refreshFromCarrier(): Promise<void> {
    if (!this.canRefreshFromCarrier) {
      return;
    }
    this.refreshingTrack = true;
    this.trackError = null;
    try {
      const info = await this.shipmentApi.trackShipment(this.data.shipmentId);
      this.applyTrackingInfo(info);
      await this.loadShipment();
      this.snackBar.open('Tracking updated from carrier.', 'Close', { duration: 4000 });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Could not refresh tracking from carrier.';
      this.trackError = msg;
      this.snackBar.open(msg, 'Close', { duration: 6000 });
    } finally {
      this.refreshingTrack = false;
    }
  }

  async retryShipment(): Promise<void> {
    this.retrying = true;
    try {
      await this.shipmentApi.retryShipment(this.data.shipmentId);
      this.snackBar.open('Retry submitted.', 'Close', { duration: 4000 });
      this.dialogRef.close({ retried: true });
    } catch {
      // HttpErrorInterceptor / snackbar
    } finally {
      this.retrying = false;
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  eventTitle(
    e: ITrackingEvent | IShipmentTrackingEvent,
  ): string {
    if ('internalStatus' in e && e.internalStatus) {
      return String(e.internalStatus).replace(/_/g, ' ');
    }
    if ('status' in e && e.status != null && e.status !== '') {
      return String(e.status).replace(/_/g, ' ');
    }
    return 'Update';
  }

  eventDescription(e: ITrackingEvent | IShipmentTrackingEvent): string {
    if ('description' in e && e.description) {
      return e.description;
    }
    return '';
  }

  providerStatus(e: ITrackingEvent | IShipmentTrackingEvent): string {
    if ('providerStatus' in e && e.providerStatus) {
      return e.providerStatus;
    }
    return '';
  }

  formatShipmentStatus(status: string): string {
    if (!status) {
      return '';
    }
    return status
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }

  trackEventId(ev: ITrackingEvent | IShipmentTrackingEvent): string | number {
    if ('trackingEventId' in ev) {
      return ev.trackingEventId;
    }
    return (ev as IShipmentTrackingEvent).shipmentTrackingEventId;
  }
}
