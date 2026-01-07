import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GoogleService, GoogleReview } from '../../services/google.service';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { BannerService } from '../../services/banner.service';
import { BannerForEnum } from 'eatfit247-shared-library';

interface ContactPageData {
  page: string;
  url: string;
  sections: Section[];
}

interface Section {
  id: string;
  type: string;
  [key: string]: any;
}

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ImageSliderComponent,
  ],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss',
})
export class ContactUsComponent implements OnInit {
  private readonly googleService = inject(GoogleService);
  private readonly bannerService = inject(BannerService);
  
  contactForm!: FormGroup;
  formSubmitted = false;
  formSuccess = false;
  formError = false;
  errorMessage = '';
  googleReviews: GoogleReview[] = [];
  reviewsLoading = true;
  heroSliderItems: SliderItem[] = [];

  pageData: ContactPageData = {
    page: 'Contact Us',
    url: '/contact-us',
    sections: [
      {
        id: 'quick_contact_boxes',
        type: 'contact_options',
        columns: 3,
        items: [
          {
            title: 'WhatsApp Support',
            description: 'Chat with us instantly',
            icon: 'whatsapp',
            cta: 'Chat Now',
            link: 'https://wa.me/91XXXXXXXXXX',
          },
          {
            title: 'Call Us',
            description: '+91-XXXXXXXXXX',
            icon: 'phone',
            cta: 'Tap to Call',
            link: 'tel:+91XXXXXXXXXX',
          },
          {
            title: 'Email',
            description: 'support@eatfit247.com',
            icon: 'email',
            cta: 'Send Mail',
            link: 'mailto:support@eatfit247.com',
          },
        ],
      },
      {
        id: 'contact_form',
        type: 'form',
        title: 'Get Personal Health Guidance',
        subtitle:
          'Fill out this form and our nutrition experts will get back to you shortly.',
        fields: [
          { name: 'name', type: 'text', label: 'Full Name', required: true },
          {
            name: 'phone',
            type: 'phone',
            label: 'Phone Number',
            required: true,
          },
          {
            name: 'email',
            type: 'email',
            label: 'Email Address',
            required: false,
          },
          {
            name: 'message',
            type: 'textarea',
            label: 'Your Message',
            required: false,
          },
        ],
        submit_button: {
          label: 'Get My Health Plan',
          style: 'primary',
        },
        success_message:
          'Thank you! Our nutritionist will contact you shortly.',
      },
      {
        id: 'map_location',
        type: 'location',
        title: 'Visit Us',
        address: '123 Wellness Avenue, Mumbai, Maharashtra, India',
        working_hours: {
          mon_sat: '9:00 AM – 7:00 PM',
          sunday: 'Closed',
        },
        google_map_embed:
          'https://www.google.com/maps/embed?pb=YOUR_MAP_CODE',
      },
      {
        id: 'testimonials',
        type: 'social_proof',
        title: 'What Our Clients Say',
        items: [
          {
            rating: 5,
            text: 'The team responds super fast and truly understands your health goals.',
            author: 'Aditi Sharma',
          },
          {
            rating: 5,
            text: 'Their guidance changed my lifestyle completely. Amazing support!',
            author: 'Rahul Verma',
          },
        ],
      },
    ],
  };

  constructor(
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadGoogleReviews();
    this.loadBannerData();
  }

  /**
   * Load banner slider data
   */
  private loadBannerData(): void {
    this.bannerService.getBannerSlidesForPage(BannerForEnum.CONTACT_US).subscribe({
      next: (items) => {
        this.heroSliderItems = items;
      },
      error: (error) => {
        console.error('Failed to load banner data:', error);
        this.heroSliderItems = [];
      },
    });
  }

  /**
   * Load Google reviews for testimonials section
   */
  loadGoogleReviews(): void {
    this.reviewsLoading = true;
    this.googleService.getReviewsLimited(6).subscribe({
      next: (reviews) => {
        this.googleReviews = reviews;
        this.reviewsLoading = false;
      },
      error: (error) => {
        console.error('Error loading Google reviews:', error);
        this.reviewsLoading = false;
        // Fallback reviews will be used from service
        this.googleReviews = [];
      },
    });
  }

  initForm(): void {
    const formSection = this.pageData.sections.find(
      (s) => s.type === 'form'
    );
    if (!formSection) return;

    const formControls: any = {};
    const fields = (formSection as any)['fields'] || [];
    fields.forEach((field: any) => {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === 'email') {
        validators.push(Validators.email);
      }
      if (field.type === 'phone') {
        validators.push(Validators.pattern(/^[0-9+\-\s()]+$/));
      }
      formControls[field.name] = ['', validators];
    });

    this.contactForm = this.fb.group(formControls);
  }

  async onSubmit(): Promise<void> {
    if (this.contactForm.valid) {
      this.formSubmitted = true;
      this.formSuccess = false;
      this.formError = false;
      this.errorMessage = '';

      try {
        // Execute reCAPTCHA v3
        const recaptchaToken = await this.googleService.executeRecaptcha('contact_form_submit');

        // Prepare form data with reCAPTCHA token
        const formData = {
          ...this.contactForm.value,
          recaptchaToken,
        };

        // TODO: Send form data to backend API
        // Example:
        // this.http.post('/api/v2/contact', formData).subscribe({
        //   next: (response) => {
        //     this.formSuccess = true;
        //     this.contactForm.reset();
        //     setTimeout(() => {
        //       this.formSubmitted = false;
        //       this.formSuccess = false;
        //     }, 3000);
        //   },
        //   error: (error) => {
        //     this.formError = true;
        //     this.errorMessage = 'Failed to submit form. Please try again.';
        //     this.formSubmitted = false;
        //   }
        // });

        // For now, simulate successful submission
        console.log('Form submitted with reCAPTCHA token:', formData);
        this.formSuccess = true;
        
        // Reset form after 3 seconds
        setTimeout(() => {
          this.contactForm.reset();
          this.formSubmitted = false;
          this.formSuccess = false;
        }, 3000);
      } catch (error) {
        console.error('reCAPTCHA error:', error);
        this.formError = true;
        this.errorMessage = 'reCAPTCHA verification failed. Please try again.';
        this.formSubmitted = false;
      }
    } else {
      this.contactForm.markAllAsTouched();
    }
  }

  getSection(type: string): any {
    return this.pageData.sections.find((s) => s.type === type);
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

  getIconName(icon: string): string {
    const iconMap: { [key: string]: string } = {
      whatsapp: 'chat',
      phone: 'phone',
      email: 'email',
    };
    return iconMap[icon] || icon;
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
