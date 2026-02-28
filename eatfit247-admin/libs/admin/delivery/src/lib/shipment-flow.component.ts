import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, Observable } from 'rxjs';
import {
  IMemberProduct,
  IRateQuote,
  IShipment,
  ITrackingInfo,
  ShipmentStatusEnum,
} from '@eatfit247-shared-lib';
import { DeliveryApiService } from './api.service';
import { OverviewStepComponent } from './steps/overview-step.component';
import { ItemsStepComponent } from './steps/items-step.component';
import { RateStepComponent } from './steps/rate-step.component';
import { ConfirmStepComponent } from './steps/confirm-step.component';
import { TrackingStepComponent } from './steps/tracking-step.component';
import { AlertDialogComponent, LoaderComponent } from '@shared';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  IOrderItemShipmentGroup,
  ShipmentFlowData,
} from './models/shipment.model';

@Component({
  selector: 'lib-shipment-flow',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    OverviewStepComponent,
    ItemsStepComponent,
    RateStepComponent,
    ConfirmStepComponent,
    TrackingStepComponent,
    LoaderComponent,
  ],
  templateUrl: './shipment-flow.component.html',
  styleUrl: './shipment-flow.component.scss',
})
export class ShipmentFlowComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(DeliveryApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<ShipmentFlowComponent>, {
    optional: true,
  });
  private readonly dialogData = inject<ShipmentFlowData | null>(
    MAT_DIALOG_DATA,
    { optional: true }
  );

  shipmentDetails = signal<IShipment | null>(null);
  rates = signal<IRateQuote[]>([]);
  selectedRate = signal<IRateQuote | null>(null);
  trackingInfo = signal<ITrackingInfo | null>(null);
  loading = signal(false);
  booking = signal(false);
  currentStep = signal(0);
  shipmentId = signal<number | undefined>(undefined);
  memberProductOrder = signal<IMemberProduct | null>(null);
  orderItemGroups = signal<IOrderItemShipmentGroup[]>([]);
  itemsSaved = signal(false);
  memberId!: number;
  memberProductId!: number;
  itemsFormGroup: FormGroup;
  rateFormGroup: FormGroup;
  confirmFormGroup: FormGroup;

  isMobile$: Observable<boolean> = this.breakpointObserver
    .observe([Breakpoints.Handset])
    .pipe(map((result) => result.matches));

  readonly stepperOrientation$: Observable<'horizontal' | 'vertical'> =
    this.isMobile$.pipe(
      map((isMobile) => (isMobile ? 'vertical' : 'horizontal'))
    );

  constructor() {
    this.itemsFormGroup = this.fb.group({});
    this.rateFormGroup = this.fb.group({
      selectedRateQuoteId: [null as number | null, Validators.required],
    });
    this.confirmFormGroup = this.fb.group({
      termsAccepted: [false, Validators.requiredTrue],
    });
  }

  async ngOnInit(): Promise<void> {
    // Check if opened as dialog
    if (this.dialogData) {
      this.memberProductId = this.dialogData.memberProductId;
      this.memberId = this.dialogData.memberId;
      await this.initializeFromDialogData();
    } else {
      // Opened as route - use existing route params logic
      this.route.params.subscribe(async (params) => {
        const memberId = params['memberId'] ? Number(params['memberId']) : null;
        const memberProductId = params['memberProductId']
          ? Number(params['memberProductId'])
          : null;
        if (memberId && memberProductId) {
          this.memberId = memberId;
          this.memberProductId = memberProductId;
          await this.initializeFromDialogData();
        } else {
          this.router.navigate(['/members']);
        }
      });
    }
  }

  private async initializeFromDialogData(): Promise<void> {
    if (!this.memberId || !this.memberProductId) {
      return;
    }
    const order = await this.apiService.getProductOrder(
      this.memberId,
      this.memberProductId
    );
    this.memberProductOrder.set(order);
    this.buildOrderItemGroups(order);
    this.itemsSaved.set(false);
    this.initializeShipmentFromOrder(order);
    this.currentStep.set(0);
  }

  private initializeShipmentFromOrder(order: IMemberProduct): void {
    const dialogShipmentId = this.dialogData?.shipmentId;
    const shipments = order.shipments ?? [];

    const existingShipmentId =
      dialogShipmentId ??
      (shipments.length > 0
        ? shipments[shipments.length - 1].shipmentId
        : undefined);

    if (existingShipmentId) {
      this.shipmentId.set(existingShipmentId);
      void this.loadShipmentDetails();
    }
  }

  private buildOrderItemGroups(order: IMemberProduct): void {
    const shipments = order.shipments ?? [];

    const groups: IOrderItemShipmentGroup[] = order.orderItems.map(
      (orderItem) => {
        const itemShipments: IOrderItemShipmentGroup['shipments'] = [];
        shipments.forEach((shipment) => {
          const shipmentItems = shipment.shipmentItems ?? [];
          const matchingItems = shipmentItems.filter(
            (shipmentItem) =>
              shipmentItem.memberProductOrderItemId ===
              orderItem.memberProductOrderItemId
          );

          if (matchingItems.length === 0) {
            return;
          }

          const quantityForItem = matchingItems.reduce(
            (sum, shipmentItem) => sum + shipmentItem.quantity,
            0
          );

          itemShipments.push({
            shipmentId: shipment.shipmentId,
            shipmentNumber: shipment.shipmentNumber,
            status: shipment.status,
            quantity: quantityForItem,
          });
        });

        return {
          orderItem: {
            memberProductOrderItemId: orderItem.memberProductOrderItemId,
            productName: orderItem.productName,
            quantity: orderItem.quantity,
            unitPrice: orderItem.unitPrice,
            totalAmount: orderItem.totalAmount,
          },
          quantity: orderItem.quantity,
          shipments: itemShipments,
        } satisfies IOrderItemShipmentGroup;
      }
    );

    this.orderItemGroups.set(groups);
  }

  private hasRemainingQuantityToShip(order: IMemberProduct): boolean {
    const shipments = (order.shipments ?? []).filter((s) => {
      const status = (s.status ?? '').toUpperCase();
      return status !== 'FAILED' && status !== 'CANCELLED';
    });
    return (order.orderItems ?? []).some((orderItem) => {
      const shippedQuantity = shipments.reduce((sum, shipment) => {
        const shipmentItems = shipment.shipmentItems ?? [];
        const qty = shipmentItems
          .filter(
            (si) =>
              si.memberProductOrderItemId === orderItem.memberProductOrderItemId
          )
          .reduce((s, si) => s + si.quantity, 0);
        return sum + qty;
      }, 0);
      return orderItem.quantity - shippedQuantity > 0;
    });
  }

  async loadShipmentDetails(): Promise<void> {
    const id = this.shipmentId();
    if (!id) return;

    this.loading.set(true);
    try {
      const details = await this.apiService.getShipmentDetails(id);
      this.shipmentDetails.set(details);
      this.navigateToStepByStatus(details.status);
    } catch (error: unknown) {
      this.handleError(error, 'Failed to load shipment details');
    } finally {
      this.loading.set(false);
    }
  }

  private navigateToStepByStatus(status: string): void {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case ShipmentStatusEnum.BOOKED:
      case ShipmentStatusEnum.IN_TRANSIT:
      case ShipmentStatusEnum.OUT_FOR_DELIVERY:
      case ShipmentStatusEnum.DELIVERED:
        this.currentStep.set(4);
        this.loadTracking();
        break;
      case ShipmentStatusEnum.FAILED:
        this.currentStep.set(3);
        break;
      case ShipmentStatusEnum.RATE_SELECTED:
        this.currentStep.set(3);
        this.loadRatesThenRestoreSelected();
        break;
      case ShipmentStatusEnum.RATE_REQUESTED:
        this.currentStep.set(2);
        this.loadRates();
        break;
      case ShipmentStatusEnum.DRAFT:
        this.currentStep.set(0);
        break;
    }
  }

  async onGetRates(): Promise<void> {
    const id = this.shipmentId();
    if (!id) return;

    this.loading.set(true);
    this.selectedRate.set(null);
    this.rateFormGroup.patchValue(
      { selectedRateQuoteId: null },
      { emitEvent: false }
    );
    try {
      const rateQuotes = await this.apiService.getRates(id);
      this.rates.set(rateQuotes);
      if (rateQuotes.length > 0) {
        // Defer so step 1's [completed] (rates().length > 0) is evaluated first in linear stepper
        setTimeout(() => this.currentStep.set(2), 0);
      } else {
        this.showError('No rate quotes available');
      }
    } catch (error: unknown) {
      this.handleError(error, 'Failed to get rate quotes');
    } finally {
      this.loading.set(false);
    }
  }

  async loadRates(): Promise<void> {
    const id = this.shipmentId();
    if (!id) return;

    this.loading.set(true);
    try {
      const rateQuotes = await this.apiService.getRates(id);
      this.rates.set(rateQuotes);
    } catch (error: unknown) {
      this.handleError(error, 'Failed to load rate quotes');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadRatesThenRestoreSelected(): Promise<void> {
    const id = this.shipmentId();
    const details = this.shipmentDetails();
    if (!id || !details) return;

    this.loading.set(true);
    try {
      const rateQuotes = await this.apiService.getRates(id);
      this.rates.set(rateQuotes);
      const selected = rateQuotes.find(
        (r) =>
          r.providerId === details.providerId &&
          (details.rateAmount == null || r.rateAmount === details.rateAmount)
      );
      if (selected) {
        this.selectedRate.set(selected);
        const quoteId = selected.rateQuoteId ?? null;
        this.rateFormGroup.patchValue(
          { selectedRateQuoteId: quoteId },
          { emitEvent: false }
        );
      }
    } catch (error: unknown) {
      this.handleError(error, 'Failed to load rate quotes');
    } finally {
      this.loading.set(false);
    }
  }

  onRateSelected(rate: IRateQuote | null): void {
    this.selectedRate.set(rate);
    // Do not patch the form here — the child already updated it. Patching would
    // trigger the child's valueChanges and cause an infinite emit loop.
  }

  hasItemsSelection(): boolean {
    const items = this.itemsFormGroup.get('items') as FormArray | null;
    if (!items || !Array.isArray(items.value)) return false;
    return items.value.some(
      (x: { selected?: boolean }) => x?.selected === true
    );
  }

  private getSelectedItemsForSave(): Array<{
    memberProductOrderItemId: number;
    quantity: number;
  }> {
    const items = this.itemsFormGroup.get('items') as FormArray | null;
    if (!items || !Array.isArray(items.value)) return [];
    const groups = this.orderItemGroups();
    return items.value
      .filter((item: { selected?: boolean }) => item?.selected === true)
      .map((item: { memberProductOrderItemId: number }) => {
        const group = groups.find(
          (g) =>
            g.orderItem.memberProductOrderItemId ===
            item.memberProductOrderItemId
        );
        return {
          memberProductOrderItemId: item.memberProductOrderItemId,
          quantity: group?.quantity ?? 0,
        };
      });
  }

  async onStep2Next(): Promise<void> {
    const items = this.getSelectedItemsForSave();
    if (items.length === 0) {
      this.showError('Please select at least one item to ship');
      return;
    }

    this.loading.set(true);
    try {
      let shipmentId = this.shipmentId();

      if (!shipmentId) {
        const order = await this.apiService.getProductOrder(
          this.memberId,
          this.memberProductId
        );
        if (!this.hasRemainingQuantityToShip(order)) {
          this.loading.set(false);
          this.dialog.open(AlertDialogComponent, {
            data: {
              title: 'Fully Shipped',
              message:
                'This product order is fully shipped. No additional shipments can be created.',
              alertType: 'info',
              positiveBtnTxt: 'OK',
            },
          });
          return;
        }
        const draft = await this.apiService.createDraft({
          memberProductId: this.memberProductId,
          items,
        });
        shipmentId = draft.shipmentId;
        this.shipmentId.set(shipmentId);
        this.shipmentDetails.set(draft);
      } else {
        const updatedDetails = await this.apiService.addItems(shipmentId, {
          items,
        });
        this.shipmentDetails.set(updatedDetails);
      }

      this.itemsSaved.set(true);
      await this.loadRates();
      this.currentStep.set(2);
    } catch (error: unknown) {
      this.handleError(error, 'Failed to save items');
    } finally {
      this.loading.set(false);
    }
  }

  canProceedToStep3(): boolean {
    return this.selectedRate() !== null && this.rateFormGroup.valid;
  }

  canProceedToStep4(): boolean {
    return this.selectedRate() !== null && this.confirmFormGroup.valid;
  }

  async onConfirmBooking(): Promise<void> {
    const id = this.shipmentId();
    const rate = this.selectedRate();
    const rateQuoteId = rate?.rateQuoteId;
    if (!id || !rate) {
      this.showError('Please select a rate first');
      return;
    }
    if (rateQuoteId == null) {
      this.showError('Invalid rate selection');
      return;
    }
    if (!this.confirmFormGroup.valid) {
      this.showError('Please accept the terms and conditions');
      return;
    }

    this.booking.set(true);
    try {
      const updatedDetails = await this.apiService.bookShipment(id, {
        rateQuoteId: Number(rateQuoteId),
      });
      this.shipmentDetails.set(updatedDetails);
      const statusUpper = (updatedDetails.status ?? '').toUpperCase();
      if (statusUpper === ShipmentStatusEnum.FAILED) {
        this.currentStep.set(3);
        this.showError(
          'Booking failed. Please try again or select a different rate.'
        );
      } else {
        this.currentStep.set(4);
        await this.loadTracking();
        this.snackBar.open('Shipment booked successfully', 'Close', {
          duration: 3000,
        });
      }
    } catch (error: unknown) {
      this.handleError(error, 'Failed to book shipment');
    } finally {
      this.booking.set(false);
    }
  }

  async onRetryBooking(): Promise<void> {
    const id = this.shipmentId();
    const rate = this.selectedRate();
    if (!id) return;

    this.booking.set(true);
    try {
      const payload =
        rate?.rateQuoteId != null
          ? { rateQuoteId: Number(rate.rateQuoteId) }
          : undefined;
      const updatedDetails = await this.apiService.retryBooking(id, payload);
      this.shipmentDetails.set(updatedDetails);
      const statusUpper = (updatedDetails.status ?? '').toUpperCase();
      if (statusUpper === ShipmentStatusEnum.FAILED) {
        this.currentStep.set(3);
        this.showError(
          'Retry failed. Please try again or select a different rate.'
        );
      } else {
        this.currentStep.set(4);
        await this.loadTracking();
        this.snackBar.open('Booking retry initiated', 'Close', {
          duration: 3000,
        });
      }
    } catch (error: unknown) {
      this.handleError(error, 'Failed to retry booking');
    } finally {
      this.booking.set(false);
    }
  }

  async loadTracking(): Promise<void> {
    const id = this.shipmentId();
    if (!id) return;

    this.loading.set(true);
    try {
      const tracking = await this.apiService.getTracking(id);
      this.trackingInfo.set(tracking);
    } catch (error: unknown) {
      this.handleError(error, 'Failed to load tracking information');
    } finally {
      this.loading.set(false);
    }
  }

  onRefreshTracking(): void {
    this.loadTracking();
  }

  onStepChange(event: StepperSelectionEvent): void {
    this.currentStep.set(event.selectedIndex);
    if (event.selectedIndex === 2 && this.rates().length === 0) {
      this.loadRates();
    } else if (event.selectedIndex === 4 && !this.trackingInfo()) {
      this.loadTracking();
    }
  }

  get showRetryButton(): boolean {
    const status = this.shipmentDetails()?.status.toUpperCase();
    return status === ShipmentStatusEnum.FAILED;
  }

  get isReadOnly(): boolean {
    const status = this.shipmentDetails()?.status.toUpperCase();
    return (
      status === ShipmentStatusEnum.IN_TRANSIT ||
      status === ShipmentStatusEnum.OUT_FOR_DELIVERY ||
      status === ShipmentStatusEnum.DELIVERED
    );
  }

  private getErrorMessage(error: unknown, defaultMessage: string): string {
    if (error instanceof Error) return error.message;
    const obj = error as { message?: string; error?: { message?: string } };
    const msg = obj?.message ?? obj?.error?.message;
    return typeof msg === 'string' ? msg : defaultMessage;
  }

  private handleError(error: unknown, defaultMessage: string): void {
    const message = this.getErrorMessage(error, defaultMessage);
    const isFullyShipped =
      message.toLowerCase().includes('fully shipped') ||
      message.toLowerCase().includes('no remaining quantity');
    this.dialog.open(AlertDialogComponent, {
      data: {
        title: isFullyShipped ? 'Fully Shipped' : 'Error',
        message,
        alertType: isFullyShipped ? 'info' : 'error',
        positiveBtnTxt: 'OK',
      },
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }
}
