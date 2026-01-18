import { Component, Inject, OnInit, signal } from '@angular/core';
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
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { InputErrorComponent } from '@shared';
import {
  ICalculateTaxResponse,
  IDropdownItem,
  IMemberProduct,
  IProduct,
  IProductFee,
  InputLengthEnum,
  PaymentSourceEnum,
  PaymentStatusEnum, IMemberProductMasterData
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';
import { ProductOrderFormService, SelectedProduct } from './product-order-form.service';

export interface ManageMemberProductOrderData {
  memberId: number;
  productOrder?: IMemberProduct;
}

@Component({
  selector: 'lib-manage-member-product-order',
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
    MatCardModule,
    MatChipsModule,
    InputErrorComponent
  ],
  templateUrl: './manage-member-product-order.component.html',
  styleUrl: './manage-member-product-order.component.scss'
})
export class ManageMemberProductOrderComponent implements OnInit {
  formGroup!: FormGroup;
  step1FormGroup!: FormGroup;
  step2FormGroup!: FormGroup;
  masterData = signal<IMemberProductMasterData | null>(null);
  products = signal<IProduct[]>([]);
  loading = signal(false);
  loadingProducts = signal(false);
  submitting = signal(false);
  calculatingTax = signal(false);
  creatingPaymentLink = signal(false);
  isEditMode = false;
  selectedIndex = signal(0);
  InputLengthEnum = InputLengthEnum;
  PaymentSourceEnum = PaymentSourceEnum;
  selectedProducts = signal<SelectedProduct[]>([]);
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
  selectedProductId = signal<number | null>(null);
  selectedProductFee = signal<IProductFee | null>(null);
  quantity = signal(1);

  constructor(
    public dialogRef: MatDialogRef<ManageMemberProductOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ManageMemberProductOrderData,
    private apiService: MembersApiService,
    private productOrderFormService: ProductOrderFormService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
    this.isEditMode = !!data.productOrder;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMasterData();
    if (this.isEditMode && this.data.productOrder) {
      this.loadData();
    }
  }

