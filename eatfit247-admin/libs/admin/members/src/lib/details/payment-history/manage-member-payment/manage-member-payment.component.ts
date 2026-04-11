import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { InputErrorComponent } from '@shared';
import {
  ICalculateTaxResponse,
  IDropdownItem,
  IMemberPayment,
  IMemberPaymentMasterData,
  InputLengthEnum,
  PaymentSourceEnum,
  PaymentStatusEnum
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';
import { PaymentFormService } from './payment-form.service';

export interface ManageMemberPaymentData {
  memberId: number;
  payment?: IMemberPayment;
}

@Component({
  selector: 'lib-manage-member-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatStepperModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    InputErrorComponent,
  ],
  templateUrl: './manage-member-payment.component.html',
  styleUrl: './manage-member-payment.component.scss',
})
export class ManageMemberPaymentComponent implements OnInit {
  private apiService: MembersApiService = inject(MembersApiService);
  private paymentFormService: PaymentFormService = inject(PaymentFormService);
  private fb: FormBuilder = inject(FormBuilder);
  private snackBar: MatSnackBar = inject(MatSnackBar);
  public dialogRef: MatDialogRef<ManageMemberPaymentComponent> = inject(
    MatDialogRef<ManageMemberPaymentComponent>
  );
  public data: ManageMemberPaymentData = inject(MAT_DIALOG_DATA);

  formGroup!: FormGroup;
  step1FormGroup!: FormGroup;
  masterData = signal<IMemberPaymentMasterData | null>(null);
  loading = signal(false);
  submitting = signal(false);
  calculatingTax = signal(false);
  creatingPaymentLink = signal(false);
  isEditMode = false;
  selectedIndex = signal(0);
  InputLengthEnum = InputLengthEnum;
  availableCurrencies = signal<IDropdownItem[]>([]);
  taxCalculationResult = signal<ICalculateTaxResponse | null>(null);
  paymentLink = signal<string | null>(null);
  paymentLinkId = signal<string | null>(null);
  supportedGateways = signal<
    Array<{
      franchisePaymentGatewayId: number;
      gatewayCode: string;
      gatewayName: string;
      providerCountryCode: string;
      currencyCode: string;
      isPrimary: boolean;
      supportsDomestic: boolean;
      supportsInternational: boolean;
    }>
  >([]);
  loadingGateways = signal(false);
  selectedGatewayId = signal<number | null>(null);

  constructor() {
    this.initializeForm();
    this.isEditMode = !!this.data.payment;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMasterData();
    if (this.isEditMode && this.data.payment) {
      this.loadData();
    }
    // Subscribe to program plan changes in step1FormGroup
    this.step1FormGroup
      .get('programPlanId')
      ?.valueChanges.subscribe((programPlanId) => {
        if (programPlanId) {
          this.loadProgramPlanFees(programPlanId);
        }
      });
  }

