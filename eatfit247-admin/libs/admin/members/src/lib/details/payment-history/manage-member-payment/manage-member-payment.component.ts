import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { InputErrorComponent } from '@shared';
import {
  IManageMemberPayment,
  IMemberPayment,
  IMemberPaymentMasterData,
  IDropdownItem,
  InputLengthEnum,
  PaymentSourceEnum
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';

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
    InputErrorComponent
  ],
  templateUrl: './manage-member-payment.component.html',
  styleUrl: './manage-member-payment.component.scss'
})
export class ManageMemberPaymentComponent implements OnInit {
  formGroup!: FormGroup;
  masterData = signal<IMemberPaymentMasterData | null>(null);
  loading = signal(false);
  submitting = signal(false);
  isEditMode = false;
  InputLengthEnum = InputLengthEnum;
  PaymentSourceEnum = PaymentSourceEnum;
  availableCurrencies = signal<IDropdownItem[]>([]);

  constructor(
    public dialogRef: MatDialogRef<ManageMemberPaymentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ManageMemberPaymentData,
    private apiService: MembersApiService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
    this.isEditMode = !!data.payment;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMasterData();
    if (this.isEditMode && this.data.payment) {
      this.loadData();
    }
    // Subscribe to program plan changes
    this.formGroup.get('programPlanId')?.valueChanges.subscribe((programPlanId) => {
      if (programPlanId) {
        this.loadProgramPlanFees(programPlanId);
      }
    });
    // Subscribe to currency changes to update fee
    this.formGroup.get('currencyCode')?.valueChanges.subscribe((currencyCode) => {
      const programPlanId = this.formGroup.get('programPlanId')?.value;
      if (programPlanId && currencyCode) {
        this.updateFeeForCurrency(programPlanId, currencyCode);
      }
    });
  }

  private initializeForm(): void {
    const paymentDate = this.data.payment?.paymentDate;
    // Use enum value with fallback to string literal
    const defaultPaymentSource = PaymentSourceEnum?.MANUAL || 'MANUAL';
    this.formGroup = this.fb.group({
      paymentModeId: [null, [Validators.required]],
      programId: [null, [Validators.required]],
      programPlanId: [null, [Validators.required]],
      // Individual payment fields - cycle details
      noOfCycle: [0, [Validators.required, Validators.min(1)]],
      noOfDaysInCycle: [0, [Validators.required, Validators.min(1)]],
      addressId: [null],
      billingAddressId: [null],
      transactionId: ['', [Validators.maxLength(InputLengthEnum.CHAR_250)]],
      paymentDate: [paymentDate, [Validators.required]],
      paymentStatusId: [null, [Validators.required]],
      isTaxApplicable: [false, [Validators.required]],
      taxPercentageDisplay: [0], // For display only
      isPlanFeesIncludedTax: [false, [Validators.required]],
      // Individual payment fields
      currencyCode: ['INR', [Validators.required]],
      orderAmount: [0, [Validators.required, Validators.min(0)]],
      discountAmount: [0, [Validators.required, Validators.min(0)]],
      gstNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      paymentSource: [defaultPaymentSource, [Validators.required]],
      gatewayProvider: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      gatewayOrderId: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
      gatewayPaymentId: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
      paymentLink: ['', [Validators.maxLength(InputLengthEnum.CHAR_500)]]
    });
    // Subscribe to changes to calculate tax and total
    this.formGroup.get('orderAmount')?.valueChanges.subscribe(() => this.calculateAmounts());
    this.formGroup.get('discountAmount')?.valueChanges.subscribe(() => this.calculateAmounts());
    this.formGroup.get('isTaxApplicable')?.valueChanges.subscribe((value) => {
      this.updateTaxPercentageDisplay(value);
      this.calculateAmounts();
    });
    this.formGroup.get('isPlanFeesIncludedTax')?.valueChanges.subscribe(() => this.calculateAmounts());
  }

