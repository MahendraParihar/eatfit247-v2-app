import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoaderComponent } from '@shared';
import { IExchangeRate, IManageExchangeRate } from '@eatfit247-shared-lib';
import { TaxMasterApiService } from '../api.service';

/**
 * Exchange rates used on invoices (roadmap 4.6): FBIL reference rates are fetched daily, the
 * UAE Central Bank's USD peg is fixed; Finance adds CBIC customs rates (goods, fortnightly) and
 * manual rates from the official page when a feed is missing.
 */
@Component({
  selector: 'lib-exchange-rates',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule,
    LoaderComponent,
  ],
  templateUrl: './exchange-rates.component.html',
  styleUrl: './exchange-rates.component.scss',
})
export class ExchangeRatesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(TaxMasterApiService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);
  rates = signal<IExchangeRate[]>([]);
  displayedColumns = ['rateDate', 'pair', 'rate', 'source', 'validTo', 'note', 'actions'];

  readonly sourceLabels: Record<string, string> = {
    FBIL: 'FBIL (RBI reference)',
    CBUAE_PEG: 'UAE Central Bank peg',
    CBIC_CUSTOMS: 'CBIC customs',
    MANUAL: 'Manual',
  };

  form = this.fb.nonNullable.group({
    source: ['CBIC_CUSTOMS' as 'MANUAL' | 'CBIC_CUSTOMS', Validators.required],
    rateDate: ['', Validators.required],
    validTo: [''],
    fromCurrency: ['USD', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]],
    toCurrency: ['INR', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]],
    rate: [0, [Validators.required, Validators.min(0.00000001)]],
    note: ['', Validators.maxLength(255)],
  });

  ngOnInit(): void {
    this.load();
  }

  sourceLabel(source: string): string {
    return this.sourceLabels[source] ?? source;
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.rates.set(await this.api.listExchangeRates({ limit: 200 }));
    } catch {
      // Error toast is handled by HttpErrorInterceptor
      this.rates.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const value = this.form.getRawValue();
    const payload: IManageExchangeRate = {
      source: value.source,
      rateDate: value.rateDate,
      validTo: value.validTo || null,
      fromCurrency: value.fromCurrency.toUpperCase(),
      toCurrency: value.toCurrency.toUpperCase(),
      rate: Number(value.rate),
      note: value.note?.trim() || null,
    };
    try {
      await this.api.createExchangeRate(payload);
      this.snackBar.open('Exchange rate saved', 'Close', { duration: 3000 });
      this.form.patchValue({ rate: 0, note: '' });
      await this.load();
    } catch {
      // Error toast (missing note, customs not into INR, …) is shown by HttpErrorInterceptor
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(rate: IExchangeRate): Promise<void> {
    try {
      await this.api.setExchangeRateStatus(rate.exchangeRateId, !rate.active);
      await this.load();
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    }
  }
}
