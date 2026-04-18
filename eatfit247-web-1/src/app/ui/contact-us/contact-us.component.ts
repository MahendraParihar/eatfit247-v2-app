import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BannerComponent } from '@shared-ui';
import { BannerService, HttpService, JsonLdService, SEOService } from '../../core/services';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner } from '@eatfit247-shared-library/core';
import { RecaptchaService } from '../../core/services/recaptcha.service';
import { CONTACT_EMAIL, CONTACT_NUMBER } from '../../core/utils/constants';

@Component({
  standalone: true,
  selector: 'app-contact-us',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BannerComponent,
  ],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss',
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
})
export class ContactUsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly recaptchaService = inject(RecaptchaService);
  private readonly httpService = inject(HttpService);
  private readonly bannerService = inject(BannerService);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);
  contactForm!: FormGroup;
  formSubmitted = false;
  formSuccess = false;
  formError = false;
  errorMessage = '';
  readonly contactInfo = [
    {
      title: CONTACT_NUMBER,
      description: CONTACT_NUMBER,
      icon: 'phone',
      cta: 'Tap to Call',
      link: `tel:${CONTACT_NUMBER}`,
    },
    {
      title: CONTACT_EMAIL,
      description: CONTACT_EMAIL,
      icon: 'email',
      cta: 'Send Mail',
      link: `mailto:${CONTACT_EMAIL}`,
    },
  ];
  banners: IPublicBanner[] = [];

  ngOnInit(): void {
    this.seoService.updateSEO({ title: 'Contact Us', description: 'Get in touch with EatFit247 for nutrition consultations, diet plan inquiries, and wellness support.', url: '/contact-us' });
    this.initForm();
    void this.loadBannerData();
    this.jsonLdService.setPageSchema({
      '@type': 'HealthAndBeautyBusiness',
      name: 'EatFit247',
      url: 'https://eatfit24by7.com',
      email: CONTACT_EMAIL,
      telephone: CONTACT_NUMBER,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
      },
      description: 'EatFit247 offers personalised diet consultancy and Ayurvedic wellness products. Contact us for bookings and inquiries.',
      image: 'https://eatfit24by7.com/logo-white.svg',
    } as Record<string, unknown>);
  }

  private initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      subject: ['', [Validators.required]],
      message: [''],
    });
  }

  /**
   * Load banner images for Contact Us page.
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.CONTACT_US
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load banner data for Contact Us page:', error);
      this.banners = [];
    }
  }

  async onSubmit(): Promise<void> {
    if (this.contactForm.valid) {
      this.formSubmitted = true;
      this.formSuccess = false;
      this.formError = false;
      this.errorMessage = '';
      try {
        let recaptchaToken: string | undefined;
        if (this.recaptchaService.isAvailable()) {
          try {
            recaptchaToken = await this.recaptchaService.getToken(
              'contact_form_submit'
            );
          } catch (error) {
            console.error('Failed to get reCAPTCHA token:', error);
            this.formError = true;
            this.errorMessage =
              'Failed to verify reCAPTCHA. Please refresh the page and try again.';
            this.formSubmitted = false;
            return;
          }
        }
        const formData = {
          name: this.contactForm.value.name,
          email: this.contactForm.value.email,
          phone: this.contactForm.value.phone || undefined,
          subject: this.contactForm.value.subject || undefined,
          message: this.contactForm.value.message || undefined,
        };
        const headers: { [key: string]: string } = {};
        if (recaptchaToken) {
          headers['X-Recaptcha-Token'] = recaptchaToken;
        }
        const response = await this.httpService.post<{
          contactFormId: number;
          message: string;
        }>('public/contact/submit', formData, { headers });
        if (response) {
          this.formSuccess = true;
          setTimeout(() => {
            this.contactForm.reset();
            this.formSubmitted = false;
            this.formSuccess = false;
          }, 3000);
        } else {
          throw new Error('No response from server');
        }
      } catch (error: any) {
        console.error('Form submission error:', error);
        this.formError = true;
        this.errorMessage =
          error.message || 'Failed to submit form. Please try again.';
        this.formSubmitted = false;
      }
    } else {
      this.contactForm.markAllAsTouched();
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'This field is required';
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('pattern')) {
      return 'Please enter a valid phone number';
    }
    return '';
  }
}

