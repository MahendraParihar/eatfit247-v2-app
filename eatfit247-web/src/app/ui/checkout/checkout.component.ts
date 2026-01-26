import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  CheckoutService,
  CheckoutAddressData,
  TaxCalculationResponse,
  PaymentGateway
} from '../../services/checkout.service';
import { ProgramPlan } from '../../services/program-plan.service';
import { RecaptchaService } from '../../services/recaptcha.service';
import { PaymentService } from '../../services/payment.service';
import { ICheckoutMemberData, IDropdownItem, PaymentSourceEnum, PaymentStatusEnum } from 'eatfit247-shared-library';
import { sortBy, filter } from 'lodash';

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
    MatCheckboxModule
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly checkoutService = inject(CheckoutService);
  private readonly recaptchaService = inject(RecaptchaService);
  private readonly paymentService = inject(PaymentService);
  // Unified form for both products and plans
  basicDetailsForm!: FormGroup;
  // Data
  programPlan: ProgramPlan | null = null;
  programPlanId: number | null = null;
  memberId: number | null = null;
  addressId: number | null = null;
  // Product checkout data
  isProductCheckout = false;
  productName = '';
  productSize: any = null;
  productPrice = 0;
  productQuantity = 1;
  productSku = '';
  productId: number | null = null;
  productVariantId: number | null = null;
  // Payment gateway
  paymentGateways: PaymentGateway[] = [];
  selectedGateway: PaymentGateway | null = null;
  isPaymentGatewayAvailable = false;
  paymentGatewayLoading = false;
  // Master data
  countryOptions: IDropdownItem[] = [];
  countryCodeOptions: IDropdownItem[] = [];
  stateOptions: IDropdownItem[] = [];
  filteredStateOptions: IDropdownItem[] = [];
  // Tax calculation
  taxCalculation: TaxCalculationResponse | null = null;
  calculatingTax = false;
  isTaxApplicable = false;
  // Payment
  paymentLink: string | null = null;
  loading = false;
  error: string | null = null;
  // Embedded payment
  showPaymentModal = false;
  processingPayment = false;
  // Plan details
  orderAmount = 0;
  discountAmount = 0;
  currencyCode = 'INR';

  ngOnInit(): void {
    this.loadMasterData();
    this.route.queryParams.subscribe((params) => {
      const planId = params['plan'];
      const productName = params['productName'];
      const productPrice = params['productPrice'];
      const productQuantity = params['productQuantity'];
      const productSku = params['productSku'];
      if (planId) {
        this.programPlanId = +planId;
        this.isProductCheckout = false;
        this.initializeForms();
        this.loadProgramPlan();
        // Check payment gateway availability for plans too
        this.checkPaymentGatewayAvailability();
      } else if (productName) {
        this.isProductCheckout = true;
        this.productName = decodeURIComponent(productName);
        this.productPrice = productPrice ? +productPrice : 0;
        this.productQuantity = productQuantity ? +productQuantity : 1;
        this.productSku = productSku ? decodeURIComponent(productSku) : '';
        this.productId = params['productId'] ? +params['productId'] : null;
        this.productVariantId = params['productVariantId'] ? +params['productVariantId'] : null;
        this.orderAmount = this.productPrice * this.productQuantity;
        this.currencyCode = 'INR';
        this.initializeForms();
        // Check payment gateway availability
        this.checkPaymentGatewayAvailability();
      } else {
        this.error = 'No product or plan selected. Please select a product or plan first.';
      }
    });
  }

  /**
   * Initialize form groups
   * Unified form structure for both products and plans
   */
  initializeForms(): void {
    // Use the same unified billing form for both products and plans
    this.basicDetailsForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      companyName: ['', [Validators.maxLength(100)]],
      countryId: ['', [Validators.required]],
      streetAddress1: ['', [Validators.required, Validators.maxLength(200)]],
      streetAddress2: ['', [Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      stateId: ['', [Validators.required]],
      postcode: ['', [Validators.required, Validators.maxLength(10)]],
      phone: ['', [Validators.required, Validators.maxLength(16)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      orderNotes: ['']
    });
    // Watch for country changes to filter states
    this.basicDetailsForm.get('countryId')?.valueChanges.subscribe((countryId) => {
      this.filterStatesByCountry(countryId);
    });
    // Set default country after forms are initialized (if master data is already loaded)
    this.setDefaultCountry();
  }

  /**
   * Load program plan details
   */
  async loadProgramPlan(): Promise<void> {
    if (!this.programPlanId) return;
    try {
      this.loading = true;
      this.programPlan = await this.checkoutService.getProgramPlan(this.programPlanId);
      if (this.programPlan) {
        // Set order amount from plan fees
        const inrFee = this.programPlan.programPlanFees?.find((f) => f.currencyCode === 'INR');
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
      console.error('Error loading program plan:', error);
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
    const indiaCountry = this.countryOptions.find((c) => c.label.toLowerCase() === 'india');
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
      const addressMasterData = await this.checkoutService.getAddressMasterData();
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
    } catch (error) {
      console.error('Error loading master data:', error);
    }
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
    this.filteredStateOptions = sortBy(filter(this.stateOptions, { parentId: countryId }), 'label');
    // Reset state selection if the previously selected state is not in the new country's states
    const isPreviousStateValid = this.filteredStateOptions.some(
      (state) => state.id === previousStateId
    );
    if (!isPreviousStateValid && this.basicDetailsForm) {
      this.basicDetailsForm.patchValue({ stateId: '' }, { emitEvent: false });
    }
  }

  /**
   * Place order for plan checkout
   * Uses the same unified flow as product checkout
   */
  async placePlanOrder(): Promise<void> {
    if (!this.basicDetailsForm.valid) {
      this.markFormGroupTouched(this.basicDetailsForm);
      return;
    }
    try {
      this.loading = true;
      // Create member first
      const memberData: ICheckoutMemberData = {
        firstName: this.basicDetailsForm.get('firstName')?.value,
        lastName: this.basicDetailsForm.get('lastName')?.value,
        emailId: this.basicDetailsForm.get('email')?.value,
        countryCode: '+91', // Default for India
        contactNumber: this.basicDetailsForm.get('phone')?.value,
        countryId: this.basicDetailsForm.get('countryId')?.value
      };
      let recaptchaToken: string | undefined;
      if (this.recaptchaService.isAvailable()) {
        try {
          recaptchaToken = await this.recaptchaService.getToken('member_creation');
        } catch (recaptchaError: any) {
          console.warn('Failed to get reCAPTCHA token:', recaptchaError);
        }
      }
      const memberResult = await this.checkoutService.createMember(memberData, recaptchaToken);
      if (!memberResult?.memberId) {
        throw new Error('Failed to create member');
      }
      this.memberId = memberResult.memberId;
      // Create address
      const addressData: CheckoutAddressData = {
        postalAddress:
          `${this.basicDetailsForm.get('streetAddress1')?.value} ${this.basicDetailsForm.get('streetAddress2')?.value || ''}`.trim(),
        cityVillage: this.basicDetailsForm.get('city')?.value,
        stateId: Number(this.basicDetailsForm.get('stateId')?.value),
        countryId: Number(this.basicDetailsForm.get('countryId')?.value),
        pinCode: this.basicDetailsForm.get('postcode')?.value
      };
      const addressResult = await this.checkoutService.createAddress(this.memberId, addressData);
      if (!addressResult?.addressId) {
        throw new Error('Failed to create address');
      }
      this.addressId = addressResult.addressId;
      // Check payment gateway availability if not already checked
      if (!this.isPaymentGatewayAvailable) {
        await this.checkPaymentGatewayAvailability();
        if (!this.isPaymentGatewayAvailable || !this.selectedGateway) {
          throw new Error('Payment gateway not available');
        }
      }
      // Calculate tax (simplified - using 0% for now, can be enhanced later)
      const taxPercentage = 0;
      const taxAmount = 0;
      const discountAmount = 0;
      const totalAmount = this.orderAmount;
      // Validate programPlanId is available
      if (!this.programPlanId) {
        throw new Error('Program Plan ID missing. Please go back and select the plan again.');
      }
      // Create payment order for embedded checkout (plans)
      const customerName = `${this.basicDetailsForm.get('firstName')?.value} ${this.basicDetailsForm.get('lastName')?.value}`;
      const paymentOrderResponse = await this.paymentService.createPlanPaymentOrder(this.memberId, {
        amount: totalAmount,
        currency: this.currencyCode,
        description: `Payment for ${this.programPlan?.plan || 'Plan'}`,
        franchisePaymentGatewayId: this.selectedGateway?.franchisePaymentGatewayId,
        customer: {
          name: customerName,
          email: this.basicDetailsForm.get('email')?.value,
          contact: this.basicDetailsForm.get('phone')?.value
        },
        notes: {
          programPlanId: this.programPlanId,
          addressId: this.addressId,
          orderNotes: this.basicDetailsForm.get('orderNotes')?.value || undefined
        }
      });
      // Initialize embedded payment
      this.processingPayment = true;
      this.showPaymentModal = true;
      await this.paymentService.initializePayment(
        paymentOrderResponse,
        async (paymentId: string, orderId: string, signature?: string) => {
          // Payment successful - verify payment
          try {
            if (!this.memberId) {
              throw new Error('Member ID is required');
            }
            const verifyResponse = await this.paymentService.verifyPlanPayment(this.memberId, {
              gatewayCode: paymentOrderResponse.gatewayCode,
              paymentId: paymentId,
              orderId: orderId,
              signature: signature
            });
            if (!verifyResponse.verified) {
              throw new Error('Payment verification failed');
            }
            const orderData = {
              paymentModeId: null,
              billingAddressId: this.addressId,
              addressId: this.addressId,
              transactionId: paymentId,
              paymentDate: new Date().toISOString(),
              paymentStatusId: PaymentStatusEnum.PAID,
              programId: null,
              programPlanId: this.programPlanId!,
              noOfCycle: this.programPlan?.noOfCycle || 1,
              noOfDaysInCycle: this.programPlan?.noOfDaysInCycle || 30,
              isTaxApplicable: this.isTaxApplicable,
              taxPercentage: taxPercentage,
              currencyCode: this.currencyCode,
              promoCode: undefined,
              gstNumber: undefined,
              paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY,
              orderAmount: this.orderAmount,
              taxAmount: taxAmount,
              discountAmount: discountAmount,
              totalAmount: totalAmount,
              paymentLink: undefined,
              gatewayProvider: paymentOrderResponse.gatewayCode,
              gatewayOrderId: orderId,
              gatewayPaymentId: paymentId,
              paymentGatewayResponse: verifyResponse.paymentDetails || {
                paymentId: paymentId,
                orderId: orderId,
                signature: signature,
                gatewayCode: paymentOrderResponse.gatewayCode,
                verified: verifyResponse.verified
              }
            };
            // Create order with a reCAPTCHA token
            let recaptchaToken: string | undefined;
            if (this.recaptchaService.isAvailable()) {
              try {
                recaptchaToken = await this.recaptchaService.getToken('checkout_order');
              } catch (recaptchaError: any) {
                console.warn('Failed to get reCAPTCHA token for order:', recaptchaError);
              }
            }
            if (!this.memberId) {
              throw new Error('Member ID is required');
            }
            // Include reCAPTCHA token in order data
            const orderDataWithRecaptcha = {
              ...orderData,
              recaptchaToken: recaptchaToken
            };
            await this.checkoutService.createPlanOrder(this.memberId, orderDataWithRecaptcha);
            // Payment successful - redirect to success page
            this.processingPayment = false;
            this.showPaymentModal = false;
            this.router.navigate(['/checkout/success'], {
              queryParams: {
                orderId: orderId,
                paymentId: paymentId,
                planId: this.programPlanId
              }
            });
          } catch (error: any) {
            console.error('Error processing payment:', error);
            this.processingPayment = false;
            this.showPaymentModal = false;
            this.error = error.message || 'Failed to process payment. Please try again.';
          }
        },
        (error: any) => {
          // Payment failed or cancelled
          console.error('Payment error:', error);
          this.processingPayment = false;
          this.showPaymentModal = false;
          this.error = error.message || 'Payment failed. Please try again.';
        }
      );
    } catch (error: any) {
      console.error('Error placing order:', error);
      this.error = error.message || 'Failed to place order. Please try again.';
    } finally {
      this.loading = false;
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
    return this.productPrice * this.productQuantity;
  }

  /**
   * Get total for product checkout
   */
  get productTotal(): number {
    return this.productSubtotal;
  }

  /**
   * Increment product quantity
   */
  incrementProductQuantity(): void {
    if (this.productQuantity < 5) {
      this.productQuantity++;
      this.orderAmount = this.productPrice * this.productQuantity;
    }
  }

  /**
   * Decrement product quantity
   */
  decrementProductQuantity(): void {
    if (this.productQuantity > 1) {
      this.productQuantity--;
      this.orderAmount = this.productPrice * this.productQuantity;
    }
  }

  /**
   * Update product quantity from input
   */
  updateProductQuantity(value: string): void {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      this.productQuantity = Math.min(numValue, 5);
      this.orderAmount = this.productPrice * this.productQuantity;
    }
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
        ? await this.checkoutService.getSupportedPaymentGateways(this.currencyCode)
        : await this.checkoutService.getSupportedPaymentGatewaysForPlan(this.currencyCode);
      console.log('Payment gateways received:', gateways);
      this.paymentGateways = gateways || [];
      if (!gateways || gateways.length === 0) {
        this.isPaymentGatewayAvailable = false;
        // Don't set an error here, let the template show the message
      } else {
        this.isPaymentGatewayAvailable = true;
        // Select the first active / primary gateway
        this.selectedGateway = gateways.find((g) => g.isPrimary) || gateways[0];
        console.log('Selected payment gateway:', this.selectedGateway);
      }
    } catch (error) {
      console.error('Error checking payment gateway availability:', error);
      this.isPaymentGatewayAvailable = false;
      this.error = 'Failed to check payment gateway availability. Please try again.';
    } finally {
      this.paymentGatewayLoading = false;
    }
  }

  /**
   * Place order for product checkout
   * Creates order in txn_member_products table following Admin pattern
   */
  async placeProductOrder(): Promise<void> {
    if (!this.basicDetailsForm.valid) {
      this.markFormGroupTouched(this.basicDetailsForm);
      return;
    }
    try {
      this.loading = true;
      // Create a member first
      const memberData: ICheckoutMemberData = {
        firstName: this.basicDetailsForm.get('firstName')?.value,
        lastName: this.basicDetailsForm.get('lastName')?.value,
        emailId: this.basicDetailsForm.get('email')?.value,
        countryCode: '+91', // Default for India
        contactNumber: this.basicDetailsForm.get('phone')?.value,
        countryId: this.basicDetailsForm.get('countryId')?.value
      };
      let recaptchaToken: string | undefined;
      if (this.recaptchaService.isAvailable()) {
        try {
          recaptchaToken = await this.recaptchaService.getToken('member_creation');
        } catch (recaptchaError: any) {
          console.warn('Failed to get reCAPTCHA token:', recaptchaError);
        }
      }
      const memberResult = await this.checkoutService.createMember(memberData, recaptchaToken);
      if (!memberResult?.memberId) {
        throw new Error('Failed to create member');
      }
      this.memberId = memberResult.memberId;
      // Create address
      const addressData: CheckoutAddressData = {
        postalAddress:
          `${this.basicDetailsForm.get('streetAddress1')?.value} ${this.basicDetailsForm.get('streetAddress2')?.value || ''}`.trim(),
        cityVillage: this.basicDetailsForm.get('city')?.value,
        stateId: Number(this.basicDetailsForm.get('stateId')?.value),
        countryId: Number(this.basicDetailsForm.get('countryId')?.value),
        pinCode: this.basicDetailsForm.get('postcode')?.value
      };
      const addressResult = await this.checkoutService.createAddress(this.memberId, addressData);
      if (!addressResult?.addressId) {
        throw new Error('Failed to create address');
      }
      this.addressId = addressResult.addressId;
      // Check payment gateway availability if not already checked
      if (!this.isPaymentGatewayAvailable) {
        await this.checkPaymentGatewayAvailability();
        if (!this.isPaymentGatewayAvailable || !this.selectedGateway) {
          throw new Error('Payment gateway not available');
        }
      }
      // Calculate tax (simplified - using 0% for now, can be enhanced later)
      const taxPercentage = 0;
      const taxAmount = 0;
      const discountAmount = 0;
      const totalAmount = this.productTotal;
      // Validate productId and productVariantId are available
      if (!this.productId || !this.productVariantId) {
        throw new Error(
          'Product ID or Variant ID missing. Please go back and select the product again.'
        );
      }
      // Store validated non-null values for TypeScript
      const validatedProductId: number = this.productId;
      const validatedProductVariantId: number = this.productVariantId;
      // Create a payment order for embedded checkout
      const customerName = `${this.basicDetailsForm.get('firstName')?.value} ${this.basicDetailsForm.get('lastName')?.value}`;
      const paymentOrderResponse = await this.paymentService.createPaymentOrder(this.memberId, {
        amount: totalAmount,
        currency: this.currencyCode,
        description: `Payment for ${this.productName}`,
        franchisePaymentGatewayId: this.selectedGateway?.franchisePaymentGatewayId,
        customer: {
          name: customerName,
          email: this.basicDetailsForm.get('email')?.value,
          contact: this.basicDetailsForm.get('phone')?.value
        },
        notes: {
          productName: this.productName,
          productSku: this.productSku,
          quantity: this.productQuantity,
          addressId: this.addressId,
          orderNotes: this.basicDetailsForm.get('orderNotes')?.value || undefined
        }
      });
      // Initialize embedded payment
      this.processingPayment = true;
      this.showPaymentModal = true;
      await this.paymentService.initializePayment(
        paymentOrderResponse,
        async (paymentId: string, orderId: string, signature?: string) => {
          // Payment successful - verify payment
          try {
            if (!this.memberId) {
              throw new Error('Member ID is required');
            }
            const verifyResponse = await this.paymentService.verifyPayment(this.memberId, {
              gatewayCode: paymentOrderResponse.gatewayCode,
              paymentId: paymentId,
              orderId: orderId,
              signature: signature
            });
            if (!verifyResponse.verified) {
              throw new Error('Payment verification failed');
            }
            // Create order in the txn_member_products table
            const orderData = {
              paymentModeId: null,
              billingAddressId: this.addressId,
              addressId: this.addressId,
              transactionId: paymentId,
              paymentDate: new Date().toISOString(),
              paymentStatusId: PaymentStatusEnum.PAID,
              taxPercentage: taxPercentage,
              currencyCode: this.currencyCode,
              promoCode: undefined,
              gstNumber: undefined,
              paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY,
              orderAmount: this.productPrice * this.productQuantity,
              taxAmount: taxAmount,
              discountAmount: discountAmount,
              totalAmount: totalAmount,
              paymentLink: undefined,
              gatewayProvider: paymentOrderResponse.gatewayCode,
              gatewayOrderId: orderId,
              gatewayPaymentId: paymentId,
              paymentGatewayResponse: verifyResponse.paymentDetails || {
                paymentId: paymentId,
                orderId: orderId,
                signature: signature,
                gatewayCode: paymentOrderResponse.gatewayCode,
                verified: verifyResponse.verified
              },
              orderItems: [
                {
                  productId: validatedProductId,
                  productVariantId: validatedProductVariantId,
                  quantity: this.productQuantity,
                  unit: 'pcs',
                  price: this.productPrice,
                  currency: this.currencyCode
                }
              ]
            };
            // Create order with reCAPTCHA token
            let recaptchaToken: string | undefined;
            if (this.recaptchaService.isAvailable()) {
              try {
                recaptchaToken = await this.recaptchaService.getToken('checkout_order');
              } catch (recaptchaError: any) {
                console.warn('Failed to get reCAPTCHA token for order:', recaptchaError);
              }
            }
            if (!this.memberId) {
              throw new Error('Member ID is required');
            }
            // Include reCAPTCHA token in order data
            const orderDataWithRecaptcha = {
              ...orderData,
              recaptchaToken: recaptchaToken
            };
            await this.checkoutService.createProductOrder(this.memberId, orderDataWithRecaptcha);
            // Payment successful - redirect to success page
            this.processingPayment = false;
            this.showPaymentModal = false;
            this.router.navigate(['/checkout/success'], {
              queryParams: {
                orderId: orderId,
                paymentId: paymentId
              }
            });
          } catch (error: any) {
            console.error('Error processing payment:', error);
            this.processingPayment = false;
            this.showPaymentModal = false;
            this.error = error.message || 'Failed to process payment. Please try again.';
          }
        },
        (error: any) => {
          // Payment failed or canceled
          console.error('Payment error:', error);
          this.processingPayment = false;
          this.showPaymentModal = false;
          this.error = error.message || 'Payment failed. Please try again.';
        }
      );
    } catch (error: any) {
      console.error('Error placing order:', error);
      this.error = error.message || 'Failed to place order. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}

