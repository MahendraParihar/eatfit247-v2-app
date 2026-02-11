import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonComponent, ContainerComponent, SectionComponent, BannerComponent } from '@shared-ui';
import { BannerService } from '../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IMediaUpload } from '@eatfit247-shared-library/core';
import { RecaptchaService } from '../../core/services/recaptcha.service';
import { HttpService } from '../../core/services/http.service';

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
    ContainerComponent,
    ButtonComponent,
    BannerComponent
  ],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss',
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' }
    }
  ]
})
export class ContactUsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly recaptchaService = inject(RecaptchaService);
  private readonly httpService = inject(HttpService);
  private readonly bannerService = inject(BannerService);
  contactForm!: FormGroup;
  formSubmitted = false;
  formSuccess = false;
  formError = false;
  errorMessage = '';
  readonly contactInfo = {
    phone: '+91-859-185-4209',
    email: 'eatfit24by7@gmail.com'
  };

  banners: IMediaUpload[] = [];

  ngOnInit(): void {
    this.initForm();
    void this.loadBannerData();
  }

  private initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      subject: ['', [Validators.required]],
      message: ['']
    });
  }

  /**
   * Load banner images for Contact Us page.
   */
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
          recaptchaToken: recaptchaToken
        };
        const response = await this.httpService.post<{
          contactFormId: number;
          message: string;
        }>('public/contact/submit', formData);
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

