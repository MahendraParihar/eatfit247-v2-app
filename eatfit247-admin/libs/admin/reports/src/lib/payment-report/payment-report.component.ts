import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
  DataTableComponent,
  FilterPopoverComponent,
  ITableAction,
  ITableColumn,
  ITableConfig,
  ITablePagination,
  ITableSort,
  MultiSelectComponent
} from '@shared';
import {
  FinancialQuarter,
  FinancialYearUtil,
  IDropdownItem,
  IFinancialQuarterOption,
  IPaymentReportContext,
  IPaymentReportFilter,
  IPaymentReportItem,
  PaymentReportCountryMode,
  PaymentReportCountrySource,
  TaxMode,
  TaxTypeEnum
} from '@eatfit247-shared-lib';
import { Subject, takeUntil } from 'rxjs';
import { PaymentReportApiService } from './api.service';
import { PaymentDetailsDialogComponent } from 'members';

/**
 * Period preset identifiers. Financial-year and quarter options are encoded with
 * their year so the dropdown can offer every FY the franchise has data for:
 *   `fy:2025`      -> the whole of FY starting 2025
 *   `q:2025:3`     -> Q3 of the FY starting 2025
 */
type PeriodPreset =
  | 'today'
  | 'currentMonth'
  | 'lastMonth'
  | 'last7'
  | 'last30'
  | 'last90'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisFy'
  | 'lastFy'
  | 'custom'
  | string;

const PRESET_LABELS: Record<string, string> = {
  today: 'Today',
  currentMonth: 'Current Month',
  lastMonth: 'Last Month',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  last90: 'Last 90 days',
  thisQuarter: 'This Quarter',
  lastQuarter: 'Last Quarter',
  thisFy: 'This Financial Year',
  lastFy: 'Last Financial Year',
  custom: 'Custom range'
};

