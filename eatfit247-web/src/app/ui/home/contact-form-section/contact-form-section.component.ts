import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RecaptchaService } from '../../../services/recaptcha.service';
import { HttpService } from '../../../services/http.service';

/**
 * Contact Form Section Component
 * Compact lead form for home page
 */
@Component({
  selector: 'app-contact-form-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './contact-form-section.component.html',
  styleUrl: './contact-form-section.component.scss',
})
export class ContactFormSectionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly recaptchaService = inject(RecaptchaService);
  private readonly httpService = inject(HttpService);

  contactForm!: FormGroup;
  formSubmitted = false;
  formSuccess = false;
  formError = false;
  errorMessage = '';

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initialize contact form
   */
  private initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9+\-\s()]+$/)]],
      message: [''],
    });
  }

  /**
   * Handle form submission
   */
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

        // Prepare form data
        const formData = {
          name: this.contactForm.value.name,
          email: this.contactForm.value.email,
          phone: this.contactForm.value.phone || undefined,
          subject: 'Home Page Inquiry',
          message: this.contactForm.value.message || 'Inquiry from home page',
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

  /**
   * Get field error message
   */
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

