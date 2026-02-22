import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, map } from 'rxjs';
import { ShipmentStatusEnum, IShipmentDetails, IRateQuote, ITrackingInfo } from '@eatfit247-shared-lib';
import { DeliveryApiService } from './api.service';
import { OverviewStepComponent } from './steps/overview-step.component';
import { ItemsStepComponent } from './steps/items-step.component';
import { RateStepComponent } from './steps/rate-step.component';
import { ConfirmStepComponent } from './steps/confirm-step.component';
import { TrackingStepComponent } from './steps/tracking-step.component';
import { LoaderComponent, AlertDialogComponent } from '@shared';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ShipmentFlowData } from './models/shipment.model';

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
  private readonly dialogRef = inject(MatDialogRef<ShipmentFlowComponent>, { optional: true });
  private readonly dialogData = inject<ShipmentFlowData | null>(MAT_DIALOG_DATA, { optional: true });

  shipmentDetails = signal<IShipmentDetails | null>(null);
  rates = signal<IRateQuote[]>([]);
  selectedRate = signal<IRateQuote | null>(null);
  trackingInfo = signal<ITrackingInfo | null>(null);
  loading = signal(false);
  booking = signal(false);
  currentStep = signal(0);
  shipmentId = signal<number | null>(null);
  itemsFormGroup: FormGroup;
  rateFormGroup: FormGroup;
  confirmFormGroup: FormGroup;

  isMobile$: Observable<boolean> = this.breakpointObserver
    .observe([Breakpoints.Handset])
    .pipe(map((result) => result.matches));

  readonly stepperOrientation$: Observable<'horizontal' | 'vertical'> = this.isMobile$.pipe(
    map((isMobile) => (isMobile ? 'vertical' : 'horizontal'))
  );

  constructor() {
    this.itemsFormGroup = this.fb.group({});
    this.rateFormGroup = this.fb.group({
      selectedProvider: [null, Validators.required],
    });
    this.confirmFormGroup = this.fb.group({
      termsAccepted: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    // Check if opened as dialog
    if (this.dialogData) {
      this.initializeFromDialogData();
    } else {
      // Opened as route - use existing route params logic
      this.route.params.subscribe((params) => {
        const id = params['id'] ? Number(params['id']) : null;
        if (id) {
          this.shipmentId.set(id);
          this.loadShipmentDetails();
        } else {
          this.showError('Shipment ID is required');
          this.router.navigate(['/members']);
        }
      });
    }
  }

  private async initializeFromDialogData(): Promise<void> {
    if (!this.dialogData) return;

    // If shipmentId is provided, use it directly
    if (this.dialogData.shipmentId) {
      this.shipmentId.set(this.dialogData.shipmentId);
      await this.loadShipmentDetails();
      return;
    }

    // If memberProductId is provided, create a draft shipment first
    if (this.dialogData.memberProductId) {
      this.loading.set(true);
      try {
        const draftShipment = await this.apiService.createDraft(this.dialogData.memberProductId);
        this.shipmentId.set(draftShipment.shipmentId);
        this.shipmentDetails.set(draftShipment);
        this.navigateToStepByStatus(draftShipment.status);
      } catch (error: unknown) {
        this.handleError(error, 'Failed to create draft shipment');
        // Close dialog on error
        if (this.dialogRef) {
          this.dialogRef.close(false);
        }
      } finally {
        this.loading.set(false);
      }
      return;
    }

    // No valid data provided
    this.showError('Either shipmentId or memberProductId is required');
    if (this.dialogRef) {
      this.dialogRef.close(false);
    }
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
    if (
      statusUpper === ShipmentStatusEnum.BOOKED ||
      statusUpper === ShipmentStatusEnum.IN_TRANSIT ||
      statusUpper === ShipmentStatusEnum.OUT_FOR_DELIVERY ||
      statusUpper === ShipmentStatusEnum.DELIVERED
    ) {
      this.currentStep.set(4);
      this.loadTracking();
    } else if (statusUpper === ShipmentStatusEnum.FAILED) {
      this.currentStep.set(3);
    } else if (statusUpper === ShipmentStatusEnum.RATE_SELECTED) {
      this.currentStep.set(3);
    } else if (statusUpper === ShipmentStatusEnum.RATE_REQUESTED) {
      this.currentStep.set(2);
      this.loadRates();
    } else if (statusUpper === ShipmentStatusEnum.DRAFT) {
      this.currentStep.set(1);
    }
  }

  async onGetRates(): Promise<void> {
    const id = this.shipmentId();
    if (!id) return;

    this.loading.set(true);
    try {
      const rateQuotes = await this.apiService.getRates(id);
      this.rates.set(rateQuotes);
      if (rateQuotes.length > 0) {
        this.currentStep.set(2);
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

  onRateSelected(rate: IRateQuote | null): void {
    this.selectedRate.set(rate);
    if (rate) {
      this.rateFormGroup.patchValue({ selectedProvider: rate.providerId });
    }
  }

  async onItemsSaved(items: Array<{ memberProductOrderItemId: number; quantity: number }>): Promise<void> {
    const id = this.shipmentId();
    if (!id) return;

    this.loading.set(true);
    try {
      const updatedDetails = await this.apiService.addItems(id, { items });
      this.shipmentDetails.set(updatedDetails);
      this.snackBar.open('Items saved successfully', 'Close', { duration: 3000 });
    } catch (error: unknown) {
      this.handleError(error, 'Failed to save items');
    } finally {
      this.loading.set(false);
    }
  }

  canProceedToStep3(): boolean {
    return this.selectedRate() !== null && this.rateFormGroup.valid;
  }

  async onSelectRate(): Promise<void> {
    const id = this.shipmentId();
    const rate = this.selectedRate();
    if (!id || !rate) {
      this.showError('Please select a rate first');
      return;
    }

    this.loading.set(true);
    try {
      const updatedDetails = await this.apiService.selectRate(id, rate.providerId);
      this.shipmentDetails.set(updatedDetails);
      this.currentStep.set(3);
      this.snackBar.open('Rate selected successfully', 'Close', { duration: 3000 });
    } catch (error: unknown) {
      this.handleError(error, 'Failed to select rate');
    } finally {
      this.loading.set(false);
    }
  }

  canProceedToStep4(): boolean {
    return this.selectedRate() !== null && this.confirmFormGroup.valid;
  }

  async onConfirmBooking(): Promise<void> {
    const id = this.shipmentId();
    if (!id || !this.selectedRate()) {
      this.showError('Please select a rate first');
      return;
    }
    if (!this.confirmFormGroup.valid) {
      this.showError('Please accept the terms and conditions');
      return;
    }

    this.booking.set(true);
    try {
      const updatedDetails = await this.apiService.bookShipment(id);
      this.shipmentDetails.set(updatedDetails);
      this.currentStep.set(4);
      await this.loadTracking();
      this.snackBar.open('Shipment booked successfully', 'Close', { duration: 3000 });
    } catch (error: unknown) {
      this.handleError(error, 'Failed to book shipment');
    } finally {
      this.booking.set(false);
    }
  }

  async onRetryBooking(): Promise<void> {
    const id = this.shipmentId();
    if (!id) return;

    this.booking.set(true);
    try {
      const updatedDetails = await this.apiService.retryBooking(id);
      this.shipmentDetails.set(updatedDetails);
      this.currentStep.set(4);
      await this.loadTracking();
      this.snackBar.open('Booking retry initiated', 'Close', { duration: 3000 });
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

  private handleError(error: unknown, defaultMessage: string): void {
    const message = error instanceof Error ? error.message : defaultMessage;
    this.dialog.open(AlertDialogComponent, {
      data: {
        title: 'Error',
        message,
        alertType: 'error',
        positiveBtnTxt: 'OK',
      },
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }
}
