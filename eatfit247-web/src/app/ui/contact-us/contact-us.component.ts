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
import { MatExpansionModule } from '@angular/material/expansion';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { SocialLink } from '../shared/social-icons/social-icons.component';
import { JoinShwetaShahComponent } from '../shared/join-shweta-shah/join-shweta-shah.component';
import { SectionFaqComponent } from '../shared/section-faq/section-faq.component';
import { BannerService } from '../../services/banner.service';
import { RecaptchaService } from '../../services/recaptcha.service';
import { HttpService } from '../../services/http.service';
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
    MatExpansionModule,
    ImageSliderComponent,
    JoinShwetaShahComponent,
    SectionFaqComponent
  ],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss'
})
export class ContactUsComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly recaptchaService = inject(RecaptchaService);
  private readonly httpService = inject(HttpService);
  contactForm!: FormGroup;
  formSubmitted = false;
  formSuccess = false;
  formError = false;
  errorMessage = '';
  reviewsLoading = true;
  googleReviews: any[] = [];
  heroSliderItems: SliderItem[] = [];
  
  readonly contactInfo = {
    address: '943-951 N. Broadway, Los Angeles, CA 90012, United States',
    phone: '+91-859-185-4209',
    email: 'eatfit24by7@gmail.com'
  };

  readonly contactImage = '/assets/images/shweta-shah.jpg';

  readonly socialLinks: SocialLink[] = [
    {
      name: 'Facebook',
      icon: '/assets/images/social/facebook.svg',
      url: 'https://www.facebook.com/eatfit24by7',
    },
    {
      name: 'Twitter',
      icon: '/assets/images/social/twitter.svg',
      url: 'https://twitter.com/eatfit24by7',
    },
    {
      name: 'Instagram',
      icon: '/assets/images/social/instagram.svg',
      url: 'https://www.instagram.com/eatfit24by7',
    },
    {
      name: 'YouTube',
      icon: '/assets/images/social/youtube.svg',
      url: 'https://www.youtube.com/eatfit24by7',
    },
    {
      name: 'Pinterest',
      icon: '/assets/images/social/pinterest.svg',
      url: 'https://www.pinterest.com/eatfit24by7',
    },
    {
      name: 'LinkedIn',
      icon: '/assets/images/social/linkedin.svg',
      url: 'https://www.linkedin.com/company/eatfit24by7',
    },
  ];


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
            link: 'https://wa.me/91XXXXXXXXXX'
          },
          {
            title: 'Call Us',
            description: '+91-XXXXXXXXXX',
            icon: 'phone',
            cta: 'Tap to Call',
            link: 'tel:+91XXXXXXXXXX'
          },
          {
            title: 'Email',
            description: 'support@eatfit247.com',
            icon: 'email',
            cta: 'Send Mail',
            link: 'mailto:support@eatfit247.com'
          }
        ]
      },
      {
        id: 'contact_form',
        type: 'form',
        title: 'Get Personal Health Guidance',
        subtitle: 'Fill out this form and our nutrition experts will get back to you shortly.',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true },
          {
            name: 'email',
            type: 'email',
            label: 'Email',
            required: true
          },
          {
            name: 'phone',
            type: 'phone',
            label: 'Phone',
            required: false
          },
          {
            name: 'subject',
            type: 'text',
            label: 'Subject',
            required: false
          },
          {
            name: 'message',
            type: 'textarea',
            label: 'Leave us a message',
            required: false
          }
        ],
        submit_button: {
          label: 'Get My Health Plan',
          style: 'primary'
        },
        success_message: 'Thank you! Our nutritionist will contact you shortly.'
      },
      {
        id: 'map_location',
        type: 'location',
        title: 'Visit Us',
        address: '123 Wellness Avenue, Mumbai, Maharashtra, India',
        working_hours: {
          mon_sat: '9:00 AM – 7:00 PM',
          sunday: 'Closed'
        },
        google_map_embed: 'https://www.google.com/maps/embed?pb=YOUR_MAP_CODE'
      },
      {
        id: 'testimonials',
        type: 'social_proof',
        title: 'What Our Clients Say',
        items: [
          {
            rating: 5,
            text: 'The team responds super fast and truly understands your health goals.',
            author: 'Aditi Sharma'
          },
          {
            rating: 5,
            text: 'Their guidance changed my lifestyle completely. Amazing support!',
            author: 'Rahul Verma'
          }
        ]
      }
    ]
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.loadGoogleReviews();
    this.loadBannerData();
  }

  /**
   * Load banner slider data
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.heroSliderItems = await this.bannerService.getBannerSlidesForPage(
        BannerForEnum.CONTACT_US
      );
    } catch (error) {
      console.error('Failed to load banner data:', error);
      this.heroSliderItems = [];
    }
  }

  /**
   * Load Google reviews for testimonials section
   */
  loadGoogleReviews(): void {
    this.reviewsLoading = true;
  }

  initForm(): void {
    const formSection = this.pageData.sections.find((s) => s.type === 'form');
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
        // Get reCAPTCHA token
        let recaptchaToken: string | undefined;
        if (this.recaptchaService.isAvailable()) {
          try {
            recaptchaToken = await this.recaptchaService.getToken('contact_form_submit');
          } catch (error) {
            console.error('Failed to get reCAPTCHA token:', error);
            this.formError = true;
            this.errorMessage = 'Failed to verify reCAPTCHA. Please refresh the page and try again.';
            this.formSubmitted = false;
            return;
          }
        }

        // Prepare form data with reCAPTCHA token
        const formData = {
          name: this.contactForm.value.name,
          email: this.contactForm.value.email,
          phone: this.contactForm.value.phone || undefined,
          subject: this.contactForm.value.subject || undefined,
          message: this.contactForm.value.message || undefined,
          recaptchaToken: recaptchaToken,
        };

        // Submit to API
        const response = await this.httpService.post<{ contactFormId: number; message: string }>(
          'public/contact/submit',
          formData
        );

        if (response) {
          this.formSuccess = true;
          // Reset form after 3 seconds
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
        this.errorMessage = error.message || 'Failed to submit form. Please try again.';
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
}
