/**
 * Reset Password Component
 * 
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 */
import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core';
import { IResetPasswordRequest } from '@eatfit247-shared-lib';

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  passwordReset = false;
  token = '';
  hideNewPassword = true;
  hideConfirmPassword = true;
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.resetPasswordForm = this.fb.group(
      {
        token: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // Get token from query params if available
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.token = params['token'];
        this.resetPasswordForm.patchValue({ token: params['token'] });
      }
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched(this.resetPasswordForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.resetPasswordForm.value;

    try {
      await this.authService.resetPassword(<IResetPasswordRequest>{
        token: formValue.token,
        newPassword: formValue.newPassword,
      });
      this.loading = false;
      this.passwordReset = true;
      this.successMessage = 'Password has been reset successfully.';
    } catch (error: any) {
      this.loading = false;
      this.errorMessage = error?.error?.message || error?.message || 'Failed to reset password. Please try again.';
    }
  }

  onBackToLogin(): void {
    this.router.navigate(['/login']);
  }

  toggleNewPasswordVisibility(): void {
    this.hideNewPassword = !this.hideNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}

