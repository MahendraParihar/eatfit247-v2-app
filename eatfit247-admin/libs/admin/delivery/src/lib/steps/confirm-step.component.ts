import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent, InputErrorComponent, LoaderComponent } from '@shared';
import { IRateQuote, IShipmentDetails } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-confirm-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    InputErrorComponent,
    LoaderComponent,
    EmptyStateComponent
  ],
  templateUrl: './confirm-step.component.html',
  styleUrl: './confirm-step.component.scss',
})
export class ConfirmStepComponent {
  @Input() shipmentDetails: IShipmentDetails | null = null;
  @Input() selectedRate: IRateQuote | null = null;
  @Input() loading = false;
  @Input() booking = false;
  @Input() formGroup!: FormGroup;
  @Input() showRetryButton = false;
  @Output() confirmBooking = new EventEmitter<void>();
  @Output() retryBooking = new EventEmitter<void>();

  get termsControl() {
    return this.formGroup?.get('termsAccepted');
  }

  formatCurrency(amount: number | undefined, currency: string = 'INR'): string {
    const currencySymbol = currency === 'INR' ? '₹' : currency;
    return `${currencySymbol}${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  onConfirm(): void {
    this.confirmBooking.emit();
  }

  onRetry(): void {
    this.retryBooking.emit();
  }
}