  private initializeForm(): void {
    const paymentDate = this.data.payment?.paymentDate;
    // Use enum value with fallback to string literal
    const defaultPaymentSource = PaymentSourceEnum?.MANUAL || 'MANUAL';
    // Step 1: Plan & Program Selection Form (mandatory fields)
    this.step1FormGroup = this.fb.group({
      programId: [null, [Validators.required]],
      programPlanId: [null, [Validators.required]],
      noOfCycle: [0, [Validators.required, Validators.min(1)]],
      noOfDaysInCycle: [0, [Validators.required, Validators.min(1)]],
      addressId: [null],
      billingAddressId: [null, [Validators.required]],
      gstNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      currencyCode: ['INR', [Validators.required]],
      orderAmount: [0, [Validators.required, Validators.min(0)]],
      discountAmount: [0, [Validators.required, Validators.min(0)]],
    });
    // Main form group (includes all fields)
    this.formGroup = this.fb.group({
      // Program & Plan Selection
      programId: [null, [Validators.required]],
      programPlanId: [null, [Validators.required]],
      noOfCycle: [0, [Validators.required, Validators.min(1)]],
      noOfDaysInCycle: [0, [Validators.required, Validators.min(1)]],
      // Billing & Address Information
      addressId: [null],
      billingAddressId: [null, [Validators.required]],
      gstNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      // Tax Configuration
      taxPercentageDisplay: [0], // For display only
      // Pricing & Amounts
      currencyCode: ['INR', [Validators.required]],
      orderAmount: [0, [Validators.required, Validators.min(0)]],
      discountAmount: [0, [Validators.required, Validators.min(0)]],
      // Payment Details
      paymentModeId: [null, []],
      paymentDate: [paymentDate, []],
      paymentStatusId: [null, []],
      transactionId: ['', [Validators.maxLength(InputLengthEnum.CHAR_250)]],
      // Payment Source & Gateway
      paymentSource: [defaultPaymentSource, [Validators.required]],
      gatewayProvider: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      gatewayOrderId: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
      gatewayPaymentId: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
      paymentLink: ['', [Validators.maxLength(InputLengthEnum.CHAR_500)]],
      franchisePaymentGatewayId: [null],
    });
    // Subscribe to changes to calculate tax and total from backend with debouncing
    this.formGroup
      .get('orderAmount')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => this.calculateTaxFromBackend());
    this.formGroup
      .get('discountAmount')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => this.calculateTaxFromBackend());
    this.formGroup
      .get('currencyCode')
      ?.valueChanges.subscribe(() => this.calculateTaxFromBackend());
    // Sync step1FormGroup with main formGroup
    this.step1FormGroup.get('programId')?.valueChanges.subscribe((val) => {
      this.formGroup.patchValue({ programId: val }, { emitEvent: false });
    });
    this.step1FormGroup.get('programPlanId')?.valueChanges.subscribe((val) => {
      this.formGroup.patchValue({ programPlanId: val }, { emitEvent: false });
      if (val) {
        this.loadProgramPlanFees(val);
      }
    });
    this.step1FormGroup.get('noOfCycle')?.valueChanges.subscribe((val) => {
      this.formGroup.patchValue({ noOfCycle: val }, { emitEvent: false });
    });
    this.step1FormGroup
      .get('noOfDaysInCycle')
      ?.valueChanges.subscribe((val) => {
        this.formGroup.patchValue(
          { noOfDaysInCycle: val },
          { emitEvent: false }
        );
      });
    this.step1FormGroup.get('addressId')?.valueChanges.subscribe((val) => {
      this.formGroup.patchValue({ addressId: val }, { emitEvent: false });
    });
    this.step1FormGroup
      .get('billingAddressId')
      ?.valueChanges.subscribe((val) => {
        this.formGroup.patchValue(
          { billingAddressId: val },
          { emitEvent: false }
        );
        this.calculateTaxFromBackend();
      });
    this.step1FormGroup.get('gstNumber')?.valueChanges.subscribe((val) => {
      this.formGroup.patchValue({ gstNumber: val }, { emitEvent: false });
    });
    this.step1FormGroup.get('currencyCode')?.valueChanges.subscribe((val) => {
      this.formGroup.patchValue({ currencyCode: val }, { emitEvent: false });
      const programPlanId = this.step1FormGroup.get('programPlanId')?.value;
      if (programPlanId && val) {
        this.updateFeeForCurrency(programPlanId, val);
      }
    });
    this.step1FormGroup
      .get('orderAmount')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((val) => {
        this.formGroup.patchValue({ orderAmount: val }, { emitEvent: false });
        this.calculateTaxFromBackend();
      });
    this.step1FormGroup
      .get('discountAmount')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((val) => {
        this.formGroup.patchValue(
          { discountAmount: val },
          { emitEvent: false }
        );
        this.calculateTaxFromBackend();
      });
    // Subscribe to payment source changes to update field validators
    this.formGroup
      .get('paymentSource')
      ?.valueChanges.subscribe((paymentSource) => {
        this.updatePaymentFieldValidators(paymentSource);
        // Clear payment link when payment source changes
        this.paymentLink.set(null);
        this.paymentLinkId.set(null);
        this.formGroup.patchValue(
          {
            paymentLink: '',
            gatewayOrderId: '',
          },
          { emitEvent: false }
        );
        // Load gateways when switching to gateway payment
        if (
          paymentSource === PaymentSourceEnum?.PAYMENT_GATEWAY ||
          paymentSource === 'PAYMENT_GATEWAY'
        ) {
          this.loadSupportedGateways();
        }
      });
    // Subscribe to currency changes to reload gateways
    this.step1FormGroup.get('currencyCode')?.valueChanges.subscribe(() => {
      if (
        this.formGroup.get('paymentSource')?.value ===
          PaymentSourceEnum?.PAYMENT_GATEWAY ||
        this.formGroup.get('paymentSource')?.value === 'PAYMENT_GATEWAY'
      ) {
        this.loadSupportedGateways();
      }
    });
    // Initialize validators based on default payment source
    this.updatePaymentFieldValidators(defaultPaymentSource);
  }

  /**
   * Update validators for payment fields based on payment source
   */
  private updatePaymentFieldValidators(paymentSource: string): void {
    const isManual =
      paymentSource === PaymentSourceEnum?.MANUAL || paymentSource === 'MANUAL';
    const paymentModeIdControl = this.formGroup.get('paymentModeId');
    const paymentDateControl = this.formGroup.get('paymentDate');
    const paymentStatusIdControl = this.formGroup.get('paymentStatusId');
    const transactionIdControl = this.formGroup.get('transactionId');
    if (isManual) {
      // Make fields required for MANUAL payment source
      paymentModeIdControl?.setValidators([Validators.required]);
      paymentDateControl?.setValidators([Validators.required]);
      paymentStatusIdControl?.setValidators([Validators.required]);
      transactionIdControl?.setValidators([
        Validators.required,
        Validators.maxLength(InputLengthEnum.CHAR_250),
      ]);
    } else {
      // Make fields optional for RAZORPAY payment source
      paymentModeIdControl?.setValidators([]);
      paymentDateControl?.setValidators([]);
      paymentStatusIdControl?.setValidators([]);
      transactionIdControl?.setValidators([
        Validators.maxLength(InputLengthEnum.CHAR_250),
      ]);
    }
    // Update validity
    paymentModeIdControl?.updateValueAndValidity({ emitEvent: false });
    paymentDateControl?.updateValueAndValidity({ emitEvent: false });
    paymentStatusIdControl?.updateValueAndValidity({ emitEvent: false });
    transactionIdControl?.updateValueAndValidity({ emitEvent: false });
  }

  async loadMasterData(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.apiService.getPaymentMasterData(
        this.data.memberId
      );
      this.masterData.set(res);
      // Calculate tax to update tax percentage display
      this.calculateTaxFromBackend();
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.loading.set(false);
    }
  }

  async calculateTaxFromBackend(): Promise<void> {
    const formData = this.paymentFormService.getPaymentFormData(
      this.formGroup,
      this.step1FormGroup
    );
    if (
      !formData.programPlanId ||
      !formData.currencyCode ||
      !formData.billingAddressId
    ) {
      this.taxCalculationResult.set(null);
      return;
    }
    this.calculatingTax.set(true);
    try {
      const result = await this.paymentFormService.calculateTax(
        this.data.memberId,
        formData
      );
      this.taxCalculationResult.set(result);
      if (result) {
        // Update tax percentage display
        this.formGroup.patchValue(
          {
            taxPercentageDisplay: result.taxPercentage,
          },
          { emitEvent: false }
        );
      }
    } catch (error) {
      this.taxCalculationResult.set(null);
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.calculatingTax.set(false);
    }
  }

  async onStepperSelectionChange(event: StepperSelectionEvent): Promise<void> {
    this.selectedIndex.set(event.selectedIndex);
    // When moving to step 2, ensure tax is calculated
    if (event.selectedIndex === 1) {
      this.calculateTaxFromBackend();
    }
    // When moving to step 3, load gateways if gateway payment
    if (event.selectedIndex === 2) {
      const paymentSource = this.formGroup.get('paymentSource')?.value;
      if (
        paymentSource === PaymentSourceEnum?.PAYMENT_GATEWAY ||
        paymentSource === 'PAYMENT_GATEWAY'
      ) {
        if (this.supportedGateways().length === 0) {
          await this.loadSupportedGateways();
        }
      }
    }
  }

  canProceedToStep2(): boolean {
    return this.step1FormGroup?.valid ?? false;
  }

  canProceedToStep3(): boolean {
    // Step 3 is always accessible after step 2
    // Validation happens in step 3 itself
    return true;
  }

  isManualPaymentSource(): boolean {
    const paymentSource = this.formGroup.get('paymentSource')?.value;
    return paymentSource === PaymentSourceEnum?.MANUAL;
  }

  isPaymentLinkRequiredAndGenerated(): boolean {
    const paymentSource = this.formGroup.get('paymentSource')?.value;
    const isPaymentGateway =
      paymentSource === PaymentSourceEnum?.PAYMENT_GATEWAY ||
      paymentSource === 'PAYMENT_GATEWAY';
    // If payment source is PAYMENT_GATEWAY, payment link must be generated
    if (isPaymentGateway) {
      return !!this.paymentLink() && this.paymentLink()!.trim().length > 0;
    }
    // For other payment sources, payment link is not required
    return true;
  }

  async loadSupportedGateways(): Promise<void> {
    const currencyCode =
      this.step1FormGroup?.get('currencyCode')?.value ||
      this.formGroup.get('currencyCode')?.value ||
      'INR';
    if (!currencyCode) {
      return;
    }
    this.loadingGateways.set(true);
    try {
      const gateways = await this.apiService.getSupportedPaymentGateways(
        this.data.memberId,
        currencyCode
      );
      this.supportedGateways.set(gateways);
      // Auto-select primary gateway if available
      const primaryGateway = gateways.find((g) => g.isPrimary);
      if (primaryGateway && !this.selectedGatewayId()) {
        this.selectedGatewayId.set(primaryGateway.franchisePaymentGatewayId);
        this.formGroup.patchValue({
          franchisePaymentGatewayId: primaryGateway.franchisePaymentGatewayId,
        });
      }
    } catch (error) {
      this.supportedGateways.set([]);
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.loadingGateways.set(false);
    }
  }

  async createPaymentLinkIfNeeded(): Promise<void> {
    if (this.paymentLink()) {
      return;
    }
    const totalAmount = this.totalAmount;
    if (totalAmount <= 0) {
      this.snackBar.open('Invalid amount for payment link', 'Close', {
        duration: 3000,
      });
      return;
    }
    const selectedGatewayId =
      this.formGroup.get('franchisePaymentGatewayId')?.value ||
      this.selectedGatewayId();
    if (!selectedGatewayId) {
      this.snackBar.open('Please select a payment gateway', 'Close', {
        duration: 3000,
      });
      return;
    }
    this.creatingPaymentLink.set(true);
    try {
      const currencyCode =
        this.step1FormGroup?.get('currencyCode')?.value ||
        this.formGroup.get('currencyCode')?.value ||
        'INR';
      const programId =
        this.step1FormGroup?.get('programId')?.value ||
        this.formGroup.get('programId')?.value;
      const programPlanId =
        this.step1FormGroup?.get('programPlanId')?.value ||
        this.formGroup.get('programPlanId')?.value;
      const programName =
        this.programOptions.find((p) => p.id === programId)?.label || '';
      const planName =
        this.programPlanOptions.find((p) => p.id === programPlanId)?.label ||
        '';
      const result = await this.paymentFormService.createPaymentLink(
        this.data.memberId,
        totalAmount,
        currencyCode,
        selectedGatewayId,
        programId,
        programPlanId,
        programName,
        planName
      );
      this.paymentLink.set(result.shortUrl);
      this.paymentLinkId.set(result.id);
      this.formGroup.patchValue({
        paymentLink: result.shortUrl,
        gatewayProvider: result.gatewayCode,
        gatewayOrderId: result.id,
        paymentStatusId: PaymentStatusEnum.PENDING,
      });
    } catch (error) {
      this.snackBar.open('Failed to create payment link', 'Close', {
        duration: 3000,
      });
    } finally {
      this.creatingPaymentLink.set(false);
    }
  }

  onGatewaySelectionChange(gatewayId: number): void {
    this.selectedGatewayId.set(gatewayId);
    this.formGroup.patchValue({
      franchisePaymentGatewayId: gatewayId,
    });
    // Clear the existing payment link when gateway changes
    this.paymentLink.set(null);
    this.paymentLinkId.set(null);
    this.formGroup.patchValue({
      paymentLink: '',
      gatewayOrderId: '',
    });
  }

  async copyPaymentLink(): Promise<void> {
    const link = this.paymentLink();
    if (!link) {
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      this.snackBar.open('Payment link copied to clipboard!', 'Close', {
        duration: 3000,
      });
    } catch (error) {
      this.snackBar.open('Failed to copy link', 'Close', { duration: 3000 });
    }
  }

  async sharePaymentLink(): Promise<void> {
    const link = this.paymentLink();
    if (!link) {
      return;
    }
    try {
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: 'Payment Link',
          text: 'Please use this link to complete your payment',
          url: link,
        });
        this.snackBar.open('Payment link shared!', 'Close', { duration: 3000 });
      } else {
        // Fallback to copy if Web Share API is not available
        await this.copyPaymentLink();
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        // Fallback to copy on error
        await this.copyPaymentLink();
      }
    }
  }

  private loadData(): void {
    if (this.data.payment) {
      const formValues = this.paymentFormService.transformPaymentToFormValues(
        this.data.payment
      );
      this.formGroup.patchValue(formValues, { emitEvent: false });
      // Update validators based on payment source
      this.updatePaymentFieldValidators(formValues.paymentSource);
      // Calculate tax from the backend after loading data
      setTimeout(() => this.calculateTaxFromBackend(), 100);
      // Sync step1FormGroup
      this.step1FormGroup.patchValue(
        {
          programId: formValues.programId,
          programPlanId: formValues.programPlanId,
          noOfCycle: formValues.noOfCycle,
          noOfDaysInCycle: formValues.noOfDaysInCycle,
          addressId: formValues.addressId,
          billingAddressId: formValues.billingAddressId,
          gstNumber: formValues.gstNumber,
          currencyCode: formValues.currencyCode,
          orderAmount: formValues.orderAmount,
          discountAmount: formValues.discountAmount,
        },
        { emitEvent: false }
      );
      // Set payment link if exists
      if (formValues.paymentLink) {
        this.paymentLink.set(formValues.paymentLink);
      }
      if (formValues.gatewayOrderId) {
        this.paymentLinkId.set(formValues.gatewayOrderId);
      }
    }
  }

  async onSubmit(): Promise<void> {
    // Validate both forms
    if (this.formGroup.valid && this.step1FormGroup?.valid) {
      this.submitting.set(true);
      try {
        if (!this.isManualPaymentSource()) {
          if (
            !this.formGroup.value.paymentLink ||
            this.formGroup.value.paymentLink.length === 0
          ) {
            this.snackBar.open(
              'Payment link not generated, order can not be placed',
              'Close',
              {
                duration: 3000,
              }
            );
            return;
          }
        }
        const formValue = this.paymentFormService.transformFormToPaymentPayload(
          this.data.memberId,
          this.formGroup,
          this.step1FormGroup
        );
        if (this.isEditMode && this.data.payment?.memberPaymentId) {
          await this.apiService.updatePayment(
            this.data.memberId,
            this.data.payment.memberPaymentId,
            formValue
          );
        } else {
          await this.apiService.createPayment(this.data.memberId, formValue);
        }
        this.dialogRef.close(true);
      } catch (error) {
        this.snackBar.open('Failed to save payment. Please check the form and try again.', 'Close', {
          duration: 5000,
        });
      } finally {
        this.submitting.set(false);
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  get paymentModeOptions(): IDropdownItem[] {
    return this.masterData()?.paymentMode || [];
  }

  get programOptions(): IDropdownItem[] {
    return this.masterData()?.program || [];
  }

  get programPlanOptions(): IDropdownItem[] {
    return this.masterData()?.programPlan || [];
  }

  get paymentStatusOptions(): IDropdownItem[] {
    return this.masterData()?.paymentStatus || [];
  }

  get addressOptions(): IDropdownItem[] {
    const addresses = this.masterData()?.addresses || [];
    return this.paymentFormService.transformAddressesToDropdown(addresses);
  }

  get paymentSourceOptions(): IDropdownItem[] {
    return this.masterData()?.paymentSource || [];
  }

  async loadProgramPlanFees(programPlanId: number): Promise<void> {
    try {
      const programPlan = await this.apiService.getProgramPlanDetails(
        this.data.memberId,
        programPlanId
      );
      // Update available currencies from program plan fees
      if (
        programPlan.programPlanFees &&
        programPlan.programPlanFees.length > 0
      ) {
        const currencies =
          this.paymentFormService.transformFeesToCurrencyDropdown(
            programPlan.programPlanFees
          );
        this.availableCurrencies.set(currencies);
      }
      // Get default currency from master data or use first fee's currency
      const defaultCurrency =
        programPlan.programPlanFees && programPlan.programPlanFees.length > 0
          ? programPlan.programPlanFees[0].currencyCode
          : 'INR';
      // Find fee for default currency
      const fee =
        programPlan.programPlanFees?.find(
          (f) => f.currencyCode === defaultCurrency
        ) || programPlan.programPlanFees?.[0];
      if (fee) {
        // Auto-populate individual fields with plan details
        this.step1FormGroup.patchValue(
          {
            noOfCycle: programPlan.noOfCycle,
            noOfDaysInCycle: programPlan.noOfDaysInCycle,
            currencyCode: fee.currencyCode,
            orderAmount: fee.fees,
            discountAmount: 0,
          },
          { emitEvent: false }
        );
        this.formGroup.patchValue(
          {
            noOfCycle: programPlan.noOfCycle,
            noOfDaysInCycle: programPlan.noOfDaysInCycle,
            currencyCode: fee.currencyCode,
            orderAmount: fee.fees,
            discountAmount: 0,
          },
          { emitEvent: false }
        );
        // Calculate tax after loading program plan fees
        setTimeout(() => this.calculateTaxFromBackend(), 100);
      }
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  get taxableAmount(): number {
    const result = this.taxCalculationResult();
    if (result) {
      return result.taxableAmount;
    }
    // Fallback to 0 if calculation not available
    return 0;
  }

  get taxAmount(): number {
    const result = this.taxCalculationResult();
    if (result) {
      return result.taxAmount;
    }
    // Fallback to 0 if calculation not available
    return 0;
  }

  get totalAmount(): number {
    const result = this.taxCalculationResult();
    if (result) {
      return result.totalAmount;
    }
    // Fallback calculation if backend result not available
    const formData = this.paymentFormService.getPaymentFormData(
      this.formGroup,
      this.step1FormGroup
    );
    return formData.orderAmount - formData.discountAmount;
  }

  get taxPercentage(): number {
    const result = this.taxCalculationResult();
    if (result) {
      return result.taxPercentage;
    }
    // Fallback to 0 if calculation not available
    return 0;
  }

  get taxObj(): Record<
    string,
    { amount: number; taxPercentage: number }
  > | null {
    const result = this.taxCalculationResult();
    return result?.taxObj || null;
  }

  get taxType(): string | undefined {
    const result = this.taxCalculationResult();
    return result?.taxType;
  }

  get invoiceNote(): string | undefined {
    const result = this.taxCalculationResult();
    return result?.invoiceNote;
  }

  get currencyOptions(): IDropdownItem[] {
    // Return currencies from the selected program plan, or default currencies
    const currencies = this.availableCurrencies();
    if (currencies.length > 0) {
      return currencies;
    }
    // Default currencies if no program plan selected
    return [
      { id: 'INR', label: 'INR', selected: false },
      { id: 'USD', label: 'USD', selected: false },
      { id: 'EUR', label: 'EUR', selected: false },
    ];
  }

  async updateFeeForCurrency(
    programPlanId: number,
    currencyCode: string
  ): Promise<void> {
    try {
      const programPlan = await this.apiService.getProgramPlanDetails(
        this.data.memberId,
        programPlanId
      );
      const fee = programPlan.programPlanFees?.find(
        (f) => f.currencyCode === currencyCode
      );
      if (fee) {
        if (this.step1FormGroup) {
          this.step1FormGroup.patchValue(
            {
              orderAmount: fee.fees,
            },
            { emitEvent: false }
          );
        }
        this.formGroup.patchValue(
          {
            orderAmount: fee.fees,
          },
          { emitEvent: false }
        );
        this.calculateTaxFromBackend();
      }
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }
}
