import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, debounceTime, firstValueFrom, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';
import { InputErrorComponent, ValidationUtil, WarningDialogComponent, WarningDialogData } from '@shared';
import {
  ICalculateTaxResponse,
  IDropdownItem,
  IManageWorkshopInvoice,
  IWorkshopInvoice,
  IWorkshopInvoiceTaxRequest,
  PaymentStatusEnum,
  WORKSHOP_INVOICE_LOCKED_FIELDS,
} from '@eatfit247-shared-lib';
import { IWorkshopInvoiceApiError, WorkshopInvoiceApiService } from '../api.service';
import { formatMoney } from '../workshop-invoices.component';

/** 15-character GSTIN, same rule as the API. */
const GSTIN_PATTERN = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z][Zz][0-9A-Za-z]$/;
const PHONE_PATTERN = /^[+0-9][0-9 ()-]{5,24}$/;
const INDIA_PINCODE = /^\d{6}$/;
const OTHER_PINCODE = /^[A-Za-z0-9 -]{3,10}$/;
/** Same limits as the API DTO: whole participants, a rate with at most 2 decimals, a domain with a dot. */
const WHOLE_NUMBER = /^\d+$/;
const TWO_DECIMALS = /^\d+(\.\d{1,2})?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** The API's backdate warning (decision 4); any other 409 is a plain error. */
const BACKDATE_WARNING = 'series already has an invoice dated';

/** Fields that drive the tax preview. */
const TAX_FIELDS = ['franchiseId', 'billToCountryId', 'billToStateId', 'placeOfSupplyStateId', 'quantity', 'unitRate', 'currency'];

