import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import {
  CheckoutService,
  PaymentService,
  ProgramPlan,
} from '../../core/services';
import { RecaptchaService } from '../../core/services/recaptcha.service';
import {
  ICalculateProductVariantTaxResponse,
  ICheckoutAddressData,
  ICheckoutMemberData,
  IDropdownItem,
  IPaymentGateway,
  IProductVariantTaxResult,
  IPublicCheckoutOrderResponse,
  IPublicPlanOrderRequest,
  IPublicPlanTaxCalculationRequest,
  IPublicProduct,
  IPublicProductOrderRequest,
  IPublicProductTaxCalculationRequest,
  TaxCategoryEnum,
  TaxMode,
  TaxTypeEnum,
} from '@eatfit247-shared-library';
import { ProductService } from '../../core/services/product.service';
import { BreadcrumbsComponent } from '@shared-ui';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

interface ICheckoutSidebarItem {
  key: string;
  name: string;
  variant: string;
  qty: number;
  price: number;
  image: string | null;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCheckboxModule,
    MatRadioModule,
    BreadcrumbsComponent,
    RouterLink,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('stepper') stepper!: MatStepper;
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly checkoutService = inject(CheckoutService);
  private readonly recaptchaService = inject(RecaptchaService);
  private readonly paymentService = inject(PaymentService);
  private readonly productService = inject(ProductService);
  private readonly platformId = inject(PLATFORM_ID);
  /** Zoneless: plain fields changed after an await only render once marked. */
  private readonly cdr = inject(ChangeDetectorRef);
  // Stepper state
  // SELECTION step removed – flow now starts from BILLING
  currentStepIndex = signal(0);
  readonly STEP_INDICES = {
    BILLING: 0,
    PREVIEW: 1,
    PAYMENT: 2,
    RESULT: 3,
  };
  // Unified form for both products and plans
  basicDetailsForm!: FormGroup;
  // Flag to ensure forms are initialized
  formsInitialized = false;
  // Data
  programPlan: ProgramPlan | null = null;
  programPlanId: number | null = null;
  memberId: number | null = null;
  addressId: number | null = null;
  // Product checkout data
  isProductCheckout = false;
  productName = '';
  productPrice = 0;
  productQuantity = 1;
  productUnit = '';
  productSku = '';
  productId: number | null = null;
  productVariantId: number | null = null;
  // Payment gateway
  paymentGateways: IPaymentGateway[] = [];
  selectedGateway: IPaymentGateway | null = null;
  isPaymentGatewayAvailable = false;
  paymentGatewayLoading = false;
  // Master data
  countryOptions: IDropdownItem[] = [];
  countryCodeOptions: IDropdownItem[] = [];
  stateOptions: IDropdownItem[] = [];
  filteredStateOptions: IDropdownItem[] = [];
  // Tax calculation
  taxCalculation: ICalculateProductVariantTaxResponse | null = null;
  isTaxApplicable = false;
  calculatingTax = false;
  // Payment
  paymentLink: string | null = null;
  loading = false;
  error: string | null = null;
  // Embedded payment
  showPaymentModal = false;
  processingPayment = false;
  /** Server-created PENDING order and its gateway checkout payload. */
  checkoutOrder: IPublicCheckoutOrderResponse | null = null;
  /** The request that produced `checkoutOrder`, so a retry reuses the same order. */
  private checkoutOrderKey: string | null = null;
  // Promo code (validated and applied on the server)
  readonly promoCodeControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.maxLength(50)],
  });
  // Signals: this app is zoneless, so async updates only re-render through signals.
  readonly appliedPromoCode = signal<string | null>(null);
  readonly promoMessage = signal<string | null>(null);
  readonly promoError = signal<string | null>(null);
  readonly applyingPromo = signal(false);
  // Plan details
  orderAmount = 0;
  discountAmount = 0;
  currencyCode = 'INR';
  product!: IPublicProduct;
  // Result state
  paymentSuccess = false;
  /** Gateway reported success but the server has not confirmed PAID yet. */
  paymentPending = false;
  paymentError: string | null = null;
  orderId: string | null = null;
  paymentId: string | null = null;

  async ngOnInit(): Promise<void> {
    // Initialize forms first to prevent template errors
    this.initializeForms();
    await this.loadMasterData();
    this.cdr.markForCheck();
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (params) => {
        await this.initFlow(params);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initFlow(params: Params): Promise<void> {
    const planId = params['plan'];
    const productName = params['productName'];
    const productPrice = params['productPrice'];
    const productQuantity = params['productQuantity'];
    if (planId) {
      this.programPlanId = +planId;
      this.isProductCheckout = false;
      // Forms are already initialized in ngOnInit
      await this.loadProgramPlan();
      // Check payment gateway availability for plans too
      await this.checkPaymentGatewayAvailability();
    } else if (productName) {
      this.productId = params['productId'] ? +params['productId'] : null;
      this.productVariantId = params['productVariantId']
        ? +params['productVariantId']
        : null;
      this.productPrice = productPrice ? +productPrice : 0;
      this.productQuantity = productQuantity ? +productQuantity : 1;
      this.isProductCheckout = true;
      await this.loadProductDetails();
      // Forms are already initialized in ngOnInit
      // Check payment gateway availability
      await this.checkPaymentGatewayAvailability();
    } else {
      this.error =
        'No product or plan selected. Please select a product or plan first.';
    }
  }

  /**
   * Initialize form groups
   * Unified form structure for both products and plans
   */
  initializeForms(): void {
    // Billing details form
    this.basicDetailsForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      companyName: ['', [Validators.maxLength(100)]],
      countryId: [null, [Validators.required]],
      postalAddress: ['', [Validators.required, Validators.maxLength(400)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      stateId: ['', [Validators.required]],
      postcode: ['', [Validators.required, Validators.maxLength(10)]],
      phone: ['', [Validators.required, Validators.maxLength(16)]],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      orderNotes: [''],
    });
    // Watch for country changes to filter states
    this.basicDetailsForm
      .get('countryId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((countryId) => {
        this.filterStatesByCountry(countryId);
      });
    // Set the default country after forms are initialized (if master data is already loaded)
    this.setDefaultCountry();
    // Mark forms as initialized
    this.formsInitialized = true;
  }

  /**
   * Load program plan details
   */
  async loadProgramPlan(): Promise<void> {
    if (!this.programPlanId) return;
    try {
      this.loading = true;
      this.programPlan = await this.checkoutService.getProgramPlan(
        this.programPlanId,
      );
      if (this.programPlan) {
        this.productUnit = '';
        // Set order amount from plan fees
        const inrFee = this.programPlan.programPlanFees?.find(
          (f) => f.currencyCode === 'INR',
        );
        if (inrFee) {
          this.orderAmount = inrFee.fees;
          this.currencyCode = 'INR';
        } else if (
          this.programPlan.programPlanFees &&
          this.programPlan.programPlanFees.length > 0
        ) {
          this.orderAmount = this.programPlan.programPlanFees[0].fees;
          this.currencyCode = this.programPlan.programPlanFees[0].currencyCode;
        }
      } else {
        this.error = 'Program plan not found.';
      }
    } catch (error) {
      this.error = 'Failed to load program plan details.';
    } finally {
      this.cdr.markForCheck();
      this.loading = false;
    }
  }

  /**
   * Set default country to India
   */
  setDefaultCountry(): void {
    if (this.countryOptions.length === 0) return;
    const indiaCountry = this.countryOptions.find(
      (c) => c.label.toLowerCase() === 'india',
    );
    if (!indiaCountry) return;
    // Set the default country for unified checkout form
    if (this.basicDetailsForm) {
      const currentCountryId = this.basicDetailsForm.get('countryId')?.value;
      if (!currentCountryId) {
        this.basicDetailsForm.patchValue({ countryId: indiaCountry.id });
        // Filter states for India
        this.filterStatesByCountry(indiaCountry.id as number);
      }
    }
  }

  /**
   * Load master data (country, etc.)
   */
  async loadMasterData(): Promise<void> {
    try {
      const masterData = await this.checkoutService.getCheckoutMasterData();
      if (masterData) {
        this.countryOptions = masterData.country || [];
        this.countryCodeOptions = masterData.countryCode || [];
        // Set the default country to India after master data is loaded
        this.setDefaultCountry();
      }
      const addressMasterData =
        await this.checkoutService.getAddressMasterData();
      if (addressMasterData) {
        this.stateOptions = addressMasterData.state || [];
        // Re-filter states if the country is already set
        if (this.basicDetailsForm) {
          const countryId = this.basicDetailsForm.get('countryId')?.value;
          if (countryId) {
            this.filterStatesByCountry(countryId);
          }
        }
      }
    } catch (error) {}
  }

  /**
   * Filter states by selected country
   */
  filterStatesByCountry(countryId: number): void {
    if (!countryId) {
      this.filteredStateOptions = [];
      // Reset state selection when the country is cleared
      if (this.basicDetailsForm) {
        this.basicDetailsForm.patchValue({ stateId: '' }, { emitEvent: false });
      }
      return;
    }
    const previousStateId = this.basicDetailsForm?.get('stateId')?.value;
    // Replace lodash filter and sortBy with native JavaScript
    this.filteredStateOptions = this.stateOptions
      .filter((state) => state.parentId === countryId)
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    // Reset state selection if the previously selected state is not in the new country's states
    const isPreviousStateValid = this.filteredStateOptions.some(
      (state) => state.id === previousStateId,
    );
    if (!isPreviousStateValid && this.basicDetailsForm) {
      this.basicDetailsForm.patchValue({ stateId: '' }, { emitEvent: false });
    }
  }

  /**
   * Step 1: Validate selection and proceed to billing
   */
  async proceedFromSelection(): Promise<void> {
    if (this.isProductCheckout) {
      if (!this.productId || !this.productVariantId) {
        this.error =
          'Product ID or Variant ID missing. Please go back and select the product again.';
        return;
      }
      await this.loadProductDetails();
      if (!this.product || this.error) {
        this.error =
          'Product or variant not found. Please go back and select the product again.';
        return;
      }
    } else {
      if (!this.programPlanId) {
        this.error =
          'Program Plan ID missing. Please go back and select the plan again.';
        return;
      }
      await this.loadProgramPlan();
      if (!this.programPlan || this.error) {
        this.error =
          'Plan not found. Please go back and select the plan again.';
        return;
      }
    }
    this.error = null;
    this.moveToNextStep();
  }

  /**
   * Step 2: Validate billing details, create member/address, then proceed to tax calculation
   */
  async proceedFromBilling(): Promise<void> {
    if (!this.basicDetailsForm.valid) {
      this.markFormGroupTouched(this.basicDetailsForm);
      return;
    }
    try {
      this.loading = true;
      this.error = null;
      // Create member (skip if already exists)
      if (!this.memberId) {
        const memberData: ICheckoutMemberData = {
          firstName: this.basicDetailsForm.get('firstName')?.value,
          lastName: this.basicDetailsForm.get('lastName')?.value,
          emailId: this.basicDetailsForm.get('email')?.value,
          countryCode: '+91',
          contactNumber: this.basicDetailsForm.get('phone')?.value,
          countryId: this.basicDetailsForm.get('countryId')?.value,
        };
        let recaptchaToken: string | undefined;
        if (this.recaptchaService.isAvailable()) {
          try {
            recaptchaToken =
              await this.recaptchaService.getToken('member_creation');
          } catch (recaptchaError: unknown) {
            console.warn('Failed to get reCAPTCHA token:', recaptchaError);
          }
        }
        const memberResult = await this.checkoutService.createMember(
          memberData,
          recaptchaToken,
        );
        if (!memberResult?.memberId) {
          throw new Error('Failed to create member');
        }
        this.memberId = memberResult.memberId;
        if (memberResult.checkoutToken) {
          sessionStorage.setItem('checkoutToken', memberResult.checkoutToken);
        }
      }
      // Create address (skip if already exists)
      if (!this.addressId || !this.memberId) {
        const addressData: ICheckoutAddressData = {
          postalAddress:
            `${this.basicDetailsForm.get('postalAddress')?.value}`.trim(),
          cityVillage: this.basicDetailsForm.get('city')?.value,
          stateId: Number(this.basicDetailsForm.get('stateId')?.value),
          countryId: Number(this.basicDetailsForm.get('countryId')?.value),
          pinCode: this.basicDetailsForm.get('postcode')?.value,
        };
        const addressResult = await this.checkoutService.createAddress(
          this.memberId!,
          addressData,
        );
        if (!addressResult?.addressId) {
          throw new Error('Failed to create address');
        }
        this.addressId = addressResult.addressId;
      }
      // Foreign billing country: charge the plan's foreign-currency fee, so the sale is an export
      this.applyPlanCurrencyForBillingCountry();
      // Calculate tax first, then skip to preview step
      await this.calculateTaxForCurrentStep();
      // Stay on billing with the server's message (e.g. a product not sold in this currency);
      // the gateway check below would otherwise clear it and show an empty review step
      if (this.error || !this.taxCalculation) {
        this.error = this.error || 'Tax calculation failed. Please try again.';
        return;
      }
      // Load payment gateways before moving to preview
      await this.checkPaymentGatewayAvailability();
      if (!this.isPaymentGatewayAvailable || !this.selectedGateway) {
        this.error = 'Payment gateway not available. Please try again later.';
        return;
      }
      // Skip TAX step (index 2) and move directly to PREVIEW step (index 3)
      this.moveToStep(this.STEP_INDICES.PREVIEW);
    } catch (error: unknown) {
      console.error('Error proceeding from billing:', error);
      this.error =
        error instanceof Error
          ? error.message
          : 'Failed to proceed. Please try again.';
    } finally {
      this.cdr.markForCheck();
      this.loading = false;
    }
  }

  private async checkProductTax(): Promise<string | undefined> {
    if (!this.memberId || !this.productId || !this.productVariantId) {
      throw new Error('Product ID or Variant ID missing');
    }
    const productTaxRequest: IPublicProductTaxCalculationRequest = {
      items: [
        {
          productId: this.productId,
          productVariantId: this.productVariantId,
          quantity: this.productQuantity,
        },
      ],
      currency: this.currencyCode,
      addressId: this.addressId ?? undefined,
      billingAddressId: this.addressId ?? undefined,
      promoCode: this.appliedPromoCode() ?? undefined,
    };
    const result = await this.checkoutService.calculateProductTax(
      this.memberId,
      productTaxRequest,
    );
    this.taxCalculation = result;
    if (this.taxCalculation) {
      this.isTaxApplicable = this.taxCalculation.taxAmount > 0;
    }
    return result?.promoMessage;
  }

  private async checkPlanTax(): Promise<string | undefined> {
    if (!this.memberId || !this.programPlanId) {
      throw new Error('Program Plan ID missing');
    }
    const taxRequest: IPublicPlanTaxCalculationRequest = {
      programPlanId: this.programPlanId,
      currency: this.currencyCode,
      addressId: this.addressId ?? undefined,
      billingAddressId: this.addressId ?? undefined,
      promoCode: this.appliedPromoCode() ?? undefined,
    };
    const tempTaxCalculation = await this.checkoutService.calculateTax(
      this.memberId,
      taxRequest,
    );
    if (!tempTaxCalculation) {
      throw new Error('Tax calculation failed');
    }
    const item: IProductVariantTaxResult[] = [];
    item.push(<IProductVariantTaxResult>{
      taxPercentage: tempTaxCalculation.taxPercentage,
      orderAmount: tempTaxCalculation.orderAmount,
      discountAmount: tempTaxCalculation.discountAmount,
      taxableAmount: tempTaxCalculation.taxableAmount,
      taxAmount: tempTaxCalculation.taxAmount,
      totalAmount: tempTaxCalculation.totalAmount,
      taxObj: tempTaxCalculation.taxObj,
      taxType: tempTaxCalculation.taxType,
      taxMode: tempTaxCalculation.taxMode,
      invoiceNote: tempTaxCalculation.invoiceNote,
      currency: tempTaxCalculation.currency,
      isLutApplied: tempTaxCalculation.isLutApplied,
      jurisdiction: tempTaxCalculation.jurisdiction,
      taxCategory: tempTaxCalculation.taxCategory,
      lutArn: tempTaxCalculation.lutArn,
      taxDecisionReason: tempTaxCalculation.taxDecisionReason,
    });
    this.taxCalculation = <ICalculateProductVariantTaxResponse>{
      items: item,
      orderAmount: tempTaxCalculation.orderAmount,
      taxAmount: tempTaxCalculation.taxAmount,
      discountAmount: tempTaxCalculation.discountAmount,
      taxableAmount: tempTaxCalculation.taxableAmount,
      totalAmount: tempTaxCalculation.totalAmount,
    };
    if (this.taxCalculation) {
      this.isTaxApplicable = this.taxCalculation.taxAmount > 0;
    }
    return tempTaxCalculation.promoMessage;
  }

  /** Re-price with the current promo code; throws the API error (e.g. an invalid code). */
  private async refreshTax(): Promise<string | undefined> {
    return this.isProductCheckout ? this.checkProductTax() : this.checkPlanTax();
  }

  /**
   * Apply the promo code: the server validates it and returns the discounted price.
   */
  async applyPromoCode(): Promise<void> {
    const code = this.promoCodeControl.value.trim();
    if (!code || this.applyingPromo() || !this.memberId || !this.addressId) {
      return;
    }
    const previousCode = this.appliedPromoCode();
    this.applyingPromo.set(true);
    this.promoError.set(null);
    this.promoMessage.set(null);
    this.appliedPromoCode.set(code);
    try {
      this.promoMessage.set((await this.refreshTax()) || 'Promo code applied');
    } catch (error: unknown) {
      this.appliedPromoCode.set(previousCode);
      this.promoError.set(this.errorMessage(error, 'This promo code could not be applied.'));
    } finally {
      this.cdr.markForCheck();
      this.applyingPromo.set(false);
    }
  }

  async removePromoCode(): Promise<void> {
    this.appliedPromoCode.set(null);
    this.promoMessage.set(null);
    this.promoError.set(null);
    this.promoCodeControl.reset('');
    // Toggling the signal around the async call re-renders the new totals (zoneless)
    this.applyingPromo.set(true);
    try {
      await this.calculateTaxForCurrentStep();
    } finally {
      this.cdr.markForCheck();
      this.applyingPromo.set(false);
    }
  }

  /**
   * Step 3: Calculate tax (auto-triggered after billing)
   */
  async calculateTaxForCurrentStep(): Promise<void> {
    if (!this.memberId || !this.addressId) {
      this.error = 'Member and address must be created first.';
      return;
    }
    this.calculatingTax = true;
    this.error = null;
    try {
      await this.refreshTax();
    } catch (e: unknown) {
      this.error = this.errorMessage(e, 'Tax calculation failed');
    } finally {
      this.cdr.markForCheck();
      this.calculatingTax = false;
    }
  }

  /**
   * Step 4: Create the order on the server (PENDING, priced there), then open the gateway
   * for that order. Nothing about price or payment state is sent from here.
   */
  async proceedFromPreview(): Promise<void> {
    if (!this.memberId || !this.addressId || !this.selectedGateway) {
      this.error = 'Please complete all previous steps.';
      return;
    }
    try {
      this.loading = true;
      this.error = null;
      const common = {
        currency: this.currencyCode,
        addressId: this.addressId,
        billingAddressId: this.addressId,
        promoCode: this.appliedPromoCode() ?? undefined,
        franchisePaymentGatewayId: this.selectedGateway.franchisePaymentGatewayId,
      };
      let request: IPublicProductOrderRequest | IPublicPlanOrderRequest;
      if (this.isProductCheckout) {
        if (!this.productId || !this.productVariantId) {
          throw new Error('Product ID or Variant ID missing');
        }
        request = {
          ...common,
          items: [
            {
              productId: this.productId,
              productVariantId: this.productVariantId,
              quantity: this.productQuantity,
            },
          ],
        };
      } else {
        if (!this.programPlanId) {
          throw new Error('Program Plan ID missing');
        }
        request = { ...common, programPlanId: this.programPlanId };
      }
      // Going back and paying again for the same selection reuses the same PENDING order.
      const requestKey = JSON.stringify(request);
      if (!this.checkoutOrder || this.checkoutOrderKey !== requestKey) {
        const recaptchaToken = await this.getRecaptchaToken('checkout_order');
        this.checkoutOrder = this.isProductCheckout
          ? await this.checkoutService.createProductOrder(
              this.memberId,
              request as IPublicProductOrderRequest,
              recaptchaToken,
            )
          : await this.checkoutService.createPlanOrder(
              this.memberId,
              request as IPublicPlanOrderRequest,
              recaptchaToken,
            );
        if (!this.checkoutOrder) {
          throw new Error('Failed to create your order. Please try again.');
        }
        this.checkoutOrderKey = requestKey;
      }
      // Move to a payment step
      this.moveToNextStep();
      await this.initializePaymentFlow();
    } catch (error: unknown) {
      console.error('Error creating order:', error);
      this.error = this.errorMessage(error, 'Failed to create your order. Please try again.');
    } finally {
      this.cdr.markForCheck();
      this.loading = false;
    }
  }

  /**
   * Step 5: Open the gateway checkout for the server-created order
   */
  async initializePaymentFlow(): Promise<void> {
    if (!this.checkoutOrder) {
      this.error = 'Order not created. Please go back and try again.';
      return;
    }
    try {
      this.processingPayment = true;
      this.showPaymentModal = true;
      this.error = null;
      const description = this.isProductCheckout
        ? `Payment for ${this.productName || 'products'}`
        : `Payment for ${this.programPlan?.plan || 'plan'}`;
      await this.paymentService.initializePayment(
        this.checkoutOrder.gateway,
        description,
        async (paymentId: string, orderId: string, signature: string) => {
          await this.handlePaymentSuccess(paymentId, orderId, signature);
        },
        (error: Error) => {
          this.handlePaymentError(error);
        },
      );
    } catch (error: unknown) {
      console.error('Error initializing payment:', error);
      this.handlePaymentError(error);
    }
  }

  /**
   * The gateway reported success: ask the server to verify it with the gateway.
   * If it cannot confirm yet, the webhook will; the success page shows the live status.
   */
  async handlePaymentSuccess(
    paymentId: string,
    orderId: string,
    signature: string,
  ): Promise<void> {
    this.orderId = orderId;
    this.paymentId = paymentId;
    let verified = false;
    try {
      if (!this.memberId) {
        throw new Error('Member ID is required');
      }
      const verifyRequest = { orderId, paymentId, signature };
      const verifyResponse = this.isProductCheckout
        ? await this.paymentService.verifyPayment(this.memberId, verifyRequest)
        : await this.paymentService.verifyPlanPayment(this.memberId, verifyRequest);
      verified = verifyResponse.verified;
    } catch (error: unknown) {
      console.warn('Payment verification did not complete; the webhook will confirm it:', error);
    }
    this.processingPayment = false;
    this.showPaymentModal = false;
    this.paymentSuccess = true;
    this.paymentPending = !verified;
    this.moveToStep(this.STEP_INDICES.RESULT);
    // Let the customer see the result, then show the order (and its live status)
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.navigateToSuccess();
      }, 1500);
    } else {
      this.navigateToSuccess();
    }
  }

  private async getRecaptchaToken(action: string): Promise<string | undefined> {
    if (!this.recaptchaService.isAvailable()) {
      return undefined;
    }
    try {
      return await this.recaptchaService.getToken(action);
    } catch (recaptchaError: unknown) {
      console.warn('Failed to get reCAPTCHA token:', recaptchaError);
      return undefined;
    }
  }

  /** API errors arrive as `{ status, message }` objects, not Error instances. */
  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message: unknown }).message;
      if (typeof message === 'string' && message) {
        return message;
      }
    }
    return fallback;
  }

  /**
   * Handle payment error
   */
  handlePaymentError(error: unknown): void {
    this.processingPayment = false;
    this.showPaymentModal = false;
    this.paymentSuccess = false;
    this.paymentPending = false;
    this.paymentError = this.errorMessage(error, 'Payment failed. Please try again.');
    this.moveToStep(this.STEP_INDICES.RESULT);
  }

  /**
   * Navigate to success page
   */
  navigateToSuccess(): void {
    const queryParams: Record<string, string | number | null> = {
      orderId: this.orderId,
      paymentId: this.paymentId,
    };
    if (!this.isProductCheckout && this.programPlanId) {
      queryParams.planId = this.programPlanId;
    }
    this.router.navigate(['/checkout/success'], { queryParams });
  }

  /**
   * Helper methods for stepper navigation
   */
  moveToNextStep(): void {
    if (this.stepper) {
      this.stepper.next();
      // Update currentStepIndex signal after stepper updates
      Promise.resolve().then(() => {
        this.currentStepIndex.set(this.stepper.selectedIndex);
      });
    }
  }

  moveToPreviousStep(): void {
    if (this.stepper) {
      this.stepper.previous();
      // Update currentStepIndex signal after stepper updates
      Promise.resolve().then(() => {
        this.currentStepIndex.set(this.stepper.selectedIndex);
      });
    }
  }

  moveToStep(stepIndex: number): void {
    if (this.stepper) {
      this.stepper.selectedIndex = stepIndex;
      // Update currentStepIndex signal after stepper updates
      Promise.resolve().then(() => {
        this.currentStepIndex.set(stepIndex);
      });
    }
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Get total amount including tax
   */
  get totalAmount(): number {
    if (this.taxCalculation) {
      return this.taxCalculation.totalAmount;
    }
    if (this.isProductCheckout) {
      return this.productSubtotal;
    }
    return this.orderAmount - this.discountAmount;
  }

  /**
   * Get tax amount
   */
  get taxAmount(): number {
    return this.taxCalculation?.taxAmount || 0;
  }

  /**
   * Get subtotal for product checkout
   */
  get productSubtotal(): number {
    return this.taxCalculation?.orderAmount || 0;
  }

  /**
   * Get total for product checkout
   */
  get productTotal(): number {
    if (this.taxCalculation) {
      return this.taxCalculation.totalAmount;
    }
    return this.productSubtotal;
  }

  /**
   * Check payment gateway availability for checkout
   * Uses different services based on a checkout type:
   * - Products: getSupportedPaymentGateways (BusinessTypeEnum.PRODUCT)
   * - Plans: getSupportedPaymentGatewaysForPlan (BusinessTypeEnum.SERVICE)
   */
  async checkPaymentGatewayAvailability(): Promise<void> {
    try {
      this.paymentGatewayLoading = true;
      this.error = null; // Clear any previous errors
      const gateways = this.isProductCheckout
        ? await this.checkoutService.getSupportedPaymentGateways(
            this.currencyCode,
          )
        : await this.checkoutService.getSupportedPaymentGatewaysForPlan(
            this.currencyCode,
          );
      this.paymentGateways = gateways || [];
      if (!gateways || gateways.length === 0) {
        this.isPaymentGatewayAvailable = false;
        // Don't set an error here, let the template show the message
      } else {
        this.isPaymentGatewayAvailable = true;
        // Select the first active / primary gateway
        this.selectedGateway = gateways.find((g) => g.isPrimary) || gateways[0];
      }
    } catch (error) {
      this.isPaymentGatewayAvailable = false;
      this.error =
        'Failed to check payment gateway availability. Please try again.';
    } finally {
      this.cdr.markForCheck();
      this.paymentGatewayLoading = false;
    }
  }

  async loadProductDetails() {
    try {
      this.loading = true;
      this.error = null;
      this.product = await this.productService.getProducts(
        this.productId,
        this.productVariantId,
      );
      const variant = this.product.variants.find((value, index) => {
        return value.productVariantId === this.productVariantId;
      });
      if (!variant) {
        this.error = 'No product selected. Please select a product first.';
        return;
      }
      const fees = variant.prices.find((value, index) => {
        return value.price === this.productPrice;
      });
      if (!fees) {
        this.error = 'No product selected. Please select a product first.';
        return;
      }
      this.currencyCode = fees.currency;
      this.productPrice = fees.price;
      this.productName = this.product.name;
      this.productUnit = variant.quantityValue + ' ' + variant.quantityUnit;
      this.orderAmount = this.productPrice * this.productQuantity;
    } catch (error: unknown) {
      console.error('Error loading product details:', error);
      this.error =
        error instanceof Error
          ? error.message
          : 'Failed to load product details.';
    } finally {
      this.cdr.markForCheck();
      this.loading = false;
    }
  }

  /**
   * Get state name by ID
   */
  getStateName(stateId: number | null): string {
    if (!stateId) return '';
    const state = this.stateOptions.find((s) => s.id === stateId);
    return state?.label || '';
  }

  /**
   * Get country name by ID
   */
  getCountryName(countryId: number | null): string {
    if (!countryId) return '';
    const country = this.countryOptions.find((c) => c.id === countryId);
    return country?.label || '';
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.basicDetailsForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'This field is required';
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('pattern')) {
      return 'Please enter a valid value';
    }
    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength']?.requiredLength;
      return `Maximum length is ${maxLength} characters`;
    }
    return '';
  }

  /** Visual stepper config */
  readonly stepperSteps = [
    { label: 'Billing Details', hint: 'Who & where' },
    { label: 'Review Order', hint: 'Items & tax' },
    { label: 'Payment', hint: 'Secure gateway' },
    { label: 'Result', hint: 'All done' },
  ];

  /** Sync currentStepIndex when mat-stepper changes */
  onStepperSelectionChange(selectedIndex: number): void {
    this.currentStepIndex.set(selectedIndex);
  }

  /** Page sub-heading driven by current step */
  currentSubheading(): string {
    switch (this.currentStepIndex()) {
      case this.STEP_INDICES.BILLING:
        return 'A few quick details and your order is on its way.';
      case this.STEP_INDICES.PREVIEW:
        return 'Review your order before confirming payment.';
      case this.STEP_INDICES.PAYMENT:
        return 'Pay securely via our PCI-DSS compliant gateway.';
      case this.STEP_INDICES.RESULT:
        return this.paymentSuccess
          ? 'Your order has been placed successfully.'
          : 'There was an issue with your payment.';
      default:
        return '';
    }
  }

  /**
   * Plans: an Indian billing address pays the INR fee; any other country pays the plan's
   * foreign-currency fee when one exists (USD first), which makes the sale an export at 0%.
   * Without one the INR fee applies and the server adds IGST (roadmap 4.6, decision 12).
   */
  private applyPlanCurrencyForBillingCountry(): void {
    const fees = this.programPlan?.programPlanFees ?? [];
    if (this.isProductCheckout || fees.length === 0) {
      return;
    }
    const countryId = Number(this.basicDetailsForm.get('countryId')?.value);
    const country = this.countryOptions.find((c) => Number(c.id) === countryId);
    const isIndia = (country?.label || '').trim().toLowerCase() === 'india';
    const inr = fees.find((f) => f.currencyCode === 'INR');
    const foreign = fees.find((f) => f.currencyCode === 'USD') ?? fees.find((f) => f.currencyCode !== 'INR');
    const fee = isIndia ? inr ?? fees[0] : foreign ?? inr ?? fees[0];
    if (fee.currencyCode !== this.currencyCode) {
      // A different currency is a different order: drop the previous quote
      this.taxCalculation = null;
    }
    this.currencyCode = fee.currencyCode;
    this.orderAmount = fee.fees;
  }

  /** Customer-facing label for the tax the server decided. */
  get taxLabel(): string {
    const line = this.taxCalculation?.items?.[0];
    if (!line) {
      return 'Tax';
    }
    const pct = Number(line.taxPercentage || 0);
    switch (line.taxMode) {
      case TaxMode.EXPORT_OF_SERVICE:
      case TaxMode.EXPORT_OF_GOODS:
        return line.isLutApplied ? 'Export – 0% (LUT)' : `IGST ${pct}% (export)`;
      case TaxMode.VAT:
        return line.taxCategory === TaxCategoryEnum.ZERO_RATED ? `VAT 0% (zero-rated)` : `VAT ${pct}%`;
      case TaxMode.DOMESTIC_GST:
        return line.taxObj && 'IGST' in line.taxObj ? `IGST ${pct}%` : `GST ${pct}%`;
      default:
        return line.taxType === TaxTypeEnum.NONE ? 'No tax' : 'Tax';
    }
  }

  /** Order summary sidebar items */
  get sidebarItems(): ICheckoutSidebarItem[] {
    if (this.isProductCheckout) {
      const image = this.product?.imagePath?.[0]?.webUrl ?? null;
      return [
        {
          key: `product-${this.productVariantId ?? 'na'}`,
          name: this.productName || 'Product',
          variant: this.productUnit || '',
          qty: this.productQuantity,
          price: this.productPrice,
          image,
        },
      ];
    }
    if (this.programPlan) {
      return [
        {
          key: `plan-${this.programPlanId ?? 'na'}`,
          name: this.programPlan.plan || 'Plan',
          variant: '',
          qty: 1,
          price: this.orderAmount,
          image: null,
        },
      ];
    }
    return [];
  }

  get totalQuantity(): number {
    return this.sidebarItems.reduce((s, i) => s + i.qty, 0);
  }

  get subtotalDisplay(): number {
    if (this.taxCalculation) {
      return this.taxCalculation.orderAmount;
    }
    return this.sidebarItems.reduce((s, i) => s + i.price * i.qty, 0);
  }

  get grandTotalDisplay(): number {
    if (this.taxCalculation) {
      return this.taxCalculation.totalAmount;
    }
    return this.subtotalDisplay;
  }
}