  private initializeForm(): void {
    const paymentDate = this.data.productOrder?.paymentDate;
    const defaultPaymentSource = PaymentSourceEnum?.MANUAL || 'MANUAL';
    // Step 1: Product Selection Form
    this.step1FormGroup = this.fb.group({
      productId: [null, [Validators.required]],
      currencyCode: ['INR', [Validators.required]]
    });
    // Step 2: Quantity and Cart Form
    this.step2FormGroup = this.fb.group({
      addressId: [null],
      billingAddressId: [null],
      gstNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      isTaxApplicable: [true, [Validators.required]],
      isPlanFeesIncludedTax: [false, [Validators.required]],
      currencyCode: ['INR', [Validators.required]],
      orderAmount: [0, [Validators.required, Validators.min(0)]],
      discountAmount: [0, [Validators.required, Validators.min(0)]]
    });
    // Main form group
    this.formGroup = this.fb.group({
      addressId: [null],
      billingAddressId: [null],
      gstNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      isTaxApplicable: [true, [Validators.required]],
      isPlanFeesIncludedTax: [false, [Validators.required]],
      currencyCode: ['INR', [Validators.required]],
      orderAmount: [0, [Validators.required, Validators.min(0)]],
      discountAmount: [0, [Validators.required, Validators.min(0)]],
      paymentModeId: [null, []],
      paymentDate: [paymentDate, []],
      paymentStatusId: [null, []],
      transactionId: ['', [Validators.maxLength(InputLengthEnum.CHAR_250)]],
      paymentSource: [defaultPaymentSource, [Validators.required]],
      gatewayProvider: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      gatewayOrderId: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
      gatewayPaymentId: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
      paymentLink: ['', [Validators.maxLength(InputLengthEnum.CHAR_500)]],
      franchisePaymentGatewayId: [null]
    });
    // Subscribe to changes
    this.formGroup
      .get('orderAmount')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => this.calculateTaxFromBackend());
    this.formGroup
      .get('discountAmount')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => this.calculateTaxFromBackend());
    this.step2FormGroup
      .get('orderAmount')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.formGroup.patchValue(
          { orderAmount: this.step2FormGroup.get('orderAmount')?.value },
          { emitEvent: false }
        );
        this.calculateTaxFromBackend();
      });
    this.step2FormGroup
      .get('discountAmount')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.formGroup.patchValue(
          { discountAmount: this.step2FormGroup.get('discountAmount')?.value },
          { emitEvent: false }
        );
        this.calculateTaxFromBackend();
      });
    this.step2FormGroup.get('billingAddressId')?.valueChanges.subscribe(() => {
      this.formGroup.patchValue(
        {
          billingAddressId: this.step2FormGroup.get('billingAddressId')?.value
        },
        { emitEvent: false }
      );
      this.calculateTaxFromBackend();
    });
    this.step2FormGroup.get('isTaxApplicable')?.valueChanges.subscribe(() => {
      this.formGroup.patchValue(
        { isTaxApplicable: this.step2FormGroup.get('isTaxApplicable')?.value },
        { emitEvent: false }
      );
      this.calculateTaxFromBackend();
    });
    this.step2FormGroup.get('isPlanFeesIncludedTax')?.valueChanges.subscribe(() => {
      this.formGroup.patchValue(
        { isPlanFeesIncludedTax: this.step2FormGroup.get('isPlanFeesIncludedTax')?.value },
        { emitEvent: false }
      );
      this.calculateTaxFromBackend();
    });
    this.step2FormGroup.get('currencyCode')?.valueChanges.subscribe(() => {
      this.formGroup.patchValue(
        { currencyCode: this.step2FormGroup.get('currencyCode')?.value },
        { emitEvent: false }
      );
      this.calculateTaxFromBackend();
    });
    this.formGroup
      .get('paymentSource')
      ?.valueChanges.subscribe((paymentSource) => {
      this.updatePaymentFieldValidators(paymentSource);
      this.paymentLink.set(null);
      this.paymentLinkId.set(null);
      this.formGroup.patchValue(
        {
          paymentLink: '',
          gatewayOrderId: ''
        },
        { emitEvent: false }
      );
      if (
        paymentSource === PaymentSourceEnum?.PAYMENT_GATEWAY ||
        paymentSource === 'PAYMENT_GATEWAY'
      ) {
        this.loadSupportedGateways();
      }
    });
    this.step2FormGroup.get('currencyCode')?.valueChanges.subscribe(() => {
      if (
        this.formGroup.get('paymentSource')?.value ===
        PaymentSourceEnum?.PAYMENT_GATEWAY ||
        this.formGroup.get('paymentSource')?.value === 'PAYMENT_GATEWAY'
      ) {
        this.loadSupportedGateways();
      }
    });
    this.updatePaymentFieldValidators(defaultPaymentSource);
  }

  private updatePaymentFieldValidators(paymentSource: string): void {
    const isManual =
      paymentSource === PaymentSourceEnum?.MANUAL || paymentSource === 'MANUAL';
    const paymentModeIdControl = this.formGroup.get('paymentModeId');
    const paymentDateControl = this.formGroup.get('paymentDate');
    const paymentStatusIdControl = this.formGroup.get('paymentStatusId');
    const transactionIdControl = this.formGroup.get('transactionId');
    if (isManual) {
      paymentModeIdControl?.setValidators([Validators.required]);
      paymentDateControl?.setValidators([Validators.required]);
      paymentStatusIdControl?.setValidators([Validators.required]);
      transactionIdControl?.setValidators([
        Validators.required,
        Validators.maxLength(InputLengthEnum.CHAR_250)
      ]);
    } else {
      paymentModeIdControl?.setValidators([]);
      paymentDateControl?.setValidators([]);
      paymentStatusIdControl?.setValidators([]);
      transactionIdControl?.setValidators([
        Validators.maxLength(InputLengthEnum.CHAR_250)
      ]);
    }
    paymentModeIdControl?.updateValueAndValidity({ emitEvent: false });
    paymentDateControl?.updateValueAndValidity({ emitEvent: false });
    paymentStatusIdControl?.updateValueAndValidity({ emitEvent: false });
    transactionIdControl?.updateValueAndValidity({ emitEvent: false });
  }

  async loadMasterData(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.apiService.getProductMasterData(
        this.data.memberId
      );
      this.products.set(res.product);
      this.masterData.set(res);
    } catch (error) {
      console.error('Error loading master data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onProductSelectionChange(productId: number): void {
    this.selectedProductId.set(productId);
    const product = this.products().find((p) => p.productId === productId);
    if (product && product.fees && product.fees.length > 0) {
      const defaultCurrency =
        this.step1FormGroup.get('currencyCode')?.value || 'INR';
      const fee =
        product.fees.find((f) => f.currency === defaultCurrency) ||
        product.fees[0];
      this.selectedProductFee.set(fee);
      this.step1FormGroup.patchValue({ currencyCode: fee.currency });
    }
  }

  onCurrencyChange(selectedFee: string): void {
    const productId = this.selectedProductId();
    if (productId) {
      const product = this.products().find((p) => p.productId === productId);
      if (product && product.fees) {
        const tempFee = selectedFee.split('_');
        const fee = product.fees.find((f) => f.currency === tempFee[0]
          && f.price === Number(tempFee[1]) && f.quantity === Number(tempFee[2]) && f.unit === tempFee[3]);
        if (fee) {
          this.selectedProductFee.set(fee);
          // Ensure form control is in sync
          this.step1FormGroup.patchValue(
            { currencyCode: fee.currency },
            { emitEvent: false }
          );
        } else {
          // If fee not found for the selected currency, clear the selected fee
          this.selectedProductFee.set(null);
        }
      }
    } else {
      // If no product selected, clear the selected fee
      this.selectedProductFee.set(null);
    }
  }

  addProductToCart(): void {
    const productId = this.selectedProductId();
    const quantity = this.quantity();
    let fee = this.selectedProductFee();
    // If a fee is not set, try to get it from form control currency
    if (!fee && productId) {
      const currencyCode = this.step1FormGroup.get('currencyCode')?.value;
      if (currencyCode) {
        const product = this.products().find((p) => p.productId === productId);
        if (product && product.fees) {
          fee = product.fees.find((f) => f.currency === currencyCode) ?? null;
          if (fee) {
            this.selectedProductFee.set(fee);
          }
        }
      }
    }
    if (!productId || !fee || quantity <= 0) {
      this.snackBar.open('Please select a product and quantity', 'Close', {
        duration: 3000
      });
      return;
    }
    const product = this.products().find((p) => p.productId === productId);
    if (!product) {
      return;
    }
    const existingIndex = this.selectedProducts().findIndex(
      (p) => p.productId === productId && p.currency === fee.currency
    );
    if (existingIndex >= 0) {
      // Update existing product quantity
      const updated = [...this.selectedProducts()];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].totalPrice =
        updated[existingIndex].price * updated[existingIndex].quantity;
      this.selectedProducts.set(updated);
    } else {
      // Add new product
      const newProduct: SelectedProduct = {
        productId: productId,
        name: product.name,
        quantity: quantity,
        unit: fee.unit,
        price: fee.price,
        currency: fee.currency,
        totalPrice: fee.price * quantity
      };
      this.selectedProducts.set([...this.selectedProducts(), newProduct]);
    }
    this.updateOrderAmount();
    this.quantity.set(1);
    this.selectedProductId.set(null);
    this.step1FormGroup.patchValue({ productId: null });
  }

  removeProductFromCart(index: number): void {
    const updated = [...this.selectedProducts()];
    updated.splice(index, 1);
    this.selectedProducts.set(updated);
    this.updateOrderAmount();
  }

  updateProductQuantity(index: number, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeProductFromCart(index);
      return;
    }
    const updated = [...this.selectedProducts()];
    updated[index].quantity = newQuantity;
    updated[index].totalPrice = updated[index].price * newQuantity;
    this.selectedProducts.set(updated);
    this.updateOrderAmount();
  }

  private updateOrderAmount(): void {
    const total = this.selectedProducts().reduce(
      (sum, p) => sum + p.totalPrice,
      0
    );
    const currency =
      this.selectedProducts().length > 0
        ? this.selectedProducts()[0].currency
        : 'INR';
    this.step2FormGroup.patchValue(
      {
        orderAmount: total,
        currencyCode: currency
      },
      { emitEvent: false }
    );
    this.formGroup.patchValue(
      {
        orderAmount: total,
        currencyCode: currency
      },
      { emitEvent: false }
    );
    this.calculateTaxFromBackend();
  }

  async calculateTaxFromBackend(): Promise<void> {
    const formData = this.productOrderFormService.getProductOrderFormData(
      this.formGroup,
      this.step2FormGroup
    );
    if (!formData.orderAmount || !formData.currencyCode) {
      this.taxCalculationResult.set(null);
      return;
    }
    this.calculatingTax.set(true);
    try {
      const result = await this.productOrderFormService.calculateTax(
        this.data.memberId,
        formData
      );
      this.taxCalculationResult.set(result);
    } catch (error) {
      console.error('Error calculating tax:', error);
      this.taxCalculationResult.set(null);
    } finally {
      this.calculatingTax.set(false);
    }
  }

  async onStepperSelectionChange(event: StepperSelectionEvent): Promise<void> {
    this.selectedIndex.set(event.selectedIndex);
    if (event.selectedIndex === 2) {
      this.calculateTaxFromBackend();
    }
    if (event.selectedIndex === 3) {
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
    return this.selectedProducts().length > 0;
  }

  canProceedToStep3(): boolean {
    return this.step2FormGroup?.valid ?? false;
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
    if (isPaymentGateway) {
      return !!this.paymentLink() && this.paymentLink()!.trim().length > 0;
    }
    return true;
  }

  async loadSupportedGateways(): Promise<void> {
    const currencyCode =
      this.step2FormGroup?.get('currencyCode')?.value ||
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
      const primaryGateway = gateways.find((g) => g.isPrimary);
      if (primaryGateway && !this.selectedGatewayId()) {
        this.selectedGatewayId.set(primaryGateway.franchisePaymentGatewayId);
        this.formGroup.patchValue({
          franchisePaymentGatewayId: primaryGateway.franchisePaymentGatewayId
        });
      }
    } catch (error) {
      console.error('Error loading supported gateways:', error);
      this.supportedGateways.set([]);
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
        duration: 3000
      });
      return;
    }
    const selectedGatewayId =
      this.formGroup.get('franchisePaymentGatewayId')?.value ||
      this.selectedGatewayId();
    if (!selectedGatewayId) {
      this.snackBar.open('Please select a payment gateway', 'Close', {
        duration: 3000
      });
      return;
    }
    this.creatingPaymentLink.set(true);
    try {
      const currencyCode =
        this.step2FormGroup?.get('currencyCode')?.value ||
        this.formGroup.get('currencyCode')?.value ||
        'INR';
      const productNames = this.selectedProducts().map((p) => p.name);
      const result = await this.productOrderFormService.createPaymentLink(
        this.data.memberId,
        totalAmount,
        currencyCode,
        selectedGatewayId,
        productNames
      );
      this.paymentLink.set(result.shortUrl);
      this.paymentLinkId.set(result.id);
      this.formGroup.patchValue({
        paymentLink: result.shortUrl,
        gatewayProvider: result.gatewayCode,
        gatewayOrderId: result.id,
        paymentStatusId: PaymentStatusEnum.PENDING
      });
    } catch (error) {
      console.error('Error creating payment link:', error);
      this.snackBar.open('Failed to create payment link', 'Close', {
        duration: 3000
      });
    } finally {
      this.creatingPaymentLink.set(false);
    }
  }

  onGatewaySelectionChange(gatewayId: number): void {
    this.selectedGatewayId.set(gatewayId);
    this.formGroup.patchValue({
      franchisePaymentGatewayId: gatewayId
    });
    this.paymentLink.set(null);
    this.paymentLinkId.set(null);
    this.formGroup.patchValue({
      paymentLink: '',
      gatewayOrderId: ''
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
        duration: 3000
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.snackBar.open('Failed to copy link', 'Close', { duration: 3000 });
    }
  }

  async sharePaymentLink(): Promise<void> {
    const link = this.paymentLink();
    if (!link) {
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Payment Link',
          text: 'Please use this link to complete your payment',
          url: link
        });
        this.snackBar.open('Payment link shared!', 'Close', { duration: 3000 });
      } else {
        await this.copyPaymentLink();
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing payment link:', error);
        await this.copyPaymentLink();
      }
    }
  }

  private loadData(): void {
    // TODO: Implement loading existing product order data for edit mode
    // This will depend on the backend API structure
  }

  async onSubmit(): Promise<void> {
    if (
      this.formGroup.valid &&
      this.step2FormGroup?.valid &&
      this.selectedProducts().length > 0
    ) {
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
                duration: 3000
              }
            );
            return;
          }
        }
        const payload = this.buildPayload();
        if (this.isEditMode && this.data.productOrder?.memberProductId) {
          await this.apiService.updateProductOrder(
            this.data.memberId,
            this.data.productOrder.memberProductId,
            payload
          );
        } else {
          await this.apiService.createProductOrder(this.data.memberId, payload);
        }
        this.snackBar.open(
          `Product order ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'Close',
          {
            duration: 3000
          }
        );
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error saving product order:', error);
        this.snackBar.open(
          'Failed to save product order. Please check the form and try again.',
          'Close',
          {
            duration: 3000
          }
        );
      } finally {
        this.submitting.set(false);
      }
    }
  }

  private buildPayload(): any {
    const getValue = (key: string) => {
      return (
        this.step2FormGroup?.get(key)?.value ?? this.formGroup.get(key)?.value
      );
    };
    const taxAmount = this.taxCalculationResult()?.taxAmount || 0;
    const taxPercentage = this.taxCalculationResult()?.taxPercentage || 0;
    const totalAmount =
      this.taxCalculationResult()?.totalAmount ||
      this.productOrderFormService.calculateTotalAmountFallback(
        this.formGroup,
        this.step2FormGroup
      );
    return {
      memberId: this.data.memberId,
      paymentModeId: this.formGroup.value.paymentModeId,
      addressId: getValue('addressId') || null,
      billingAddressId: getValue('billingAddressId') || null,
      transactionId: this.formGroup.value.transactionId?.trim() || undefined,
      paymentStatusId: this.formGroup.value.paymentStatusId,
      isTaxApplicable: getValue('isTaxApplicable') ?? false,
      isPlanFeesIncludedTax: getValue('isPlanFeesIncludedTax') ?? false,
      gstNumber: getValue('gstNumber')?.trim() || undefined,
      taxPercentage,
      currencyCode: getValue('currencyCode') || 'INR',
      orderAmount: Number(getValue('orderAmount') || 0),
      taxAmount,
      discountAmount: Number(getValue('discountAmount') || 0),
      totalAmount,
      promoCode: '',
      paymentDate: this.formGroup.value.paymentDate || new Date(),
      paymentSource: this.formGroup.value.paymentSource,
      paymentLink: this.formGroup.value.paymentLink,
      gatewayProvider: this.formGroup.value.gatewayProvider,
      gatewayOrderId: this.formGroup.value.gatewayOrderId,
      products: this.selectedProducts().map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
        unit: p.unit,
        price: p.price,
        currency: p.currency
      }))
    };
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  get paymentModeOptions(): IDropdownItem[] {
    return this.masterData()?.paymentMode || [];
  }

  get paymentStatusOptions(): IDropdownItem[] {
    return this.masterData()?.paymentStatus || [];
  }

  get addressOptions(): IDropdownItem[] {
    const addresses = this.masterData()?.addresses || [];
    return this.productOrderFormService.transformAddressesToDropdown(addresses);
  }

  get paymentSourceOptions(): IDropdownItem[] {
    return this.masterData()?.paymentSource || [];
  }

  get taxAmount(): number {
    const result = this.taxCalculationResult();
    return result?.taxAmount || 0;
  }

  get totalAmount(): number {
    const result = this.taxCalculationResult();
    if (result) {
      return result.totalAmount;
    }
    const formData = this.productOrderFormService.getProductOrderFormData(
      this.formGroup,
      this.step2FormGroup
    );
    return formData.orderAmount - formData.discountAmount;
  }

  get taxPercentage(): number {
    const result = this.taxCalculationResult();
    return result?.taxPercentage || 0;
  }

  get taxObj(): Record<
    string,
    { amount: number; taxPercentage: number }
  > | null {
    const result = this.taxCalculationResult();
    return result?.taxObj || null;
  }

  get invoiceNote(): string | undefined {
    const result = this.taxCalculationResult();
    return result?.invoiceNote;
  }

  get selectedProduct(): IProduct | null {
    const productId = this.selectedProductId();
    if (!productId) return null;
    return this.products().find((p) => p.productId === productId) || null;
  }

  get availableFees(): IProductFee[] {
    const product = this.selectedProduct;
    if (!product) return [];
    return product.fees || [];
  }
}