@Component({
  selector: 'lib-manage-workshop-invoice',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    InputErrorComponent,
  ],
  templateUrl: './manage-workshop-invoice.component.html',
  styleUrl: './manage-workshop-invoice.component.scss',
})
export class ManageWorkshopInvoice implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(WorkshopInvoiceApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly today = moment().startOf('day');
  readonly formatMoney = formatMoney;

  formGroup!: FormGroup;
  invoice: IWorkshopInvoice | null = null;
  pageTitle = 'New Workshop Invoice';
  saving = false;

  franchiseOptions: IDropdownItem[] = [];
  countryOptions: IDropdownItem[] = [];
  stateOptions: IDropdownItem[] = [];
  currencyOptions: IDropdownItem[] = [];
  paymentStatusOptions: IDropdownItem[] = [];
  paymentModeOptions: IDropdownItem[] = [];

  taxPreview: ICalculateTaxResponse | null = null;
  taxPreviewError = '';
  taxPreviewLoading = false;
  private taxRequestSeq = 0;

  get locked(): boolean {
    return !!this.invoice?.locked;
  }

  get cancelled(): boolean {
    return !!this.invoice && !this.invoice.active;
  }

  get isIndia(): boolean {
    const country = this.countryOptions.find((c) => c.id === this.formGroup?.get('billToCountryId')?.value);
    return country?.label === 'India';
  }

  async ngOnInit(): Promise<void> {
    this.buildForm();
    await this.loadMasterData();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pageTitle = 'Edit Workshop Invoice';
      await this.loadInvoice(+id);
    } else {
      this.applyDefaults();
    }
    this.setupListeners();
    await this.refreshTax();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      franchiseId: [null, Validators.required],
      invoiceDate: [this.today.clone(), Validators.required],
      supplyDate: [null, Validators.required],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      quantity: [null, [Validators.required, Validators.min(1), Validators.max(100000), Validators.pattern(WHOLE_NUMBER)]],
      unitRate: [null, [Validators.required, Validators.min(0), Validators.max(10000000), Validators.pattern(TWO_DECIMALS)]],
      currency: ['INR', Validators.required],
      billToName: ['', [Validators.required, Validators.maxLength(200)]],
      billToContactPerson: ['', Validators.maxLength(150)],
      billToEmail: ['', [Validators.pattern(EMAIL_PATTERN), Validators.maxLength(150)]],
      billToPhone: ['', Validators.pattern(PHONE_PATTERN)],
      billToGstin: ['', Validators.pattern(GSTIN_PATTERN)],
      billToAddressLine1: ['', [Validators.required, Validators.maxLength(250)]],
      billToAddressLine2: ['', Validators.maxLength(250)],
      billToCity: ['', [Validators.required, Validators.maxLength(100)]],
      billToPinCode: ['', [Validators.required, Validators.pattern(OTHER_PINCODE)]],
      billToCountryId: [null, Validators.required],
      billToStateId: [null, Validators.required],
      placeOfSupplyStateId: [null, Validators.required],
      paymentStatusId: [PaymentStatusEnum.PENDING, Validators.required],
      paymentModeId: [null, Validators.required],
      transactionId: ['', [Validators.required, Validators.maxLength(250)]],
      paymentDate: [null, Validators.required],
      notes: ['', Validators.maxLength(2000)],
    });
  }

  private async loadMasterData(): Promise<void> {
    try {
      const master = await this.apiService.getMasterData();
      this.franchiseOptions = master.franchise;
      this.countryOptions = master.country;
      this.currencyOptions = master.currency;
      this.paymentStatusOptions = master.paymentStatus;
      this.paymentModeOptions = master.paymentMode;
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  private applyDefaults(): void {
    if (this.franchiseOptions.length === 1) {
      this.formGroup.patchValue({ franchiseId: this.franchiseOptions[0].id });
    }
    const india = this.countryOptions.find((c) => c.label === 'India');
    if (india) {
      this.formGroup.patchValue({ billToCountryId: india.id });
      void this.loadStates(Number(india.id));
    }
    this.updatePincodeValidator();
  }

  private async loadInvoice(id: number): Promise<void> {
    try {
      const invoice = await this.apiService.getById(id);
      this.invoice = invoice;
      await this.loadStates(invoice.billToCountryId);
      this.formGroup.patchValue(
        {
          franchiseId: invoice.franchiseId,
          invoiceDate: moment(invoice.invoiceDate, 'YYYY-MM-DD'),
          supplyDate: moment(invoice.supplyDate, 'YYYY-MM-DD'),
          description: invoice.description,
          quantity: invoice.quantity,
          unitRate: invoice.unitRate,
          currency: invoice.currency,
          billToName: invoice.billToName,
          billToContactPerson: invoice.billToContactPerson || '',
          billToEmail: invoice.billToEmail || '',
          billToPhone: invoice.billToPhone || '',
          billToGstin: invoice.billToGstin || '',
          billToAddressLine1: invoice.billToAddress?.postalAddress || '',
          billToAddressLine2: invoice.billToAddress?.addressName || '',
          billToCity: invoice.billToAddress?.cityVillage || '',
          billToPinCode: invoice.billToAddress?.pinCode || '',
          billToCountryId: invoice.billToCountryId,
          billToStateId: invoice.billToStateId,
          placeOfSupplyStateId: invoice.placeOfSupplyStateId,
          paymentStatusId: invoice.paymentStatusId,
          paymentModeId: invoice.paymentModeId,
          transactionId: invoice.transactionId || '',
          paymentDate: invoice.paymentDate ? moment(invoice.paymentDate, 'YYYY-MM-DD') : null,
          notes: invoice.notes || '',
        },
        { emitEvent: false },
      );
      this.updatePincodeValidator();
      if (this.cancelled) {
        this.formGroup.disable({ emitEvent: false });
      } else if (this.locked) {
        // Decision 8: money fields can't change once the number is issued.
        for (const field of WORKSHOP_INVOICE_LOCKED_FIELDS) {
          this.formGroup.get(field)?.disable({ emitEvent: false });
        }
      }
    } catch {
      this.router.navigate(['/workshop-invoices']);
    }
  }

  private setupListeners(): void {
    const country = this.formGroup.get('billToCountryId');
    country?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(async (countryId: number | null) => {
      this.formGroup.patchValue({ billToStateId: null, placeOfSupplyStateId: null }, { emitEvent: false });
      this.stateOptions = [];
      this.updatePincodeValidator();
      if (countryId) {
        await this.loadStates(countryId);
      }
    });

    // Decision 6: the place of supply follows the bill-to State unless the admin changes it.
    const state = this.formGroup.get('billToStateId');
    let previousState: number | null = state?.value ?? null;
    state?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((stateId: number | null) => {
      const pos = this.formGroup.get('placeOfSupplyStateId');
      if (pos && (!pos.value || pos.value === previousState)) {
        pos.setValue(stateId);
      }
      previousState = stateId;
    });

    for (const field of TAX_FIELDS) {
      this.formGroup
        .get(field)
        ?.valueChanges.pipe(debounceTime(400), takeUntil(this.destroy$))
        .subscribe(() => void this.refreshTax());
    }
  }

  private updatePincodeValidator(): void {
    const pinCode = this.formGroup.get('billToPinCode');
    pinCode?.setValidators([Validators.required, Validators.pattern(this.isIndia ? INDIA_PINCODE : OTHER_PINCODE)]);
    pinCode?.updateValueAndValidity({ emitEvent: false });
  }

  private async loadStates(countryId: number): Promise<void> {
    let states: IDropdownItem[] = [];
    try {
      states = await this.apiService.getStates(countryId);
    } catch {
      states = [];
    }
    // A reply for a country the admin has since changed away from is ignored.
    if (this.formGroup.get('billToCountryId')?.value === countryId) {
      this.stateOptions = states;
    }
  }

  /** Live tax preview (decision 5). For an issued invoice it shows the stored values. */
  private async refreshTax(): Promise<void> {
    if (this.locked && this.invoice) {
      this.taxPreview = {
        orderAmount: this.invoice.orderAmount,
        discountAmount: this.invoice.discountAmount,
        taxableAmount: this.invoice.orderAmount - this.invoice.discountAmount,
        taxPercentage: this.invoice.taxPercentage,
        taxAmount: this.invoice.taxAmount,
        totalAmount: this.invoice.totalAmount,
        taxObj: this.invoice.taxObj,
        taxType: this.invoice.taxType,
        taxMode: this.invoice.taxMode,
        currency: this.invoice.currency,
        isLutApplied: this.invoice.isLutApplied,
        jurisdiction: this.invoice.jurisdiction ?? { entityCountry: '', customerCountry: '', placeOfSupply: '' },
      };
      return;
    }
    const value = this.formGroup.getRawValue();
    const request: IWorkshopInvoiceTaxRequest = {
      franchiseId: value.franchiseId,
      billToCountryId: value.billToCountryId,
      billToStateId: value.billToStateId,
      placeOfSupplyStateId: value.placeOfSupplyStateId || null,
      quantity: Number(value.quantity),
      unitRate: Number(value.unitRate),
      currency: value.currency,
    };
    const ready =
      request.franchiseId &&
      request.billToCountryId &&
      request.billToStateId &&
      request.currency &&
      Number.isInteger(request.quantity) &&
      request.quantity > 0 &&
      value.unitRate !== null &&
      value.unitRate !== '' &&
      request.unitRate >= 0;
    if (!ready) {
      this.taxPreview = null;
      this.taxPreviewError = '';
      return;
    }
    // Only the latest request may update the preview; earlier replies can arrive later.
    const seq = ++this.taxRequestSeq;
    this.taxPreviewLoading = true;
    try {
      const preview = await this.apiService.calculateTax(request);
      if (seq !== this.taxRequestSeq) return;
      this.taxPreview = preview;
      this.taxPreviewError = '';
    } catch (error) {
      if (seq !== this.taxRequestSeq) return;
      this.taxPreview = null;
      this.taxPreviewError = (error as IWorkshopInvoiceApiError).message || 'Tax could not be calculated';
    } finally {
      if (seq === this.taxRequestSeq) {
        this.taxPreviewLoading = false;
      }
    }
  }

  taxRows(): { label: string; amount: number; percentage: number }[] {
    if (!this.taxPreview) return [];
    return Object.entries(this.taxPreview.taxObj || {}).map(([label, row]) => ({
      label,
      amount: row.amount,
      percentage: Number(row.taxPercentage),
    }));
  }

  private toDate(value: Moment | null): string | null {
    return value ? moment(value).format('YYYY-MM-DD') : null;
  }

  private buildPayload(confirmBackdate: boolean): IManageWorkshopInvoice {
    const v = this.formGroup.getRawValue();
    const text = (value: string | null | undefined): string | null => (value && value.trim()) || null;
    return {
      franchiseId: v.franchiseId,
      invoiceDate: this.toDate(v.invoiceDate) as string,
      supplyDate: this.toDate(v.supplyDate) as string,
      description: v.description.trim(),
      quantity: Number(v.quantity),
      unitRate: Number(v.unitRate),
      currency: v.currency,
      billToName: v.billToName.trim(),
      billToContactPerson: text(v.billToContactPerson),
      billToEmail: text(v.billToEmail),
      billToPhone: text(v.billToPhone),
      billToGstin: text(v.billToGstin)?.toUpperCase() ?? null,
      billToAddressLine1: v.billToAddressLine1.trim(),
      billToAddressLine2: text(v.billToAddressLine2),
      billToCity: v.billToCity.trim(),
      billToPinCode: v.billToPinCode.trim(),
      billToCountryId: v.billToCountryId,
      billToStateId: v.billToStateId,
      placeOfSupplyStateId: v.placeOfSupplyStateId || null,
      paymentStatusId: v.paymentStatusId,
      paymentModeId: v.paymentModeId || null,
      transactionId: text(v.transactionId),
      paymentDate: this.toDate(v.paymentDate),
      notes: text(v.notes),
      ...(confirmBackdate ? { confirmBackdate: true } : {}),
    };
  }

  async onSubmit(): Promise<void> {
    if (this.cancelled || this.saving) return;
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.snackBar.open('Please fix the highlighted fields', 'Close', { duration: 3000 });
      return;
    }
    await this.save(false);
  }

  private async save(confirmBackdate: boolean): Promise<void> {
    this.saving = true;
    try {
      const saved = await this.apiService.save(this.buildPayload(confirmBackdate), this.invoice?.workshopInvoiceId);
      const message = saved.invoiceId ? `Saved as ${saved.invoiceId}` : 'Saved (no invoice number until it is marked Paid)';
      this.snackBar.open(message, 'Close', { duration: 4000 });
      this.router.navigate(['/workshop-invoices']);
    } catch (error) {
      const apiError = error as IWorkshopInvoiceApiError;
      if (apiError.status === 409 && !confirmBackdate && apiError.message?.includes(BACKDATE_WARNING)) {
        this.saving = false;
        if (await this.confirmBackdate(apiError.message)) {
          await this.save(true);
        }
        return;
      }
      this.snackBar.open(apiError.message || 'The invoice could not be saved', 'Close', { duration: 5000 });
    } finally {
      this.saving = false;
    }
  }

  /** Decision 4: an invoice date earlier than the series' latest needs an explicit OK. */
  private async confirmBackdate(message: string): Promise<boolean> {
    const data: WarningDialogData = {
      title: 'Earlier invoice date',
      message,
      confirmText: 'Save with this date',
      cancelText: 'Change the date',
    };
    const dialogRef = this.dialog.open(WarningDialogComponent, { width: '520px', data });
    return (await firstValueFrom(dialogRef.afterClosed())) === true;
  }

  onCancel(): void {
    this.router.navigate(['/workshop-invoices']);
  }
}
