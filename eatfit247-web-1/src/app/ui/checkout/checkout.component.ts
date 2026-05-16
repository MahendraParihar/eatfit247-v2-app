import {
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
  ICalculateProductVariantTaxRequest,
  ICalculateProductVariantTaxResponse,
  ICheckoutAddressData,
  ICheckoutMemberData,
  IDropdownItem,
  IManageMemberPayment,
  IManageMemberProduct,
  IPaymentGateway,
  IPlanTaxCalculationRequest,
  IProductVariantTaxResult,
  IPublicProduct,
  PaymentSourceEnum,
  PaymentStatusEnum,
} from '@eatfit247-shared-library';
import { ProductService } from '../../core/services/product.service';
import { BreadcrumbsComponent } from '@shared-ui';
import { Subject, takeUntil } from 'rxjs';

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
  paymentOrderResponse: any = null;
  // Plan details
  orderAmount = 0;
  discountAmount = 0;
  currencyCode = 'INR';
  product!: IPublicProduct;
  // Result state
  paymentSuccess = false;
  paymentError: string | null = null;
  orderId: string | null = null;
  paymentId: string | null = null;

  async ngOnInit(): Promise<void> {
    // Initialize forms first to prevent template errors
    this.initializeForms();
    await this.loadMasterData();
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (params) => {
        await this.initFlow(params);
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
      // Calculate tax first, then skip to preview step
      await this.calculateTaxForCurrentStep();
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
      this.loading = false;
    }
  }

  private async checkProductTax() {
    if (!this.productId || !this.productVariantId) {
      throw new Error('Product ID or Variant ID missing');
    }
    const productTaxRequest: ICalculateProductVariantTaxRequest = {
      items: [
        {
          productId: this.productId,
          productVariantId: this.productVariantId,
          quantity: this.productQuantity,
          currency: this.currencyCode,
        },
      ],
      addressId: this.addressId,
      billingAddressId: this.addressId,
      discountAmount: 0,
    };
    if (this.isProductCheckout) {
      this.taxCalculation = await this.checkoutService.calculateProductTax(
        this.memberId,
        productTaxRequest,
      );
    }
    if (this.taxCalculation) {
      this.isTaxApplicable = this.taxCalculation.taxAmount > 0;
    }
  }

  private async checkPlanTax() {
    const taxRequest = <IPlanTaxCalculationRequest>{
      programPlanId: this.programPlanId,
      billingAddressId: this.addressId,
      currency: this.currencyCode,
      discountAmount: 0,
    };
    const tempTaxCalculation = await this.checkoutService.calculateTax(
      this.memberId,
      taxRequest,
    );
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
      if (this.isProductCheckout) {
        await this.checkProductTax();
      } else {
        await this.checkPlanTax();
      }
    } catch (e: unknown) {
      this.error = e instanceof Error ? e.message : 'Tax calculation failed';
    } finally {
      this.calculatingTax = false;
    }
  }

  /**
   * Step 4: Create payment order and initialize payment
   */
  async proceedFromPreview(): Promise<void> {
    if (!this.memberId || !this.addressId || !this.selectedGateway) {
      this.error = 'Please complete all previous steps.';
      return;
    }
    try {
      this.loading = true;
      this.error = null;
      const totalAmount =
        this.taxCalculation?.totalAmount ||
        (this.isProductCheckout ? this.productTotal : this.totalAmount);
      const customerName = `${this.basicDetailsForm.get('firstName')?.value} ${
        this.basicDetailsForm.get('lastName')?.value
      }`;
      // Create a payment order
      if (this.isProductCheckout) {
        if (!this.productId || !this.productVariantId) {
          throw new Error('Product ID or Variant ID missing');
        }
        this.paymentOrderResponse =
          await this.paymentService.createPaymentOrder(this.memberId, {
            amount: totalAmount,
            currency: this.currencyCode,
            description: `Payment for ${this.productName}`,
            franchisePaymentGatewayId:
              this.selectedGateway.franchisePaymentGatewayId,
            customer: {
              name: customerName,
              email: this.basicDetailsForm.get('email')?.value,
              contact: this.basicDetailsForm.get('phone')?.value,
            },
            notes: {
              productName: this.productName,
              productSku: this.productSku,
              quantity: this.productQuantity,
              addressId: this.addressId,
              orderNotes:
                this.basicDetailsForm.get('orderNotes')?.value || undefined,
            },
          });
      } else {
        if (!this.programPlanId) {
          throw new Error('Program Plan ID missing');
        }
        this.paymentOrderResponse =
          await this.paymentService.createPlanPaymentOrder(this.memberId, {
            amount: totalAmount,
            currency: this.currencyCode,
            description: `Payment for ${this.programPlan?.plan || 'Plan'}`,
            franchisePaymentGatewayId:
              this.selectedGateway.franchisePaymentGatewayId,
            customer: {
              name: customerName,
              email: this.basicDetailsForm.get('email')?.value,
              contact: this.basicDetailsForm.get('phone')?.value,
            },
            notes: {
              programPlanId: this.programPlanId,
              addressId: this.addressId,
              orderNotes:
                this.basicDetailsForm.get('orderNotes')?.value || undefined,
            },
          });
      }
      // Move to a payment step
      this.moveToNextStep();
      await this.initializePaymentFlow();
    } catch (error: unknown) {
      console.error('Error creating payment order:', error);
      this.error =
        error instanceof Error
          ? error.message
          : 'Failed to create payment order. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Step 5: Initialize payment flow
   */
  async initializePaymentFlow(): Promise<void> {
    if (!this.paymentOrderResponse) {
      this.error = 'Payment order not created. Please go back and try again.';
      return;
    }
    try {
      this.processingPayment = true;
      this.showPaymentModal = true;
      this.error = null;
      await this.paymentService.initializePayment(
        this.paymentOrderResponse,
        async (paymentId: string, orderId: string, signature?: string) => {
          // Payment successful callback
          await this.handlePaymentSuccess(paymentId, orderId, signature);
        },
        (error: unknown) => {
          // Payment failed callback
          this.handlePaymentError(error);
        },
      );
    } catch (error: unknown) {
      console.error('Error initializing payment:', error);
      this.handlePaymentError(error);
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(
    paymentId: string,
    orderId: string,
    signature?: string,
  ): Promise<void> {
    try {
      if (!this.memberId) {
        throw new Error('Member ID is required');
      }
      // Verify payment
      const verifyResponse = this.isProductCheckout
        ? await this.paymentService.verifyPayment(this.memberId, {
            gatewayCode: this.paymentOrderResponse.gatewayCode,
            paymentId: paymentId,
            orderId: orderId,
            signature: signature,
          })
        : await this.paymentService.verifyPlanPayment(this.memberId, {
            gatewayCode: this.paymentOrderResponse.gatewayCode,
            paymentId: paymentId,
            orderId: orderId,
            signature: signature,
          });
      if (!verifyResponse.verified) {
        throw new Error('Payment verification failed');
      }
      const discountAmount = this.taxCalculation?.discountAmount || 0;
      const totalAmount =
        this.taxCalculation?.totalAmount ||
        (this.isProductCheckout ? this.productTotal : this.totalAmount);
      let recaptchaToken: string | undefined;
      if (this.recaptchaService.isAvailable()) {
        try {
          recaptchaToken =
            await this.recaptchaService.getToken('checkout_order');
        } catch (recaptchaError: unknown) {
          console.warn(
            'Failed to get reCAPTCHA token for order:',
            recaptchaError,
          );
        }
      }
      if (this.isProductCheckout) {
        if (!this.productId || !this.productVariantId) {
          throw new Error('Product ID or Variant ID missing');
        }
        const orderData: IManageMemberProduct = {
          paymentModeId: null,
          billingAddressId: this.addressId!,
          addressId: this.addressId!,
          transactionId: paymentId,
          paymentStatusId: PaymentStatusEnum.PAID,
          paymentDate: new Date(),
          currency: this.currencyCode,
          promoCode: undefined,
          gstNumber: undefined,
          paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY,
          discountAmount: discountAmount,
          paymentLink: undefined,
          gatewayProvider: this.paymentOrderResponse.gatewayCode,
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          paymentGatewayResponse: verifyResponse.paymentDetails || {
            paymentId: paymentId,
            orderId: orderId,
            signature: signature,
            gatewayCode: this.paymentOrderResponse.gatewayCode,
            verified: verifyResponse.verified,
          },
          orderItems: [
            {
              productId: this.productId,
              productVariantId: this.productVariantId,
              quantity: this.productQuantity,
              currency: this.currencyCode,
            },
          ],
        };
        await this.checkoutService.createProductOrder(
          this.memberId,
          orderData,
          recaptchaToken,
        );
      } else {
        if (!this.programPlanId) {
          throw new Error('Program Plan ID missing');
        }
        const orderData: IManageMemberPayment = {
          memberId: this.memberId,
          paymentModeId: null,
          billingAddressId: this.addressId,
          addressId: this.addressId,
          transactionId: paymentId,
          paymentDate: new Date(),
          paymentStatusId: PaymentStatusEnum.PAID,
          programPlanId: this.programPlanId,
          currency: this.currencyCode,
          promoCode: undefined,
          gstNumber: undefined,
          paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY,
          discountAmount: discountAmount,
          gatewayProvider: this.paymentOrderResponse.gatewayCode,
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          paymentGatewayResponse: verifyResponse.paymentDetails || {
            paymentId: paymentId,
            orderId: orderId,
            signature: signature,
            gatewayCode: this.paymentOrderResponse.gatewayCode,
            verified: verifyResponse.verified,
          },
        };
        await this.checkoutService.createPlanOrder(
          this.memberId,
          orderData,
          recaptchaToken,
        );
      }
      // Success - move to a result step
      this.processingPayment = false;
      this.showPaymentModal = false;
      this.paymentSuccess = true;
      this.orderId = orderId;
      this.paymentId = paymentId;
      this.moveToNextStep();
      // Automatically navigate to success page after a short delay to let user see success state
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          this.navigateToSuccess();
        }, 1500);
      } else {
        this.navigateToSuccess();
      }
    } catch (error: unknown) {
      console.error('Error processing payment:', error);
      this.handlePaymentError(error);
    }
  }

  /**
   * Handle payment error
   */
  handlePaymentError(error: unknown): void {
    this.processingPayment = false;
    this.showPaymentModal = false;
    this.paymentSuccess = false;
    this.paymentError =
      error instanceof Error
        ? error.message
        : 'Payment failed. Please try again.';
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
}
