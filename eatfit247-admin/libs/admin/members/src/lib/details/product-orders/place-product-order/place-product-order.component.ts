import { Component, computed, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
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
import { MatTableModule } from '@angular/material/table';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import {
  ICalculateProductVariantTaxRequest,
  ICalculateTaxResponse,
  IDropdownItem,
  IManageMemberProduct,
  IMemberProduct,
  IMemberProductMasterData,
  IMemberProductOrderItemBasic,
  InputLengthEnum,
  IProduct,
  IProductPrice,
  IProductVariant,
  PaymentSourceEnum,
  PaymentStatusEnum,
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';
import { InputErrorComponent } from '@shared';

export interface PlaceProductOrderData {
  memberId: number;
  productOrder?: IMemberProduct;
}

export interface CartItem {
  productId: number;
  productName: string;
  productVariantId: number;
  variantLabel: string;
  currency: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxableAmount: number;
  totalAmount: number;
  taxAmount: number;
  taxPercent: number;
}

@Component({
  selector: 'lib-place-product-order',
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
    MatTableModule,
    InputErrorComponent,
  ],
  templateUrl: './place-product-order.component.html',
  styleUrl: './place-product-order.component.scss',
})
export class PlaceProductOrderComponent implements OnInit {
  formGroup!: FormGroup;
  step1FormGroup!: FormGroup;
  step2FormGroup!: FormGroup;
  step3FormGroup!: FormGroup;
  step4FormGroup!: FormGroup;
  masterData = signal<IMemberProductMasterData | null>(null);
  products = signal<IProduct[]>([]);
  loading = signal(false);
  submitting = signal(false);
  calculatingTax = signal(false);
  creatingPaymentLink = signal(false);
  isEditMode = false;
  selectedIndex = signal(0);
  InputLengthEnum = InputLengthEnum;
  cartItems = signal<CartItem[]>([]);
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
  selectedVariantId = signal<number | null>(null);
  selectedPrice = signal<IProductPrice | null>(null);
  quantity = signal(1);
  displayedColumns: string[] = ['product', 'variant', 'quantity', 'actions'];
  taxComputationColumns: string[] = [
    'product',
    'variant',
    'quantity',
    'unitPrice',
    'discountAmount',
    'taxableAmount',
    'tax',
    'total',
  ];

  // Computed signals for reactive product/variant selection
  selectedProduct = computed<IProduct | null>(() => {
    const productId = this.selectedProductId();
    if (!productId) return null;
    return this.products().find((p) => p.productId === productId) || null;
  });

  selectedVariant = computed<IProductVariant | null>(() => {
    const product = this.selectedProduct();
    const variantId = this.selectedVariantId();
    if (!product || !variantId) return null;
    return (
      product.variants?.find((v) => v.productVariantId === variantId) || null
    );
  });

  availablePrices = computed<IProductPrice[]>(() => {
    const variant = this.selectedVariant();
    if (!variant) return [];
    return variant.prices?.filter((p) => p.active !== false) || [];
  });

  constructor(
    public dialogRef: MatDialogRef<PlaceProductOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlaceProductOrderData,
    private apiService: MembersApiService,
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
    const defaultPaymentSource = PaymentSourceEnum.MANUAL;

    // Step 1: Product and Variant Selection
    this.step1FormGroup = this.fb.group({
      productId: [null, [Validators.required]],
    });

    // Step 2: Address and Tax Calculation
    this.step2FormGroup = this.fb.group({
      addressId: [null],
      billingAddressId: [null, [Validators.required]],
      gstNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      discountAmount: [0, [Validators.required, Validators.min(0)]],
    });

    // Step 3: Tax Computation Summary (no form needed, just display)
    this.step3FormGroup = this.fb.group({});

    // Step 4: Payment
    this.step4FormGroup = this.fb.group({
      paymentModeId: [null],
      paymentDate: [paymentDate || new Date(), [Validators.required]],
      paymentStatusId: [null, [Validators.required]],
      transactionId: ['', [Validators.maxLength(InputLengthEnum.CHAR_250)]],
      paymentSource: [defaultPaymentSource, [Validators.required]],
      gatewayProvider: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      gatewayOrderId: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
      gatewayPaymentId: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
      paymentLink: ['', [Validators.maxLength(InputLengthEnum.CHAR_500)]],
      franchisePaymentGatewayId: [null],
    });

    // Main form group
    this.formGroup = this.fb.group({
      addressId: [null],
      billingAddressId: [null],
      gstNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      currencyCode: ['INR', [Validators.required]],
      discountAmount: [0, [Validators.required, Validators.min(0)]],
      paymentModeId: [null],
      paymentDate: [paymentDate || new Date()],
      paymentStatusId: [null],
      transactionId: ['', [Validators.maxLength(InputLengthEnum.CHAR_250)]],
      paymentSource: [defaultPaymentSource, [Validators.required]],
      gatewayProvider: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
      gatewayOrderId: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
      gatewayPaymentId: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
      paymentLink: ['', [Validators.maxLength(InputLengthEnum.CHAR_500)]],
      franchisePaymentGatewayId: [null],
    });

    // Subscribe to changes for tax calculation
    this.step2FormGroup
      .get('billingAddressId')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.formGroup.patchValue(
          {
            billingAddressId:
              this.step2FormGroup.get('billingAddressId')?.value,
          },
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

    this.step4FormGroup
      .get('paymentSource')
      ?.valueChanges.subscribe((paymentSource) => {
        this.updatePaymentFieldValidators(paymentSource);
        this.paymentLink.set(null);
        this.paymentLinkId.set(null);
        this.step4FormGroup.patchValue(
          {
            paymentLink: '',
            gatewayOrderId: '',
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

    this.updatePaymentFieldValidators(defaultPaymentSource);
  }

  private updatePaymentFieldValidators(paymentSource: string): void {
    const isManual = paymentSource === PaymentSourceEnum.MANUAL;
    const paymentModeIdControl = this.step4FormGroup.get('paymentModeId');
    const paymentDateControl = this.step4FormGroup.get('paymentDate');
    const paymentStatusIdControl = this.step4FormGroup.get('paymentStatusId');
    const transactionIdControl = this.step4FormGroup.get('transactionId');

    if (isManual) {
      paymentModeIdControl?.setValidators([Validators.required]);
      paymentDateControl?.setValidators([Validators.required]);
      paymentStatusIdControl?.setValidators([Validators.required]);
      transactionIdControl?.setValidators([
        Validators.required,
        Validators.maxLength(InputLengthEnum.CHAR_250),
      ]);
    } else {
      paymentModeIdControl?.setValidators([]);
      paymentDateControl?.setValidators([]);
      paymentStatusIdControl?.setValidators([]);
      transactionIdControl?.setValidators([
        Validators.maxLength(InputLengthEnum.CHAR_250),
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
    this.selectedVariantId.set(null);
    this.selectedPrice.set(null);
  }

  onVariantSelectionChange(variantId: number): void {
    this.selectedVariantId.set(variantId);
    this.selectedPrice.set(null);
  }

  onPriceSelectionChange(price: IProductPrice): void {
    this.selectedPrice.set(price);
    if (price.currency) {
      this.formGroup.patchValue(
        { currencyCode: price.currency },
        { emitEvent: false }
      );
    }
  }

  addToCart(): void {
    const productId = this.selectedProductId();
    const variantId = this.selectedVariantId();
    const price = this.selectedPrice();
    const quantity = this.quantity();

    if (!productId || !variantId || !price || quantity <= 0) {
      this.snackBar.open(
        'Please select product, variant, price, and quantity',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }

    const product = this.products().find((p) => p.productId === productId);
    if (!product) {
      return;
    }

    const variant = product.variants?.find(
      (v) => v.productVariantId === variantId
    );
    if (!variant) {
      return;
    }

    // Check if same variant and currency already exists in cart
    const existingIndex = this.cartItems().findIndex(
      (item) =>
        item.productVariantId === variantId && item.currency === price.currency
    );

    if (existingIndex >= 0) {
      // Update existing item quantity
      const updated = [...this.cartItems()];
      updated[existingIndex].quantity += quantity;
      this.cartItems.set(updated);
    } else {
      // Add new item
      const variantLabel = `${variant.quantityValue} ${variant.quantityUnit}`;
      const newItem: CartItem = {
        productId: productId,
        productName: product.name,
        productVariantId: variantId,
        variantLabel: variantLabel,
        quantity: quantity,
        taxableAmount: 0,
        currency: price.currency || 'INR',
        discountAmount: 0,
        unitPrice: 0,
        totalAmount: 0,
        taxAmount: 0,
        taxPercent: 0,
      };
      this.cartItems.set([...this.cartItems(), newItem]);
    }

    this.updateOrderAmount();
    this.quantity.set(1);
    this.selectedProductId.set(null);
    this.selectedVariantId.set(null);
    this.selectedPrice.set(null);
    this.step1FormGroup.patchValue({ productId: null });
  }

  removeFromCart(index: number): void {
    const updated = [...this.cartItems()];
    updated.splice(index, 1);
    this.cartItems.set(updated);
    this.updateOrderAmount();
  }

  updateCartQuantity(index: number, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeFromCart(index);
      return;
    }
    const updated = [...this.cartItems()];
    updated[index].quantity = newQuantity;
    this.cartItems.set(updated);
    this.updateOrderAmount();
  }

  private updateOrderAmount(): void {
    const currency =
      this.cartItems().length > 0 ? this.cartItems()[0].currency : 'INR';
    this.formGroup.patchValue(
      {
        currencyCode: currency,
      },
      { emitEvent: false }
    );
    this.calculateTaxFromBackend();
  }

  async calculateTaxFromBackend(): Promise<void> {
    const cartItems = this.cartItems();
    if (cartItems.length === 0) {
      this.taxCalculationResult.set(null);
      return;
    }

    const billingAddressId = this.step2FormGroup.get('billingAddressId')?.value;

    if (!billingAddressId) {
      this.taxCalculationResult.set(null);
      return;
    }

    this.calculatingTax.set(true);
    try {
      // Build request with all cart items
      const request: ICalculateProductVariantTaxRequest = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          currency: item.currency,
          quantity: item.quantity,
        })),
        billingAddressId,
        discountAmount: this.step2FormGroup.get('discountAmount')?.value || 0,
      };

      const result = await this.apiService.calculateProductTax(
        this.data.memberId,
        request
      );

      // Update cart items with calculated tax for each item
      const updatedCartItems = cartItems.map((item) => {
        const taxResult = result.items.find(
          (r) =>
            r.productId === item.productId &&
            r.productVariantId === item.productVariantId &&
            r.currency === item.currency
        );

        if (taxResult) {
          return <CartItem>{
            ...item,
            unitPrice: taxResult.orderAmount / item.quantity,
            discountAmount: taxResult.discountAmount,
            taxableAmount: taxResult.taxableAmount,
            totalAmount: taxResult.totalAmount,
            taxAmount: taxResult.taxAmount,
            taxPercent: taxResult.taxPercentage || 0,
          };
        }
        return item;
      });
      this.cartItems.set(updatedCartItems);

      // Calculate aggregate totals for display
      const totalTaxAmount = updatedCartItems.reduce(
        (sum, item) => sum + (item.taxAmount || 0),
        0
      );
      const totalOrderAmount = updatedCartItems.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );

      // Store aggregate tax result (using the first item's tax info for common fields)
      if (result.items.length > 0) {
        const firstItem = result.items[0];
        this.taxCalculationResult.set({
          taxPercentage: firstItem.taxPercentage,
          orderAmount: totalOrderAmount,
          discountAmount: firstItem.discountAmount,
          taxableAmount: firstItem.taxableAmount,
          taxAmount: totalTaxAmount,
          totalAmount: firstItem.totalAmount,
          taxObj: firstItem.taxObj,
          taxType: firstItem.taxType,
          taxMode: firstItem.taxMode,
          invoiceNote: firstItem.invoiceNote,
          currency: firstItem.currency,
          isLutApplied: firstItem.isLutApplied,
          jurisdiction: firstItem.jurisdiction,
        });
      }
    } catch (error) {
      console.error('Error calculating tax:', error);
      this.taxCalculationResult.set(null);
      this.snackBar.open(
        'Failed to calculate tax. Please try again.',
        'Close',
        {
          duration: 3000,
        }
      );
    } finally {
      this.calculatingTax.set(false);
    }
  }

  async onStepperSelectionChange(event: StepperSelectionEvent): Promise<void> {
    this.selectedIndex.set(event.selectedIndex);
    if (event.selectedIndex === 2) {
      // Step 3: Calculate tax when entering tax computation step
      this.calculateTaxFromBackend();
    }
    if (event.selectedIndex === 3) {
      // Step 4: Load gateways if payment gateway is selected
      const paymentSource = this.step4FormGroup.get('paymentSource')?.value;
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
    return this.cartItems().length > 0;
  }

  canProceedToStep3(): boolean {
    return this.step2FormGroup?.valid ?? false;
  }

  canProceedToStep4(): boolean {
    // Step 3 is just a display step, so we can always proceed if step 2 is valid
    return this.step2FormGroup?.valid ?? false;
  }

  isManualPaymentSource(): boolean {
    const paymentSource = this.step4FormGroup.get('paymentSource')?.value;
    return paymentSource === PaymentSourceEnum?.MANUAL;
  }

  isPaymentLinkRequiredAndGenerated(): boolean {
    const paymentSource = this.step4FormGroup.get('paymentSource')?.value;
    const isPaymentGateway =
      paymentSource === PaymentSourceEnum?.PAYMENT_GATEWAY ||
      paymentSource === 'PAYMENT_GATEWAY';
    if (isPaymentGateway) {
      return !!this.paymentLink() && this.paymentLink()!.trim().length > 0;
    }
    return true;
  }

  async loadSupportedGateways(): Promise<void> {
    const currencyCode = this.formGroup.get('currencyCode')?.value || 'INR';
    if (!currencyCode) {
      return;
    }
    this.loadingGateways.set(true);
    try {
      const gateways = await this.apiService.getProductSupportedPaymentGateways(
        this.data.memberId,
        currencyCode
      );
      this.supportedGateways.set(gateways);
      const primaryGateway = gateways.find((g) => g.isPrimary);
      if (primaryGateway && !this.selectedGatewayId()) {
        this.selectedGatewayId.set(primaryGateway.franchisePaymentGatewayId);
        this.formGroup.patchValue({
          franchisePaymentGatewayId: primaryGateway.franchisePaymentGatewayId,
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
      const currencyCode = this.formGroup.get('currencyCode')?.value || 'INR';
      const productNames = this.cartItems().map((item) => item.productName);
      const request = {
        amount: totalAmount,
        currency: currencyCode,
        franchisePaymentGatewayId: selectedGatewayId,
        description: `Payment for products: ${productNames.join(', ')}`,
        notes: {
          memberId: this.data.memberId.toString(),
          type: 'product',
        },
      };

      const result = await this.apiService.createProductPaymentLink(
        this.data.memberId,
        request
      );
      this.paymentLink.set(result.shortUrl);
      this.paymentLinkId.set(result.id);
      this.step4FormGroup.patchValue({
        paymentLink: result.shortUrl,
        gatewayProvider: result.gatewayCode,
        gatewayOrderId: result.id,
        paymentStatusId: PaymentStatusEnum.PENDING,
      });
    } catch (error) {
      console.error('Error creating payment link:', error);
      this.snackBar.open('Failed to create payment link', 'Close', {
        duration: 3000,
      });
    } finally {
      this.creatingPaymentLink.set(false);
    }
  }

  onGatewaySelectionChange(gatewayId: number): void {
    this.selectedGatewayId.set(gatewayId);
    this.step4FormGroup.patchValue({
      franchisePaymentGatewayId: gatewayId,
    });
    this.paymentLink.set(null);
    this.paymentLinkId.set(null);
    this.step4FormGroup.patchValue(
      {
        paymentLink: '',
        gatewayOrderId: '',
      },
      { emitEvent: false }
    );
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
      console.error('Error copying to clipboard:', error);
      this.snackBar.open('Failed to copy link', 'Close', { duration: 3000 });
    }
  }

  private loadData(): void {
    // TODO: Implement loading existing product order data for edit mode
  }

  async onSubmit(): Promise<void> {
    if (
      this.formGroup.valid &&
      this.step2FormGroup?.valid &&
      this.step4FormGroup?.valid &&
      this.cartItems().length > 0
    ) {
      this.submitting.set(true);
      try {
        if (!this.isManualPaymentSource()) {
          if (
            !this.step4FormGroup.value.paymentLink ||
            this.step4FormGroup.value.paymentLink.length === 0
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
        const payload = this.buildPayload();
        await this.apiService.createProductOrder(this.data.memberId, payload);
        this.snackBar.open('Product order created successfully', 'Close', {
          duration: 3000,
        });
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error saving product order:', error);
        this.snackBar.open(
          'Failed to save product order. Please check the form and try again.',
          'Close',
          {
            duration: 3000,
          }
        );
      } finally {
        this.submitting.set(false);
      }
    }
  }

  private buildPayload(): IManageMemberProduct {
    const getValue = (key: string) => {
      return (
        this.step2FormGroup?.get(key)?.value ??
        this.step4FormGroup?.get(key)?.value ??
        this.formGroup.get(key)?.value
      );
    };

    return <IManageMemberProduct>{
      memberId: this.data.memberId,
      paymentModeId: getValue('paymentModeId'),
      addressId: getValue('addressId') || null,
      billingAddressId: getValue('billingAddressId') || null,
      transactionId: getValue('transactionId')?.trim() || undefined,
      paymentStatusId: getValue('paymentStatusId'),
      gstNumber: getValue('gstNumber')?.trim() || undefined,
      currency: this.formGroup.get('currencyCode')?.value,
      discountAmount: Number(getValue('discountAmount') || 0),
      promoCode: '',
      paymentDate: getValue('paymentDate') || new Date(),
      paymentSource: getValue('paymentSource'),
      paymentLink: getValue('paymentLink'),
      gatewayProvider: getValue('gatewayProvider'),
      gatewayOrderId: getValue('gatewayOrderId'),
      gatewayPaymentId: getValue('gatewayPaymentId'),
      orderItems: this.cartItems().map(
        (item) =>
          <IMemberProductOrderItemBasic>{
            productId: Number(item.productId),
            productVariantId: Number(item.productVariantId),
            quantity: Number(item.quantity),
            unit: item.unitPrice,
            currency: item.currency,
          }
      ),
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
    return addresses.map((addr: any) => ({
      id: addr.addressId,
      label: `${addr.postalAddress}, ${addr.cityVillage}, ${addr.pinCode}`,
      selected: false,
    }));
  }

  get paymentSourceOptions(): IDropdownItem[] {
    return this.masterData()?.paymentSource || [];
  }

  get taxAmount(): number {
    const result = this.taxCalculationResult();
    return result?.taxAmount || 0;
  }

  get orderAmount(): number {
    const result = this.taxCalculationResult();
    if (result) {
      return result.orderAmount;
    }
    // Calculate from cart items if tax not calculated yet
    return this.cartItems().reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  }

  get totalAmount(): number {
    const result = this.taxCalculationResult();
    if (result) {
      return result.totalAmount;
    }
    const discountAmount =
      this.step2FormGroup.get('discountAmount')?.value || 0;
    return this.orderAmount - discountAmount;
  }

  get taxPercentage(): number {
    const result = this.taxCalculationResult();
    return result?.taxPercentage || 0;
  }

  get cartSubtotal(): number {
    return this.cartItems().reduce((sum, item) => sum + item.taxableAmount, 0);
  }

  get cartTaxTotal(): number {
    return this.cartItems().reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0
    );
  }

  get cartGrandTotal(): number {
    return (
      this.cartSubtotal -
      (this.step2FormGroup.get('discountAmount')?.value || 0) +
      this.cartTaxTotal
    );
  }
}
