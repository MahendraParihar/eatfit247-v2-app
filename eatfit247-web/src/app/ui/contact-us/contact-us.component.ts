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
import { GoogleReviewsService, GoogleReview } from '../../services/google-reviews.service';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';

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
  private readonly googleReviewsService = inject(GoogleReviewsService);
  
  contactForm!: FormGroup;
  formSubmitted = false;
  formSuccess = false;
  googleReviews: GoogleReview[] = [];
  reviewsLoading = true;
  heroSliderItems: SliderItem[] = [];

  // Trust icons for banner description
  readonly trustIcons: string[] = [
    '2000+ clients served',
    'Certified Nutritionists',
    'Fast Response Time',
  ];

  // Banner data object
  readonly bannerData: SliderItem = {
    id: 'contact-hero',
    imageUrl: '/assets/images/shweta-shah.jpg',
    imageAlt: 'Shweta Shah - Celebrity Nutritionist',
    imagePosition: 'left',
    shortDescription: "We're Here to Guide You Toward Your Best Health",
    title: "We're Here to Guide You Toward Your Best Health",
    description: this.trustIcons.join(' • '), // Trust icons in one line separated by bullet
    primaryActionText: 'Chat on WhatsApp',
    primaryActionUrl: 'https://wa.me/91XXXXXXXXXX',
    secondaryActionText: 'Call Us',
    secondaryActionUrl: 'tel:+91XXXXXXXXXX',
  };

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
    // Initialize banner items from direct object with trust icons in description
    const bannerWithTrustIcons = {
      ...this.bannerData,
      description: this.trustIcons.join(' • '), // Trust icons in one line separated by bullet
    };
    this.heroSliderItems = [bannerWithTrustIcons];
  }

  /**
   * Load Google reviews for testimonials section
   */
  loadGoogleReviews(): void {
    this.reviewsLoading = true;
    this.googleReviewsService.getReviewsLimited(6).subscribe({
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

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.formSubmitted = true;
      this.formSuccess = true;
      // TODO: Implement form submission logic
      console.log('Form submitted:', this.contactForm.value);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        this.contactForm.reset();
        this.formSubmitted = false;
        this.formSuccess = false;
      }, 3000);
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
