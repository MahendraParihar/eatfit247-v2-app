/**
 * Forgot Password Component
 * 
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 */
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  emailSent = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      emailId: ['', [Validators.required, Validators.email]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const emailId = this.forgotPasswordForm.get('emailId')?.value;

    try {
      const message = await this.authService.forgotPassword({ emailId });
      this.loading = false;
      this.emailSent = true;
      this.successMessage = message || 'Password reset link has been sent to your email.';
    } catch (error: any) {
      this.loading = false;
      this.errorMessage = error?.error?.message || error?.message || 'Failed to send reset link. Please try again.';
    }
  }

  onBackToLogin(): void {
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}

