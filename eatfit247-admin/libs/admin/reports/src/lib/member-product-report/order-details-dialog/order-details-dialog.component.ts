import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  IMemberProduct,
  IShipment,
  IShipmentMetaData,
  IShipmentTrackingEvent,
  ITrackingEvent,
  ITrackingInfo,
  ShipmentStatusEnum,
} from '@eatfit247-shared-lib';
import { FormatCurrencyPipe, WarningDialogComponent, WarningDialogData } from '@shared';
import { MembersApiService } from 'members';
import { ShipmentAdminApiService } from '../shipment-admin-api.service';
import { firstValueFrom } from 'rxjs';

export interface OrderDetailsDialogData {
  memberId: number;
  memberProductId: number;
  shipmentId?: number | null;
}

export interface OrderDetailsDialogResult {
  refresh?: boolean;
}

@Component({
  selector: 'lib-order-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatTableModule,
    MatSnackBarModule,
    MatTooltipModule,
    FormatCurrencyPipe,
  ],
  templateUrl: './order-details-dialog.component.html',
  styleUrl: './order-details-dialog.component.scss',
})
export class OrderDetailsDialogComponent implements OnInit {
  dialogRef =
    inject<MatDialogRef<OrderDetailsDialogComponent, OrderDetailsDialogResult>>(MatDialogRef);
  data = inject<OrderDetailsDialogData>(MAT_DIALOG_DATA);

  private membersApi = inject(MembersApiService);
  private shipmentApi = inject(ShipmentAdminApiService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly ShipmentStatusEnum = ShipmentStatusEnum;
  readonly displayedColumns = [
    'productName',
    'quantityLabel',
    'unitPrice',
    'quantity',
    'baseAmount',
    'discountAmount',
    'taxAmount',
    'totalAmount',
  ];

  loadingOrder = signal(false);
  loadingShipment = signal(false);
  productOrder = signal<IMemberProduct | null>(null);
  shipment = signal<IShipment | null>(null);
  trackingEvents = signal<Array<ITrackingEvent | IShipmentTrackingEvent>>([]);
  trackError = signal<string | null>(null);

  creatingShipment = signal(false);
  refreshingTracking = signal(false);
  retrying = signal(false);
  cancelling = signal(false);

  private touched = false;

  ngOnInit(): void {
    void this.loadOrder();
    if (this.data.shipmentId) {
      void this.loadShipment(this.data.shipmentId);
    }
  }

  get hasShipment(): boolean {
    return !!this.shipment();
  }

  get canRefreshFromCarrier(): boolean {
    const s = this.shipment();
    return !!s?.trackingNumber && !!s?.courierProviderId;
  }

  get canRetry(): boolean {
    return this.shipment()?.status === ShipmentStatusEnum.FAILED;
  }

  get canCancel(): boolean {
    const status = this.shipment()?.status;
    if (!status) return false;
    return (
      status !== ShipmentStatusEnum.CANCELLED && status !== ShipmentStatusEnum.DELIVERED
    );
  }

  // Once a shipment is CANCELLED (or FAILED) it can't be revived on the carrier
  // side — but we can create a fresh shipment row for the same order. The
  // backend's initiate guard allows this when the latest shipment is in one of
  // those terminal-failure states.
  get canRebook(): boolean {
    const status = this.shipment()?.status;
    return status === ShipmentStatusEnum.CANCELLED || status === ShipmentStatusEnum.FAILED;
  }

  async loadOrder(): Promise<void> {
    this.loadingOrder.set(true);
    try {
      const order = await this.membersApi.getProductOrder(
        this.data.memberId,
        this.data.memberProductId,
      );
      this.productOrder.set(order);
    } catch {
      this.productOrder.set(null);
    } finally {
      this.loadingOrder.set(false);
    }
  }

  async loadShipment(shipmentId: number): Promise<void> {
    this.loadingShipment.set(true);
    this.trackError.set(null);
    try {
      const s = await this.shipmentApi.getShipment(shipmentId);
      this.shipment.set(s);
      this.mergeEventsFromShipment(s);
    } catch {
      this.shipment.set(null);
      this.trackingEvents.set([]);
    } finally {
      this.loadingShipment.set(false);
    }
  }

  private mergeEventsFromShipment(s: IShipment): void {
    const raw = s.trackingEvents ?? [];
    this.trackingEvents.set(
      [...raw].sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()),
    );
  }