  async loadMasterData(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.apiService.getPaymentMasterData(this.data.memberId);
      this.masterData.set(res);
      // Update tax percentage display based on current tax applicable value
      this.updateTaxPercentageDisplay(this.formGroup.get('isTaxApplicable')?.value);
    } catch (error) {
      console.error('Error loading master data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  updateTaxPercentageDisplay(isTaxApplicable: boolean): void {
    const taxPercentage = isTaxApplicable ? 18 : 0;
    this.formGroup.patchValue({
      taxPercentageDisplay: taxPercentage
    }, { emitEvent: false });
  }

  private loadData(): void {
    if (this.data.payment) {
      const paymentObj = this.data.payment.paymentObj as any;
      this.formGroup.patchValue({
        paymentModeId: this.data.payment.paymentModeId || null,
        programId: this.data.payment.programId || null,
        programPlanId: this.data.payment.programPlanId || null,
        addressId: this.data.payment.addressId || null,
        billingAddressId: this.data.payment.billingAddressId || null,
        transactionId: this.data.payment.transactionId || '',
        paymentDate: this.data.payment.paymentDate,
        paymentStatusId: this.data.payment.paymentStatusId || null,
        isTaxApplicable: this.data.payment.isTaxApplicable || false,
        noOfCycle: paymentObj?.noOfCycle || this.data.payment.noOfCycle || 0,
        noOfDaysInCycle: paymentObj?.noOfDaysInCycle || this.data.payment.noOfDaysInCycle || 0,
        currencyCode: paymentObj?.currencyCode || 'INR',
        orderAmount: paymentObj?.orderAmount || this.data.payment.orderAmount || 0,
        discountAmount: paymentObj?.discountAmount || this.data.payment.discountAmount || 0,
        gstNumber: this.data.payment.gstNumber || '',
        paymentSource: (this.data.payment as any).paymentSource || PaymentSourceEnum?.MANUAL || 'MANUAL',
        gatewayProvider: (this.data.payment as any).gatewayProvider || '',
        gatewayOrderId: (this.data.payment as any).gatewayOrderId || '',
        gatewayPaymentId: (this.data.payment as any).gatewayPaymentId || '',
        paymentLink: (this.data.payment as any).paymentLink || ''
      }, { emitEvent: false });
      // Update tax percentage display after loading data
      this.updateTaxPercentageDisplay(this.data.payment.isTaxApplicable || false);
      this.calculateAmounts();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.valid) {
      this.submitting.set(true);
      try {
        // Build paymentObj from individual fields
        const paymentObj = {
          orderAmount: Number(this.formGroup.value.orderAmount) || 0,
          discountAmount: Number(this.formGroup.value.discountAmount) || 0,
          noOfCycle: Number(this.formGroup.value.noOfCycle) || 0,
          noOfDaysInCycle: Number(this.formGroup.value.noOfDaysInCycle) || 0,
          currencyCode: this.formGroup.value.currencyCode || 'INR',
          taxAmount: this.taxAmount,
          totalAmount: this.totalAmount,
          taxPercentage: 18,
          isPlanFeesIncludedTax: this.formGroup.value.isPlanFeesIncludedTax || false
        };
        const formValue: IManageMemberPayment = {
          memberId: this.data.memberId,
          paymentModeId: this.formGroup.value.paymentModeId,
          programPlanId: this.formGroup.value.programPlanId,
          programId: this.formGroup.value.programId,
          addressId: this.formGroup.value.addressId || null,
          billingAddressId: this.formGroup.value.billingAddressId || null,
          transactionId: this.formGroup.value.transactionId?.trim() || undefined,
          paymentDate: this.formGroup.value.paymentDate,
          paymentStatusId: this.formGroup.value.paymentStatusId,
          isTaxApplicable: this.formGroup.value.isTaxApplicable,
          paymentObj: paymentObj,
          gstNumber: this.formGroup.value.gstNumber?.trim() || undefined
        };
        // Add gateway fields if payment source is not MANUAL
        const manualSource = PaymentSourceEnum?.MANUAL || 'MANUAL';
        if (this.formGroup.value.paymentSource !== manualSource) {
          (formValue as any).paymentSource = this.formGroup.value.paymentSource;
          (formValue as any).gatewayProvider = this.formGroup.value.gatewayProvider || null;
          (formValue as any).gatewayOrderId = this.formGroup.value.gatewayOrderId || null;
          (formValue as any).gatewayPaymentId = this.formGroup.value.gatewayPaymentId || null;
          (formValue as any).paymentLink = this.formGroup.value.paymentLink || null;
        }
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
        console.error('Error saving payment:', error);
        alert('Failed to save payment. Please check the form and try again.');
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
    return addresses.map((addr) => ({
      id: addr.addressId,
      label: `${addr.postalAddress}, ${addr.cityVillage}, ${addr.pinCode}`,
      selected: false
    }));
  }

  get paymentSourceOptions(): IDropdownItem[] {
    return this.masterData()?.paymentSource || [];
  }

  get isGatewayPayment(): boolean {
    const manualSource = PaymentSourceEnum?.MANUAL || 'MANUAL';
    return this.formGroup.get('paymentSource')?.value !== manualSource;
  }

  async loadProgramPlanFees(programPlanId: number): Promise<void> {
    try {
      const programPlan = await this.apiService.getProgramPlanDetails(this.data.memberId, programPlanId);
      // Update available currencies from program plan fees
      if (programPlan.programPlanFees && programPlan.programPlanFees.length > 0) {
        const currencies = programPlan.programPlanFees.map(fee => ({
          id: fee.currencyCode,
          label: fee.currencyCode,
          selected: false
        }));
        this.availableCurrencies.set(currencies);
      }
      // Get default currency from master data or use first fee's currency
      const defaultCurrency = programPlan.programPlanFees && programPlan.programPlanFees.length > 0
        ? programPlan.programPlanFees[0].currencyCode
        : 'INR';
      // Find fee for default currency
      const fee = programPlan.programPlanFees?.find(f => f.currencyCode === defaultCurrency)
        || programPlan.programPlanFees?.[0];
      if (fee) {
        // Auto-populate individual fields with plan details
        this.formGroup.patchValue({
          noOfCycle: programPlan.noOfCycle,
          noOfDaysInCycle: programPlan.noOfDaysInCycle,
          currencyCode: fee.currencyCode,
          orderAmount: fee.fees,
          discountAmount: 0
        }, { emitEvent: false });
        this.calculateAmounts();
      }
    } catch (error) {
      console.error('Error loading program plan fees:', error);
    }
  }

  calculateAmounts(): void {
    // This method is kept for compatibility but actual calculations are in getters
    // The getters are used directly in the template
  }

  get taxAmount(): number {
    const orderAmount = Number(this.formGroup.get('orderAmount')?.value) || 0;
    const discountAmount = Number(this.formGroup.get('discountAmount')?.value) || 0;
    const isTaxApplicable = this.formGroup.get('isTaxApplicable')?.value || false;
    const isPlanFeesIncludedTax = this.formGroup.get('isPlanFeesIncludedTax')?.value || false;
    const taxPercentage = 18;
    if (!isTaxApplicable) {
      return 0;
    }
    if (isPlanFeesIncludedTax) {
      // Extract tax from plan fees
      // If plan fees = 118 and tax = 18%, then base = 118 / 1.18 = 100, tax = 18
      const baseAmount = orderAmount / (1 + taxPercentage / 100);
      return orderAmount - baseAmount;
    } else {
      // Calculate tax on subtotal
      const subtotal = orderAmount - discountAmount;
      return (subtotal * taxPercentage) / 100;
    }
  }

  get totalAmount(): number {
    const orderAmount = Number(this.formGroup.get('orderAmount')?.value) || 0;
    const discountAmount = Number(this.formGroup.get('discountAmount')?.value) || 0;
    const isTaxApplicable = this.formGroup.get('isTaxApplicable')?.value || false;
    const isPlanFeesIncludedTax = this.formGroup.get('isPlanFeesIncludedTax')?.value || false;
    const taxPercentage = 18;
    if (!isTaxApplicable) {
      return orderAmount - discountAmount;
    }
    if (isPlanFeesIncludedTax) {
      // Plan fees includes tax, discount applies to base amount
      // Example: Plan fees = 118 (includes 18% tax), Base = 100, Tax = 18
      // If discount = 10, then discounted base = 90, total = 90 + 18 = 108
      const baseAmount = orderAmount / (1 + taxPercentage / 100);
      const taxAmount = orderAmount - baseAmount;
      const discountedBase = baseAmount - discountAmount;
      return discountedBase + taxAmount;
    } else {
      // Plan fees doesn't include tax, calculate tax on subtotal
      const subtotal = orderAmount - discountAmount;
      const taxAmount = (subtotal * taxPercentage) / 100;
      return subtotal + taxAmount;
    }
  }

  get taxPercentage(): number {
    return 18;
  }

  get currencyOptions(): IDropdownItem[] {
    // Return currencies from selected program plan, or default currencies
    const currencies = this.availableCurrencies();
    if (currencies.length > 0) {
      return currencies;
    }
    // Default currencies if no program plan selected
    return [
      { id: 'INR', label: 'INR', selected: false },
      { id: 'USD', label: 'USD', selected: false },
      { id: 'EUR', label: 'EUR', selected: false }
    ];
  }

  async updateFeeForCurrency(programPlanId: number, currencyCode: string): Promise<void> {
    try {
      const programPlan = await this.apiService.getProgramPlanDetails(this.data.memberId, programPlanId);
      const fee = programPlan.programPlanFees?.find(f => f.currencyCode === currencyCode);
      if (fee) {
        this.formGroup.patchValue({
          orderAmount: fee.fees
        }, { emitEvent: false });
        this.calculateAmounts();
      }
    } catch (error) {
      console.error('Error updating fee for currency:', error);
    }
  }
}

