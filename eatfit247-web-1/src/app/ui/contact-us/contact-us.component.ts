import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BannerComponent, BreadcrumbsComponent } from '@shared-ui';
import { BannerService, HttpService, JsonLdService, SEOService } from '../../core/services';
import { BannerForEnum, InputLengthEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner } from '@eatfit247-shared-library/core';
import { RecaptchaService } from '../../core/services/recaptcha.service';
import { CONTACT_EMAIL, CONTACT_NUMBER } from '../../core/utils/constants';

@Component({
  standalone: true,
  selector: 'app-contact-us',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BannerComponent, BreadcrumbsComponent],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss',
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
  banners: IPublicBanner[] = [];

  readonly phoneNumber = CONTACT_NUMBER;
  readonly emailAddress = CONTACT_EMAIL;
  readonly whatsappLink = `https://wa.me/${CONTACT_NUMBER.replace(/[^0-9]/g, '')}?text=Hi%20EatFit247%2C%20I%27d%20like%20to%20know%20more%20about%20your%20programs.`;

  readonly maxNameLength = 49;
  readonly maxEmailLength = InputLengthEnum.MAX_EMAIL;
  readonly maxPhoneLength = InputLengthEnum.MAX_CONTACT_NUMBER;
  readonly maxSubjectLength = InputLengthEnum.CHAR_200;
  readonly maxMessageLength = InputLengthEnum.CHAR_1000;

  ngOnInit(): void {
    this.seoService.updateSEO({
      title: 'Contact Us',
      description:
        'Get in touch with EatFit247 for nutrition consultations, diet plan inquiries, and wellness support.',
      url: '/contact-us',
    });
    this.initForm();
    void this.loadBannerData();
    this.jsonLdService.setPageSchema({
      '@type': 'HealthAndBeautyBusiness',
      name: 'EatFit247',
      url: 'https://eatfit24by7.com',
      email: CONTACT_EMAIL,
      telephone: CONTACT_NUMBER,
      address: { '@type': 'PostalAddress', addressCountry: 'IN' },
      description:
        'EatFit247 offers personalised diet consultancy and Ayurvedic wellness products. Contact us for bookings and inquiries.',
      image: 'https://eatfit24by7.com/logo-white.svg',
    } as Record<string, unknown>);
  }

  private initForm(): void {
    this.contactForm = this.fb.group({
      firstName: [
        '',
        [Validators.required, Validators.maxLength(this.maxNameLength)],
      ],
      lastName: [
        '',
        [Validators.required, Validators.maxLength(this.maxNameLength)],
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(this.maxEmailLength),
        ],
      ],
      phone: [
        '',
        [
          Validators.pattern(/^[0-9+\-\s()]+$/),
          Validators.maxLength(this.maxPhoneLength),
        ],
      ],
      subject: ['', [Validators.maxLength(this.maxSubjectLength)]],
      message: ['', [Validators.maxLength(this.maxMessageLength)]],
      agree: [false, [Validators.requiredTrue]],
    });
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.CONTACT_US,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load banner data for Contact Us page:', error);
      this.banners = [];
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.contactForm.valid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.formSubmitted = true;
    this.formSuccess = false;
    this.formError = false;
    this.errorMessage = '';
    try {
      let recaptchaToken: string | undefined;
      if (this.recaptchaService.isAvailable()) {
        try {
          recaptchaToken = await this.recaptchaService.getToken('contact_form_submit');
        } catch (error) {
          console.error('Failed to get reCAPTCHA token:', error);
          this.formError = true;
          this.errorMessage =
            'Failed to verify reCAPTCHA. Please refresh the page and try again.';
          this.formSubmitted = false;
          return;
        }
      }
      const firstName: string = (this.contactForm.value.firstName || '').trim();
      const lastName: string = (this.contactForm.value.lastName || '').trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const subject: string = (this.contactForm.value.subject || '').trim();
      const phone: string = (this.contactForm.value.phone || '').trim();
      const message: string = (this.contactForm.value.message || '').trim();
      const formData = {
        name: fullName,
        email: (this.contactForm.value.email || '').trim(),
        phone: phone || undefined,
        subject: subject || undefined,
        message: message || undefined,
      };
      const headers: { [key: string]: string } = {};
      if (recaptchaToken) {
        headers['X-Recaptcha-Token'] = recaptchaToken;
      }
      const response = await this.httpService.post<{
        contactFormId: number;
        message: string;
      }>('contact/submit', formData, { headers });
      if (response) {
        this.formSuccess = true;
        setTimeout(() => {
          this.contactForm.reset({ agree: false });
          this.formSubmitted = false;
          this.formSuccess = false;
        }, 3000);
      } else {
        throw new Error('No response from server');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this.formError = true;
      const msg = (error as { message?: string })?.message;
      this.errorMessage = msg || 'Failed to submit form. Please try again.';
      this.formSubmitted = false;
    }
  }
}