  async createShipment(): Promise<void> {
    if (this.creatingShipment()) return;
    this.creatingShipment.set(true);
    try {
      await this.shipmentApi.createShipmentForMemberProductOrder(this.data.memberProductId);
      this.snackBar.open('Shipment creation requested.', 'Close', { duration: 4000 });
      this.touched = true;
      // After creation, we don't have the shipmentId until the report reloads.
      // The orchestration runs async — close & let the parent reload.
      this.dialogRef.close({ refresh: true });
    } catch {
      // HttpErrorInterceptor toast
    } finally {
      this.creatingShipment.set(false);
    }
  }

  async refreshTracking(): Promise<void> {
    const shipmentId = this.shipment()?.shipmentId;
    if (!shipmentId || !this.canRefreshFromCarrier) return;
    this.refreshingTracking.set(true);
    this.trackError.set(null);
    try {
      const info: ITrackingInfo = await this.shipmentApi.trackShipment(shipmentId);
      this.trackingEvents.set(
        [...(info.trackingEvents ?? [])].sort(
          (a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
        ),
      );
      await this.loadShipment(shipmentId);
      this.touched = true;
      this.snackBar.open('Tracking updated from carrier.', 'Close', { duration: 4000 });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Could not refresh tracking from carrier.';
      this.trackError.set(msg);
      this.snackBar.open(msg, 'Close', { duration: 6000 });
    } finally {
      this.refreshingTracking.set(false);
    }
  }

  async retryShipment(): Promise<void> {
    const shipmentId = this.shipment()?.shipmentId;
    if (!shipmentId) return;
    this.retrying.set(true);
    try {
      await this.shipmentApi.retryShipment(shipmentId);
      this.snackBar.open('Retry submitted.', 'Close', { duration: 4000 });
      this.touched = true;
      await this.loadShipment(shipmentId);
    } catch {
      // HttpErrorInterceptor toast
    } finally {
      this.retrying.set(false);
    }
  }

  async cancelShipment(): Promise<void> {
    const shipmentId = this.shipment()?.shipmentId;
    if (!shipmentId) return;
    const dialogData: WarningDialogData = {
      title: 'Cancel Shipment',
      message:
        'Cancel this shipment? The carrier will be notified and the shipment status will be set to CANCELLED.',
      confirmText: 'Cancel Shipment',
      cancelText: 'Keep Shipment',
    };
    const dialogRef = this.dialog.open(WarningDialogComponent, {
      width: '500px',
      data: dialogData,
    });
    const ok = (await firstValueFrom(dialogRef.afterClosed())) === true;
    if (!ok) return;
    this.cancelling.set(true);
    try {
      const updated = await this.shipmentApi.cancelShipment(shipmentId);
      this.shipment.set(updated);
      this.mergeEventsFromShipment(updated);
      this.touched = true;
      this.snackBar.open('Shipment cancelled.', 'Close', { duration: 4000 });
    } catch {
      // HttpErrorInterceptor toast
    } finally {
      this.cancelling.set(false);
    }
  }

  close(): void {
    this.dialogRef.close(this.touched ? { refresh: true } : undefined);
  }

  // ── Order helpers (ported from view-product-order-details) ────────────────

  get isNotPaid(): boolean {
    const status = this.productOrder()?.paymentStatus?.toLowerCase();
    return status !== 'paid' && status !== 'success' && status !== 'completed';
  }

  get hasPaymentLink(): boolean {
    return !!this.productOrder()?.paymentLink;
  }

  // ── Shipment metaData accessors ───────────────────────────────────────────

  get shipmentMeta(): IShipmentMetaData | null {
    return (this.shipment()?.metaData as IShipmentMetaData | undefined) ?? null;
  }

  get awbNumber(): string | null {
    const s = this.shipment();
    if (!s) return null;
    return this.shipmentMeta?.awbNumber ?? s.trackingNumber ?? null;
  }

  get labelUrl(): string | null {
    return this.shipmentMeta?.labelUrl ?? null;
  }

  get codAmount(): number | null {
    const cod = this.shipmentMeta?.codAmount;
    return typeof cod === 'number' && cod > 0 ? cod : null;
  }

  get serviceLabel(): string | null {
    const s = this.shipment();
    return s?.serviceName ?? this.shipmentMeta?.serviceName ?? null;
  }

  get dimensionsLabel(): string | null {
    const s = this.shipment();
    if (!s) return null;
    const l = s.lengthCm ?? this.shipmentMeta?.dimensions?.length;
    const b = s.widthCm ?? this.shipmentMeta?.dimensions?.breadth ?? this.shipmentMeta?.dimensions?.width;
    const h = s.heightCm ?? this.shipmentMeta?.dimensions?.height;
    if (l == null && b == null && h == null) return null;
    const fmt = (v: number | undefined | null) => (v == null ? '?' : String(v));
    return `${fmt(l)} × ${fmt(b)} × ${fmt(h)} cm`;
  }

  get weightLabel(): string | null {
    const s = this.shipment();
    if (!s) return null;
    if (s.totalWeightKg != null) return `${s.totalWeightKg} kg`;
    const grams = this.shipmentMeta?.weight;
    if (grams != null) return `${grams} g`;
    return null;
  }

  get receiverLines(): string[] {
    const s = this.shipment();
    if (!s) return [];
    const parts: string[] = [];
    if (s.receiverName) parts.push(s.receiverName);
    if (s.receiverPhone) parts.push(s.receiverPhone);
    if (s.receiverAddress) parts.push(s.receiverAddress);
    const cityStatePin = [s.receiverCity, s.receiverState, s.receiverPincode]
      .filter((v) => !!v)
      .join(', ');
    if (cityStatePin) parts.push(cityStatePin);
    if (s.receiverCountry) parts.push(s.receiverCountry);
    return parts;
  }

  get bookingResponseJson(): string | null {
    const raw = this.shipmentMeta?.bookingResponse;
    if (!raw) return null;
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return null;
    }
  }