@Component({
  selector: 'lib-payment-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatSnackBarModule,
    DataTableComponent,
    FilterPopoverComponent,
    MultiSelectComponent
  ],
  templateUrl: './payment-report.html',
  styleUrl: './payment-report.scss'
})
export class PaymentReportComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(PaymentReportApiService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(DataTableComponent) private dataTable?: DataTableComponent<IPaymentReportItem>;

  filterForm!: FormGroup;
  tableConfig!: ITableConfig<IPaymentReportItem>;

  data: IPaymentReportItem[] = [];
  totalCount = 0;

  loading = false;
  exporting = false;
  exportingExcel = false;

  context?: IPaymentReportContext;
  franchiseOptions: IDropdownItem[] = [];
  countryOptions: IDropdownItem[] = [];
  quarterOptions: IFinancialQuarterOption[] = [];
  periodLabel = PRESET_LABELS['currentMonth'];

  readonly taxTypeOptions: IDropdownItem[] = Object.values(TaxTypeEnum).map((v) => ({
    id: v,
    label: this.humanise(v)
  }));
  readonly taxModeOptions: IDropdownItem[] = Object.values(TaxMode).map((v) => ({
    id: v,
    label: this.humanise(v)
  }));

  private pageIndex = 0;
  private pageSize = 10;
  private reportSort: { sortBy: string; sortOrder: 'asc' | 'desc' } | null = null;
  /** Set when a preset drives the range, so it can ride along to the export filename. */
  private selectedFy: { fyStartYear?: number; fyQuarter?: FinancialQuarter } = {};
  private suppressPeriodReset = false;

  constructor() {
    this.initializeForm();
  }

  async ngOnInit(): Promise<void> {
    this.initializeTable();
    this.applyPreset('currentMonth', false);

    // Editing a date by hand means the range is no longer a named period.
    this.filterForm
      .get('startDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onManualDateChange());
    this.filterForm
      .get('endDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onManualDateChange());

    await this.loadContext();
    await this.onSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Drives the badge on the filter button so applied filters are visible when closed. */
  get activeFilterCount(): number {
    const value = this.filterForm.value;
    let count = 0;
    if (value.franchiseId) count++;
    if (value.memberSearch?.trim()) count++;
    if (value.countryIds?.length) count++;
    if (value.minTotalAmount !== null || value.maxTotalAmount !== null) count++;
    if (value.taxTypes?.length) count++;
    if (value.taxModes?.length) count++;
    if (value.isTaxApplicable !== null) count++;
    return count;
  }

  get rangeLabel(): string {
    const { startDate, endDate } = this.filterForm.value;
    if (!startDate || !endDate) {
      return '';
    }
    return `${this.shortDate(startDate)} – ${this.shortDate(endDate)}`;
  }

  /** The financial year the quarter options belong to. */
  get quarterFyStartYear(): number {
    if (!this.context) {
      return new Date().getFullYear();
    }
    return this.selectedFy.fyStartYear ?? FinancialYearUtil.fyStartYearFor(this.context.fyStartMonth);
  }

  get currentFyLabel(): string {
    if (!this.context) {
      return '';
    }
    return FinancialYearUtil.label(this.quarterFyStartYear, this.context.fyStartMonth);
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      periodPreset: ['currentMonth' as PeriodPreset],
      startDate: [null as Date | null, Validators.required],
      endDate: [null as Date | null, Validators.required],
      franchiseId: [null as number | null],
      memberSearch: [''],
      countryIds: [[] as number[]],
      countryMode: ['in' as PaymentReportCountryMode],
      countrySource: ['member' as PaymentReportCountrySource],
      minTotalAmount: [null as number | null],
      maxTotalAmount: [null as number | null],
      taxTypes: [[] as TaxTypeEnum[]],
      taxModes: [[] as TaxMode[]],
      isTaxApplicable: [null as boolean | null]
    });
  }

  private initializeTable(): void {
    const actions: ITableAction<IPaymentReportItem>[] = [
      { label: 'View Invoice', icon: 'receipt', color: 'primary', onClick: (row) => this.viewInvoice(row) },
      { label: 'View Member', icon: 'person', color: 'primary', onClick: (row) => this.viewMember(row) }
    ];

    this.tableConfig = {
      columns: this.buildColumns(),
      actions,
      showSearch: false,
      showPagination: true,
      pageSize: this.pageSize,
      pageSizeOptions: [5, 10, 25, 50, 100],
      showHeader: true,
      emptyMessage: 'No payment records found'
    };
  }

  private buildColumns(): ITableColumn<IPaymentReportItem>[] {
    const billing = this.filterForm.value.countrySource === 'billing';

    return [
      { key: 'memberName', label: 'Member Name', dataKey: 'memberName', sortable: true },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        dataKey: 'totalAmount',
        sortable: true,
        formatter: (_value: number, row: IPaymentReportItem) =>
          `${row.currency} ${row.totalAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`
      },
      { key: 'paymentDate', label: 'Payment Date', dataKey: 'paymentDate', type: 'date', sortable: true },
      { key: 'invoiceId', label: 'Invoice ID', dataKey: 'invoiceId', sortable: true },
      {
        // Tracks the country filter's source so the column always shows the value
        // the filter matched on, making the result verifiable at a glance.
        key: 'country',
        label: billing ? 'Billing Country' : 'Member Country',
        dataKey: billing ? 'billingCountry' : 'memberCountry',
        formatter: (_value: string, row: IPaymentReportItem) =>
          (billing ? row.billingCountry : row.memberCountry) || '—'
      },
      { key: 'franchiseName', label: 'Franchise Name', dataKey: 'franchiseName', sortable: true }
    ];
  }

  /** Re-point the country column when the filter switches between member and billing. */
  private refreshCountryColumn(): void {
    const billing = this.filterForm.value.countrySource === 'billing';
    const current = this.tableConfig.columns.find((c) => c.key === 'country');
    if (current?.dataKey === (billing ? 'billingCountry' : 'memberCountry')) {
      return;
    }
    this.tableConfig = { ...this.tableConfig, columns: this.buildColumns() };
  }

  // ---- context ----

  private async loadContext(): Promise<void> {
    try {
      const franchiseId = this.filterForm.value.franchiseId ?? undefined;
      this.context = await this.apiService.getContext(franchiseId);
      this.franchiseOptions = this.context.franchises;
      this.countryOptions = this.context.countries;
      this.refreshQuarterOptions();
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  async onFranchiseChange(): Promise<void> {
    // The FY calendar is per-franchise, so the preset list must follow the selection.
    await this.loadContext();
  }

  private refreshQuarterOptions(): void {
    if (!this.context) {
      this.quarterOptions = [];
      return;
    }
    this.quarterOptions = FinancialYearUtil.buildQuarters(this.quarterFyStartYear, this.context.fyStartMonth);
  }

  // ---- period presets ----

  onPeriodPresetChange(preset: PeriodPreset): void {
    this.applyPreset(preset, false);
  }

  /**
   * Resolves a preset to a concrete date range. FY and quarter presets use the
   * franchise's own FY start month rather than assuming an April start.
   */
  private applyPreset(preset: PeriodPreset, search: boolean): void {
    if (preset === 'custom') {
      this.periodLabel = PRESET_LABELS['custom'];
      return;
    }

    const fyStartMonth = this.context?.fyStartMonth ?? 4;
    const currentFy = FinancialYearUtil.fyStartYearFor(fyStartMonth);

    if (preset.startsWith('fy:')) {
      this.setFinancialYear(Number(preset.slice(3)), undefined, search);
      return;
    }
    if (preset.startsWith('q:')) {
      const [, year, quarter] = preset.split(':');
      this.setFinancialYear(Number(year), Number(quarter) as FinancialQuarter, search);
      return;
    }

    switch (preset) {
      case 'thisFy':
        this.setFinancialYear(currentFy, undefined, search, PRESET_LABELS['thisFy']);
        return;
      case 'lastFy':
        this.setFinancialYear(currentFy - 1, undefined, search, PRESET_LABELS['lastFy']);
        return;
      case 'thisQuarter':
        this.setFinancialYear(
          currentFy,
          FinancialYearUtil.quarterFor(fyStartMonth),
          search,
          PRESET_LABELS['thisQuarter']
        );
        return;
      case 'lastQuarter': {
        const current = FinancialYearUtil.quarterFor(fyStartMonth);
        // Q1's predecessor is Q4 of the previous financial year.
        const year = current === 1 ? currentFy - 1 : currentFy;
        const quarter = (current === 1 ? 4 : current - 1) as FinancialQuarter;
        this.setFinancialYear(year, quarter, search, PRESET_LABELS['lastQuarter']);
        return;
      }
      default:
        this.setCalendarRange(preset, search);
    }
  }

  private setCalendarRange(preset: PeriodPreset, search: boolean): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate: Date;
    let endDate = new Date(today);

    switch (preset) {
      case 'today':
        startDate = new Date(today);
        break;
      case 'currentMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last7':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
        break;
      case 'last30':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 29);
        break;
      case 'last90':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 89);
        break;
      default:
        return;
    }

    this.selectedFy = {};
    this.setPeriod(startDate, endDate, PRESET_LABELS[preset] ?? '', search);
  }

  private setFinancialYear(
    fyStartYear: number,
    quarter: FinancialQuarter | undefined,
    search: boolean,
    label?: string
  ): void {
    const fyStartMonth = this.context?.fyStartMonth ?? 4;
    const range = quarter
      ? FinancialYearUtil.quarterRange(fyStartYear, fyStartMonth, quarter)
      : FinancialYearUtil.fyRange(fyStartYear, fyStartMonth);

    const fyLabel = FinancialYearUtil.label(fyStartYear, fyStartMonth);
    const quarterLabel = quarter
      ? FinancialYearUtil.buildQuarters(fyStartYear, fyStartMonth).find((q) => q.quarter === quarter)?.label
      : undefined;

    this.selectedFy = { fyStartYear, fyQuarter: quarter };
    this.refreshQuarterOptions();
    this.setPeriod(
      this.parseDateOnly(range.startDate),
      this.parseDateOnly(range.endDate),
      label ?? (quarterLabel ? `${quarterLabel} · ${fyLabel}` : fyLabel),
      search
    );
  }

  private setPeriod(startDate: Date, endDate: Date, label: string, search: boolean): void {
    this.suppressPeriodReset = true;
    this.filterForm.patchValue({ startDate, endDate });
    this.suppressPeriodReset = false;
    this.periodLabel = label;
    if (search) {
      void this.onSearch();
    }
  }

  private onManualDateChange(): void {
    if (this.suppressPeriodReset) {
      return;
    }
    this.selectedFy = {};
    this.periodLabel = PRESET_LABELS['custom'];
    this.filterForm.get('periodPreset')?.setValue('custom', { emitEvent: false });
  }

  // ---- search, paging, sorting ----

  async onSearch(): Promise<void> {
    if (this.filterForm.invalid) {
      return;
    }
    this.pageIndex = 0;
    this.resetPaginator();
    await this.loadPage();
  }

  async onPageChange(pagination: ITablePagination): Promise<void> {
    this.pageIndex = pagination.pageIndex;
    this.pageSize = pagination.pageSize;
    await this.loadPage();
  }

  async onSortChange(sort: ITableSort): Promise<void> {
    this.reportSort =
      sort.direction === 'asc' || sort.direction === 'desc'
        ? { sortBy: sort.active, sortOrder: sort.direction }
        : null;
    this.pageIndex = 0;
    this.resetPaginator();
    await this.loadPage();
  }

  private async loadPage(): Promise<void> {
    this.refreshCountryColumn();
    this.loading = true;
    try {
      const response = await this.apiService.getPaymentReport(this.buildReportParams());
      this.data = response.tableData;
      this.totalCount = response.count;
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
    }
  }

  /**
   * DataTableComponent reads its own paginator and exposes no pageIndex input, so
   * reset it directly — paginator.firstPage() would emit (page) and cause a second load.
   */
  private resetPaginator(): void {
    if (this.dataTable?.paginator) {
      this.dataTable.paginator.pageIndex = 0;
    }
  }

  /** Single source of truth for the request payload, shared with both exports. */
  private buildReportParams(): IPaymentReportFilter {
    const value = this.filterForm.value;
    const params: IPaymentReportFilter = {
      startDate: this.formatDate(value.startDate),
      endDate: this.formatDate(value.endDate),
      page: this.pageIndex,
      limit: this.pageSize
    };

    if (this.selectedFy.fyStartYear) params.fyStartYear = this.selectedFy.fyStartYear;
    if (this.selectedFy.fyQuarter) params.fyQuarter = this.selectedFy.fyQuarter;
    if (value.franchiseId) params.franchiseId = value.franchiseId;
    if (value.memberSearch?.trim()) params.memberSearch = value.memberSearch.trim();

    if (value.countryIds?.length) {
      params.countryIds = value.countryIds;
      params.countryMode = value.countryMode;
      params.countrySource = value.countrySource;
    }

    if (value.minTotalAmount !== null && value.minTotalAmount !== '') {
      params.minTotalAmount = Number(value.minTotalAmount);
    }
    if (value.maxTotalAmount !== null && value.maxTotalAmount !== '') {
      params.maxTotalAmount = Number(value.maxTotalAmount);
    }

    if (value.taxTypes?.length) params.taxTypes = value.taxTypes;
    if (value.taxModes?.length) params.taxModes = value.taxModes;
    if (value.isTaxApplicable !== null) params.isTaxApplicable = value.isTaxApplicable;

    if (this.reportSort) {
      params.sortBy = this.reportSort.sortBy;
      params.sortOrder = this.reportSort.sortOrder;
    }
    return params;
  }

  onResetFilters(): void {
    this.filterForm.patchValue(
      {
        franchiseId: null,
        memberSearch: '',
        countryIds: [],
        countryMode: 'in',
        countrySource: 'member',
        minTotalAmount: null,
        maxTotalAmount: null,
        taxTypes: [],
        taxModes: [],
        isTaxApplicable: null,
        periodPreset: 'currentMonth'
      },
      { emitEvent: false }
    );
    this.reportSort = null;
    this.applyPreset('currentMonth', true);
  }

  // ---- row actions ----

  viewInvoice(payment: IPaymentReportItem): void {
    this.dialog.open(PaymentDetailsDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { payment }
    });
  }

  viewMember(payment: IPaymentReportItem): void {
    void this.router.navigate(['/members/details', payment.memberId, 'dashboard']);
  }

  // ---- exports ----

  async onExport(): Promise<void> {
    if (this.filterForm.invalid) return;
    this.exporting = true;
    try {
      const params = this.exportParams();
      const blob = await this.apiService.exportPaymentReports(params);
      this.downloadBlob(blob, `payment-reports_${this.rangeSuffix(params)}.zip`);
    } catch (error) {
      this.snackBar.open(this.exportErrorMessage(error, 'payment reports'), 'Close', { duration: 6000 });
    } finally {
      this.exporting = false;
    }
  }

  async onExportExcel(): Promise<void> {
    if (this.filterForm.invalid) return;
    this.exportingExcel = true;
    try {
      const params = this.exportParams();
      const blob = await this.apiService.exportPaymentReportExcel(params);
      this.downloadBlob(blob, `payment-report_${this.rangeSuffix(params)}.xlsx`);
    } catch (error) {
      this.snackBar.open(this.exportErrorMessage(error, 'Excel report'), 'Close', { duration: 6000 });
    } finally {
      this.exportingExcel = false;
    }
  }

  /** Exports cover the whole filtered set, so paging is dropped. */
  private exportParams(): IPaymentReportFilter {
    const { page, limit, ...rest } = this.buildReportParams();
    void page;
    void limit;
    return rest;
  }

  private rangeSuffix(params: IPaymentReportFilter): string {
    return `${params.startDate.replace(/-/g, '')}_to_${params.endDate.replace(/-/g, '')}`;
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /** Surfaces the server's reason (e.g. the invoice cap) instead of a generic failure. */
  private exportErrorMessage(error: unknown, subject: string): string {
    const message = (error as { error?: { message?: string }; message?: string })?.error?.message;
    return message || `Failed to export ${subject}. Please try again.`;
  }

  // ---- helpers ----

  /** DOMESTIC_GST -> Domestic Gst */
  private humanise(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private shortDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /** Parses yyyy-MM-dd as a local date; `new Date('yyyy-MM-dd')` would be UTC midnight. */
  private parseDateOnly(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(date: Date | null): string {
    if (!date) {
      return '';
    }
    return FinancialYearUtil.toDateOnly(new Date(date));
  }
}
