import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { InputErrorComponent, EmptyStateComponent, LoaderComponent } from '@shared';
import { IRateQuote } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-rate-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatCardModule,
    InputErrorComponent,
    EmptyStateComponent,
    LoaderComponent
  ],
  templateUrl: './rate-step.component.html',
  styleUrl: './rate-step.component.scss',
})
export class RateStepComponent implements OnInit {
  @Input() rates: IRateQuote[] = [];
  @Input() loading = false;
  @Input() formGroup!: FormGroup;
  @Output() rateSelected = new EventEmitter<IRateQuote | null>();

  displayedColumns: string[] = ['select', 'providerName', 'serviceName', 'estimatedDays', 'rateAmount'];

  ngOnInit(): void {
    if (!this.formGroup) {
      return;
    }
    const selectedProviderControl = this.formGroup.get('selectedProvider');
    if (selectedProviderControl) {
      selectedProviderControl.valueChanges.subscribe((providerId) => {
        const rate = this.rates.find((r) => r.providerId === providerId);
        this.rateSelected.emit(rate || null);
      });
    }
  }

  onRateChange(rate: IRateQuote): void {
    this.formGroup.patchValue({ selectedProvider: rate.providerId });
    this.rateSelected.emit(rate);
  }

  isSelected(rateQuoteId: number): boolean {
    const selectedProvider = this.formGroup.get('selectedProvider')?.value;
    const rate = this.rates.find((r) => r.rateQuoteId === rateQuoteId);
    return rate ? selectedProvider === rate.providerId : false;
  }

  formatCurrency(amount: number | undefined, currency: string = 'INR'): string {
    const currencySymbol = currency === 'INR' ? '₹' : currency;
    return `${currencySymbol}${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  hasRates(): boolean {
    return this.rates.length > 0;
  }
}