  copyToClipboard(value: string | null | undefined, label = 'Value'): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(
      () => this.snackBar.open(`${label} copied to clipboard.`, 'Close', { duration: 2500 }),
      () => this.snackBar.open(`Failed to copy ${label.toLowerCase()}.`, 'Close', { duration: 2500 }),
    );
  }

  copyPaymentLink(): void {
    const paymentLink = this.productOrder()?.paymentLink;
    if (!paymentLink) return;
    navigator.clipboard.writeText(paymentLink).then(
      () =>
        this.snackBar.open('Payment link copied to clipboard!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        }),
      () =>
        this.snackBar.open('Failed to copy payment link', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        }),
    );
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('success') || s.includes('completed') || s.includes('paid')) {
      return 'status-success';
    }
    if (s.includes('pending')) return 'status-pending';
    if (s.includes('failed') || s.includes('cancelled') || s.includes('refunded')) {
      return 'status-failed';
    }
    return '';
  }

  // ── Shipment helpers (ported from shipment-status-dialog) ─────────────────

  formatShipmentStatus(status: string | undefined): string {
    if (!status) return '';
    return status
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }

  shipmentStatusClass(status: string | undefined): string {
    if (!status) return '';
    if (
      status === ShipmentStatusEnum.DELIVERED ||
      status === ShipmentStatusEnum.BOOKED ||
      status === ShipmentStatusEnum.IN_TRANSIT ||
      status === ShipmentStatusEnum.OUT_FOR_DELIVERY
    ) {
      return 'status-success';
    }
    if (status === ShipmentStatusEnum.FAILED || status === ShipmentStatusEnum.RTO) {
      return 'status-failed';
    }
    if (status === ShipmentStatusEnum.CANCELLED) {
      return 'status-failed';
    }
    return 'status-pending';
  }

  eventTitle(e: ITrackingEvent | IShipmentTrackingEvent): string {
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
    if ('providerStatus' in e && e.providerStatus) return e.providerStatus;
    return '';
  }

  trackEventId(ev: ITrackingEvent | IShipmentTrackingEvent): string | number {
    if ('trackingEventId' in ev) return ev.trackingEventId;
    return (ev as IShipmentTrackingEvent).shipmentTrackingEventId;
  }
}
