import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import {
  BusinessTypeEnum,
  CREDIT_NOTE_SEQUENCE_TYPE,
  IFranchiseInvoiceCounters,
  INDIA_COUNTRY_CODE,
  INVOICE_NUMBER_FORMAT_MAX_LENGTH,
  InvoiceNumberFormatUtil,
  InvoiceSeriesEnum,
} from '@eatfit247-shared-lib';
import { FranchiseApiService } from '../../api.service';


interface IPreviewDocument {
  label: string;
  invoiceType: string;
  series: InvoiceSeriesEnum;
  isCreditNote: boolean;
}

export interface IInvoiceNumberPreviewRow {
  label: string;
  number: string;
  length: number;
  compliant: boolean;
}

const PREVIEW_DOCUMENTS: IPreviewDocument[] = [
  { label: 'Service', invoiceType: BusinessTypeEnum.SERVICE, series: InvoiceSeriesEnum.DOMESTIC, isCreditNote: false },
  { label: 'Export of service', invoiceType: BusinessTypeEnum.SERVICE, series: InvoiceSeriesEnum.EXPORT, isCreditNote: false },
  { label: 'Product', invoiceType: BusinessTypeEnum.PRODUCT, series: InvoiceSeriesEnum.DOMESTIC, isCreditNote: false },
  { label: 'Export of product', invoiceType: BusinessTypeEnum.PRODUCT, series: InvoiceSeriesEnum.EXPORT, isCreditNote: false },
  { label: 'Credit note', invoiceType: CREDIT_NOTE_SEQUENCE_TYPE, series: InvoiceSeriesEnum.DOMESTIC, isCreditNote: true },
];

/**
 * Franchise form section "Invoice numbering" (compliant invoice numbering, plan 5.1 / 5.2): prefix and
 * template with the same validation as the server, a preview of the next number of every document
 * type, and the GST registration threshold while the franchise has no GSTIN.
 * The controls live on the parent form (`invoicePrefix`, `invoiceNumberFormat`, `registrationThresholdAmount`).
 */
@Component({
  selector: 'lib-invoice-numbering',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatTableModule],
  templateUrl: './invoice-numbering.component.html',
  styleUrl: './invoice-numbering.component.scss',
})
export class InvoiceNumberingComponent implements OnInit {
  @Input({ required: true }) formGroup!: FormGroup;
  /** Set once the parent has loaded the franchise (edit mode); loads its counters for the preview */
  @Input() set franchiseId(id: number | null) {
    if (id && id !== this.loadedFranchiseId) {
      this.loadedFranchiseId = id;
      void this.loadCounters(id);
    }
  }

  readonly formatMaxLength = INVOICE_NUMBER_FORMAT_MAX_LENGTH;
  readonly previewColumns = ['label', 'number', 'length'];
  counters: IFranchiseInvoiceCounters | null = null;
  /** Rebuilt on every form change; a stable array for the table's dataSource */
  previewRows: IInvoiceNumberPreviewRow[] = [];

  private readonly api = inject(FranchiseApiService);
  private readonly destroyRef = inject(DestroyRef);
  private countryCodes = new Map<number, string>();
  private loadedFranchiseId: number | null = null;

  async ngOnInit(): Promise<void> {
    const formatControl = this.formGroup.get('invoiceNumberFormat');
    formatControl?.addValidators((control: AbstractControl): ValidationErrors | null =>
      this.errorsFor(control.value).length > 0 ? { invoiceNumberFormat: true } : null,
    );
    // The format's validity also depends on the prefix and the country (address form, added later)
    this.formGroup.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      formatControl?.updateValueAndValidity({ emitEvent: false });
      this.previewRows = this.buildPreview();
    });
    const countries = await this.api.getCountries().catch(() => []);
    for (const country of countries) {
      const code = (country.metadata as { countryCode?: string } | undefined)?.countryCode;
      if (code) {
        this.countryCodes.set(Number(country.id), code.trim().toUpperCase());
      }
    }
    formatControl?.updateValueAndValidity({ emitEvent: false });
    this.previewRows = this.buildPreview();
  }

  private async loadCounters(franchiseId: number): Promise<void> {
    this.counters = await this.api.getInvoiceCounters(franchiseId).catch(() => null);
    this.previewRows = this.buildPreview();
  }

  /** Indian franchise: numbers must satisfy Rule 46 (≤16 characters), as on the server. */
  get gstLimit(): boolean {
    const countryId = this.formGroup.get('addressObj')?.value?.countryId;
    return !!countryId && this.countryCodes.get(Number(countryId)) === INDIA_COUNTRY_CODE;
  }

  get prefix(): string {
    return String(this.formGroup.get('invoicePrefix')?.value || '').trim().toUpperCase();
  }

  get template(): string {
    return String(this.formGroup.get('invoiceNumberFormat')?.value || '').trim();
  }

  /** Both empty: a non-Indian franchise keeps the legacy format. */
  get isLegacy(): boolean {
    return !this.prefix && !this.template && !this.gstLimit;
  }

  get errors(): string[] {
    return this.errorsFor(this.formGroup.get('invoiceNumberFormat')?.value);
  }

  get hasGstin(): boolean {
    return !!String(this.formGroup.get('gstNumber')?.value || '').trim();
  }

  private buildPreview(): IInvoiceNumberPreviewRow[] {
    if (this.isLegacy || this.errors.length > 0) {
      return [];
    }
    const fyStartMonth = Number(this.formGroup.get('financialYear')?.value) || 1;
    const invoiceDate = this.counters?.invoiceDate || this.today();
    return PREVIEW_DOCUMENTS.map((document) => {
      const current =
        this.counters?.counters.find((counter) => counter.invoiceType === document.invoiceType && counter.series === document.series)
          ?.currentNumber ?? 0;
      const number = InvoiceNumberFormatUtil.render({
        template: this.template,
        prefix: this.prefix,
        fyStartMonth,
        invoiceDate,
        typeLetter: InvoiceNumberFormatUtil.typeLetter(document.invoiceType, document.series, document.isCreditNote),
        sequence: current + 1,
      });
      return {
        label: document.label,
        number,
        length: number.length,
        compliant: !this.gstLimit || InvoiceNumberFormatUtil.isRule46Compliant(number),
      };
    });
  }

  /** Upper-cases the prefix as it is typed (the server stores it upper-case). */
  onPrefixInput(): void {
    const control = this.formGroup.get('invoicePrefix');
    const value = String(control?.value || '');
    if (value !== value.toUpperCase()) {
      control?.setValue(value.toUpperCase());
    }
  }

  private errorsFor(templateValue: unknown): string[] {
    const template = String(templateValue || '').trim();
    if (!this.prefix && !template) {
      // Same rule as the server: an Indian franchise can't use the legacy (22-character) format
      return this.gstLimit
        ? ['An Indian franchise needs an invoice prefix and number format (GST invoices allow at most 16 characters, Rule 46).']
        : [];
    }
    return InvoiceNumberFormatUtil.validate(template, this.prefix, { gstLimit: this.gstLimit });
  }

  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
