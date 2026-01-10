import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CheckoutService, CheckoutAddressData, TaxCalculationResponse } from '../../services/checkout.service';
import { ProgramPlan } from '../../services/program-plan.service';
import { RecaptchaService } from '../../services/recaptcha.service';
import { ICheckoutMemberData } from 'eatfit247-shared-library';

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

  // Form groups for each step
  basicDetailsForm!: FormGroup;
  addressForm!: FormGroup;
  paymentForm!: FormGroup;

  // Data
  programPlan: ProgramPlan | null = null;
  programPlanId: number | null = null;
  memberId: number | null = null;
  addressId: number | null = null;

  // Master data
  countryOptions: Array<{ id: number; label: string; phoneNumberCode: string | null }> = [];
  countryCodeOptions: Array<{ id: string; label: string }> = [];
  stateOptions: Array<{ id: number; label: string; parentId: number }> = [];
  filteredStateOptions: Array<{ id: number; label: string }> = [];

  // Tax calculation
  taxCalculation: TaxCalculationResponse | null = null;
  calculatingTax = false;
  isTaxApplicable = false;

  // Payment
  paymentLink: string | null = null;
  loading = false;
  error: string | null = null;

  // Plan details
  orderAmount = 0;
  discountAmount = 0;
  currencyCode = 'INR';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const planId = params['plan'];

      if (planId) {
        this.programPlanId = +planId;
        this.loadProgramPlan();
      } else {
        this.error = 'No plan selected. Please select a plan first.';
      }
    });

    this.initializeForms();
    this.loadMasterData();
  }

  /**
   * Initialize form groups
   */
  initializeForms(): void {
    // Step 1: Basic Details
    this.basicDetailsForm = this.fb.group({
      firstName: ['Mahendra', [Validators.required, Validators.maxLength(50)]],
      lastName: ['Parihar', [Validators.required, Validators.maxLength(50)]],
      emailId: ['mahendra.parihar10@gmail.com', [Validators.required, Validators.email, Validators.maxLength(100)]],
      countryCode: ['+91', [Validators.required]],
      contactNumber: ['8097421877', [Validators.required, Validators.maxLength(16)]],
      countryId: ['', [Validators.required]]
    });

    // Step 2: Address Details
    this.addressForm = this.fb.group({
      postalAddress: ['K-203', [Validators.required, Validators.maxLength(100)]],
      cityVillage: ['Bhayendar', [Validators.maxLength(100)]],
      stateId: ['', [Validators.required]],
      countryId: ['', [Validators.required]],
      pinCode: ['401101', [Validators.maxLength(10)]],
    });

    // Step 3: Payment Details
    this.paymentForm = this.fb.group({
      isTaxApplicable: [false],
      isPlanFeesIncludedTax: [false],
      promoCode: ['', [Validators.maxLength(100)]]
    });

    // Watch for country changes to filter states
    this.addressForm.get('countryId')?.valueChanges.subscribe(countryId => {
      this.filterStatesByCountry(countryId);
    });

    // Watch for country changes in basic details to auto-set country code
    this.basicDetailsForm.get('countryId')?.valueChanges.subscribe(countryId => {
      this.setCountryCodeByCountry(countryId);
    });
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
        const inrFee = this.programPlan.programPlanFees?.find(f => f.currencyCode === 'INR');
        if (inrFee) {
          this.orderAmount = inrFee.fees;
          this.currencyCode = 'INR';
        } else if (this.programPlan.programPlanFees && this.programPlan.programPlanFees.length > 0) {
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
   * Load master data (country, etc.)
   */
  async loadMasterData(): Promise<void> {
    try {
      const masterData = await this.checkoutService.getCheckoutMasterData();
      if (masterData) {
        this.countryOptions = masterData.country || [];
        this.countryCodeOptions = masterData.countryCode || [];
      }

      const addressMasterData = await this.checkoutService.getAddressMasterData();
      if (addressMasterData) {
        this.stateOptions = addressMasterData.state || [];
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
      return;
    }
    this.filteredStateOptions = this.stateOptions
      .filter(state => state.parentId === countryId)
      .map(state => ({ id: state.id, label: state.label }));
  }

  /**
   * Auto-set country code based on country selection
   */
  setCountryCodeByCountry(countryId: number): void {
    if (!countryId) {
      this.basicDetailsForm.patchValue({ countryCode: '' });
      return;
    }

    const selectedCountry = this.countryOptions.find(
      country => country.id === countryId
    );

    if (selectedCountry && selectedCountry.phoneNumberCode) {
      // Set the country code to match the phone number code
      this.basicDetailsForm.patchValue({ countryCode: selectedCountry.phoneNumberCode });
    } else {
      this.basicDetailsForm.patchValue({ countryCode: '' });
    }
  }

  /**
   * Handle stepper selection change
   */
  async onStepperSelectionChange(event: StepperSelectionEvent): Promise<void> {
    // When moving to step 2, ensure step 1 is completed
    if (event.selectedIndex === 1 && !this.basicDetailsForm.valid) {
      this.markFormGroupTouched(this.basicDetailsForm);
      return;
    }

    // When moving to step 3, ensure step 2 is completed and create member/address
    if (event.selectedIndex === 2) {
      if (!this.basicDetailsForm.valid) {
        this.markFormGroupTouched(this.basicDetailsForm);
        return;
      }
      if (!this.addressForm.valid) {
        this.markFormGroupTouched(this.addressForm);
        return;
      }

      // Create member if not already created
      if (!this.memberId) {
        await this.createMember();
      }

      // Create address if not already created
      if (this.memberId && !this.addressId) {
        await this.createAddress();
      }

      // Calculate tax
      if (this.memberId && this.addressId) {
        await this.calculateTax();
      }
    }
  }

  /**
   * Create member from basic details
   */
  async createMember(): Promise<void> {
    if (!this.basicDetailsForm.valid) {
      this.markFormGroupTouched(this.basicDetailsForm);
      return;
    }

    try {
      this.loading = true;

      const memberData: ICheckoutMemberData = {
        firstName: this.basicDetailsForm.get('firstName')?.value,
        lastName: this.basicDetailsForm.get('lastName')?.value,
        emailId: this.basicDetailsForm.get('emailId')?.value,
        countryCode: this.basicDetailsForm.get('countryCode')?.value,
        contactNumber: this.basicDetailsForm.get('contactNumber')?.value,
        countryId: this.basicDetailsForm.get('countryId')?.value,
      };

      // Get reCAPTCHA token if service is available
      let recaptchaToken: string | undefined;
      if (this.recaptchaService.isAvailable()) {
        try {
          recaptchaToken = await this.recaptchaService.getToken('member_creation');
        } catch (recaptchaError: any) {
          console.warn('Failed to get reCAPTCHA token:', recaptchaError);
          // Continue without token if reCAPTCHA fails (backend will handle the error)
        }
      }

      const result = await this.checkoutService.createMember(memberData, recaptchaToken);
      if (result?.memberId) {
        this.memberId = result.memberId;
      } else {
        throw new Error('Failed to create member');
      }
    } catch (error: any) {
      console.error('Error creating member:', error);
      this.error = error.message || 'Failed to create member. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Create address
   */
  async createAddress(): Promise<void> {
    if (!this.addressForm.valid || !this.memberId) {
      this.markFormGroupTouched(this.addressForm);
      return;
    }

    try {
      this.loading = true;
      const addressData: CheckoutAddressData = {
        postalAddress: this.addressForm.get('postalAddress')?.value,
        cityVillage: this.addressForm.get('cityVillage')?.value || undefined,
        stateId: this.addressForm.get('stateId')?.value,
        countryId: this.addressForm.get('countryId')?.value,
        pinCode: this.addressForm.get('pinCode')?.value || undefined,
        addressName: this.addressForm.get('addressName')?.value || undefined
      };

      const result = await this.checkoutService.createAddress(this.memberId, addressData);
      if (result?.addressId) {
        this.addressId = result.addressId;
      } else {
        throw new Error('Failed to create address');
      }
    } catch (error: any) {
      console.error('Error creating address:', error);
      this.error = error.message || 'Failed to create address. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Calculate tax
   */
  async calculateTax(): Promise<void> {
    if (!this.memberId || !this.addressId) return;

    try {
      this.calculatingTax = true;
      const isTaxApplicable = this.paymentForm.get('isTaxApplicable')?.value || false;
      const isPlanFeesIncludedTax = this.paymentForm.get('isPlanFeesIncludedTax')?.value || false;

      const result = await this.checkoutService.calculateTax(this.memberId, {
        orderAmount: this.orderAmount,
        discountAmount: this.discountAmount,
        isTaxApplicable: isTaxApplicable,
        isPlanFeesIncludedTax: isPlanFeesIncludedTax,
        currencyCode: this.currencyCode,
        billingAddressId: this.addressId
      });

      if (result) {
        this.taxCalculation = result;
        this.isTaxApplicable = isTaxApplicable;
      }
    } catch (error: any) {
      console.error('Error calculating tax:', error);
      this.error = error.message || 'Failed to calculate tax. Please try again.';
    } finally {
      this.calculatingTax = false;
    }
  }

  /**
   * Watch tax applicable checkbox
   */
  onTaxApplicableChange(): void {
    if (this.memberId && this.addressId) {
      this.calculateTax();
    }
  }

  /**
   * Proceed to payment
   */
  async proceedToPayment(): Promise<void> {
    if (!this.paymentForm.valid || !this.memberId) {
      this.markFormGroupTouched(this.paymentForm);
      return;
    }

    try {
      this.loading = true;
      const customerName = `${this.basicDetailsForm.get('firstName')?.value} ${this.basicDetailsForm.get('lastName')?.value}`;
      const totalAmount = this.taxCalculation?.totalAmount || this.orderAmount;

      const paymentLink = await this.checkoutService.createPaymentLink(this.memberId, {
        amount: totalAmount,
        currency: this.currencyCode,
        description: `Payment for ${this.programPlan?.plan || 'Plan'}`,
        customer: {
          name: customerName,
          email: this.basicDetailsForm.get('emailId')?.value,
          contact: `${this.basicDetailsForm.get('countryCode')?.value}${this.basicDetailsForm.get('contactNumber')?.value}`
        },
        notes: {
          programPlanId: this.programPlanId,
          addressId: this.addressId,
          promoCode: this.paymentForm.get('promoCode')?.value || undefined
        }
      });

      if (paymentLink?.short_url) {
        this.paymentLink = paymentLink.short_url;
        // Redirect to payment gateway
        window.location.href = paymentLink.short_url;
      } else {
        throw new Error('Failed to create payment link');
      }
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      this.error = error.message || 'Failed to create payment link. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
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
}

