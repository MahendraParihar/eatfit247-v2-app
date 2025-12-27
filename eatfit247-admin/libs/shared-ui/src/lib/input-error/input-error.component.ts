import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, AbstractControlDirective } from '@angular/forms';

@Component({
  selector: 'shared-ui-input-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-error.component.html',
  styleUrl: './input-error.component.scss',
})
export class InputErrorComponent {
  @Input() control?: AbstractControlDirective | AbstractControl | null;
  @Input() controlName?: string;

  shouldShowErrors(): boolean | null {
    if (this.control) {
      return !!(this.control.errors && (this.control.dirty || this.control.touched));
    }
    return false;
  }

  getError(): string | null {
    if (this.control && this.control.errors) {
      for (const key in this.control.errors) {
        if (this.control.errors.hasOwnProperty(key)) {
          return this.getMessage(key, this.control.errors[key]);
        }
      }
    }
    return null;
  }

  private getMessage(type: string, params: any): string {
    const fieldName = this.controlName || 'This field';
    switch (type) {
      case 'required':
        return `${fieldName} is required`;
      case 'email':
        return 'Please enter a valid email address';
      case 'minlength':
        return `Minimum length is ${params.requiredLength} characters`;
      case 'maxlength':
        return `Maximum length is ${params.requiredLength} characters`;
      case 'min':
        return `Minimum value is ${params.min}`;
      case 'max':
        return `Maximum value is ${params.max}`;
      case 'pattern':
        return 'Invalid format';
      default:
        return `${fieldName} is invalid`;
    }
  }
}
