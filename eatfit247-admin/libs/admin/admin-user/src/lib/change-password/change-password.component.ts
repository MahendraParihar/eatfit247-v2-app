import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent, ValidationUtil } from '@shared';
import { AuthService } from '@core';
import { IChangePassword, InputLengthEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    InputErrorComponent
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.MIN_PASSWORD)
        ]
      ],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.MIN_PASSWORD),
          Validators.maxLength(InputLengthEnum.MAX_PASSWORD)
        ]
      ],
      repeatPassword: ['', [Validators.required]]
    },
    {
      validators: this.passwordMatchValidator
    }
  );
  submitting = signal(false);
  hideCurrentPassword = signal(true);
  hideNewPassword = signal(true);
  hideConfirmPassword = signal(true);
  InputLengthEnum = InputLengthEnum;

  constructor(
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('repeatPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      formGroup.get('repeatPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      formGroup.get('repeatPassword')?.setErrors(null);
      return null;
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      this.submitting.set(true);
      try {
        const formValue: IChangePassword = {
          password: this.formGroup.get('password')?.value,
          newPassword: this.formGroup.get('newPassword')?.value,
          repeatPassword: this.formGroup.get('repeatPassword')?.value
        };
        await this.authService.changePassword(formValue);
        this.snackBar.open('Password changed successfully', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/']);
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
      } finally {
        this.submitting.set(false);
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/members']);
  }

  toggleCurrentPasswordVisibility(): void {
    this.hideCurrentPassword.update((v) => !v);
  }

  toggleNewPasswordVisibility(): void {
    this.hideNewPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((v) => !v);
  }

  getMaxLength(controlName: string): number | null {
    const maxLengthMap: { [key: string]: number } = {
      newPassword: InputLengthEnum.MAX_PASSWORD
    };
    return maxLengthMap[controlName] || null;
  }

  getCurrentLength(controlName: string): number {
    const control = this.formGroup.get(controlName);
    return control?.value?.length || 0;
  }
}
