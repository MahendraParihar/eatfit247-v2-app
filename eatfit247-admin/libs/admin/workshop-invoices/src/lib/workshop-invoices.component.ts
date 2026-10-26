import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import moment, { Moment } from 'moment';
import { PermissionService } from '@core';
import { DataTableComponent, ITableAction, ITableColumn, ITableConfig } from '@shared';
import {
  AdminSubjectEnum,
  IDropdownItem,
  IWorkshopInvoice,
  IWorkshopInvoiceSearch,
} from '@eatfit247-shared-lib';
import { WorkshopInvoiceApiService } from './api.service';
import {
  CancelWorkshopInvoiceDialogComponent,
  CancelWorkshopInvoiceDialogData,
} from './cancel-dialog/cancel-workshop-invoice-dialog.component';

export const formatInvoiceDate = (value: string | null | undefined): string =>
  value ? moment(value, 'YYYY-MM-DD').format('DD MMM YYYY') : '-';

export const formatMoney = (amount: number, currency: string): string =>
  `${currency} ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

@Component({
  selector: 'lib-workshop-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  templateUrl: './workshop-invoices.html',
  styleUrl: './workshop-invoices.scss',
})
export class WorkshopInvoiceList implements OnInit {
  private readonly apiService = inject(WorkshopInvoiceApiService);
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly canCreate = this.can('create');
  readonly canUpdate = this.can('update');
  readonly canCancel = this.can('delete');

  data: IWorkshopInvoice[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IWorkshopInvoice>;

  franchiseOptions: IDropdownItem[] = [];
  statusOptions: IDropdownItem[] = [];
  franchiseId: number | null = null;
  paymentStatusId: number | null = null;
  invoiceDateFrom: Moment | null = null;
  invoiceDateTo: Moment | null = null;
  includeCancelled = true;

  private search = '';
  private pageIndex = 0;
  private pageSize = 10;
  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((search) => {
      this.search = search;
      this.pageIndex = 0;
      void this.loadData();
    });
  }

  async ngOnInit(): Promise<void> {
    this.initializeTable();
    try {
      const master = await this.apiService.getMasterData();
      this.franchiseOptions = master.franchise;
      this.statusOptions = master.paymentStatus;
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    }
    await this.loadData();
  }

  private can(action: string): boolean {
    return this.permissionService.hasPermission(AdminSubjectEnum.WorkshopInvoice, action);
  }

  private initializeTable(): void {
    const columns: ITableColumn<IWorkshopInvoice>[] = [
      {
        key: 'invoiceId',
        label: 'Invoice No.',
        dataKey: 'invoiceId',
        width: '190px',
        formatter: (value) => value || 'Not issued',
      },
      {
        key: 'invoiceDate',
        label: 'Invoice Date',
        dataKey: 'invoiceDate',
        width: '120px',
        formatter: (value) => formatInvoiceDate(value),
      },
      {
        key: 'supplyDate',
        label: 'Date of Supply',
        dataKey: 'supplyDate',
        width: '120px',
        formatter: (value) => formatInvoiceDate(value),
      },
      { key: 'billToName', label: 'Bill To', dataKey: 'billToName' },
      { key: 'description', label: 'Description', dataKey: 'description' },
      { key: 'quantity', label: 'Qty', dataKey: 'quantity', align: 'right', width: '70px' },
      {
        key: 'totalAmount',
        label: 'Total',
        dataKey: 'totalAmount',
        align: 'right',
        formatter: (value, row) => formatMoney(value, row.currency),
      },
      { key: 'paymentStatus', label: 'Status', dataKey: 'paymentStatus', width: '100px' },
      {
        key: 'active',
        label: 'Cancelled',
        dataKey: 'active',
        width: '100px',
        formatter: (value) => (value ? '-' : 'Cancelled'),
      },
      { key: 'franchise', label: 'Franchise', dataKey: 'franchise' },
    ];

    const actions: ITableAction<IWorkshopInvoice>[] = [
      {
        label: 'Edit',
        icon: 'edit',
        color: 'primary',
        onClick: (row) => this.router.navigate(['/workshop-invoices/edit', row.workshopInvoiceId]),
        visible: (row) => this.canUpdate && row.active,
      },
      {
        label: 'Download PDF',
        icon: 'picture_as_pdf',
        color: 'primary',
        onClick: (row) => void this.downloadInvoice(row),
        visible: (row) => !!row.invoiceId,
      },
      {
        label: 'Cancel',
        icon: 'block',
        color: 'warn',
        onClick: (row) => void this.cancelInvoice(row),
        visible: (row) => this.canCancel && row.active,
      },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search bill-to, invoice no. or description...',
      showPagination: true,
      pageSize: this.pageSize,
      pageSizeOptions: [10, 25, 50],
      showHeader: true,
      emptyMessage: 'No workshop invoices found',
      rowClass: (row) => (row.active ? '' : 'cancelled-row'),
    };
  }

  private buildSearch(): IWorkshopInvoiceSearch {
    const search: IWorkshopInvoiceSearch = { page: this.pageIndex, limit: this.pageSize };
    if (this.search.trim()) search.search = this.search.trim();
    if (this.franchiseId) search.franchiseId = this.franchiseId;
    if (this.paymentStatusId) search.paymentStatusId = this.paymentStatusId;
    if (this.invoiceDateFrom) search.invoiceDateFrom = moment(this.invoiceDateFrom).format('YYYY-MM-DD');
    if (this.invoiceDateTo) search.invoiceDateTo = moment(this.invoiceDateTo).format('YYYY-MM-DD');
    if (!this.includeCancelled) search.includeCancelled = false;
    return search;
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.apiService.getList(this.buildSearch());
      this.data = response.tableData;
      this.totalCount = response.count;
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
    }
  }

  onFiltersChange(): void {
    this.pageIndex = 0;
    void this.loadData();
  }

  clearFilters(): void {
    this.franchiseId = null;
    this.paymentStatusId = null;
    this.invoiceDateFrom = null;
    this.invoiceDateTo = null;
    this.includeCancelled = true;
    this.onFiltersChange();
  }

  async onPageChange(pagination: { pageIndex: number; pageSize: number }): Promise<void> {
    this.pageIndex = pagination.pageIndex;
    this.pageSize = pagination.pageSize;
    await this.loadData();
  }

  onSearchChange(search: string): void {
    this.searchSubject.next(search);
  }

  createItem(): void {
    this.router.navigate(['/workshop-invoices/new']);
  }

  async downloadInvoice(row: IWorkshopInvoice): Promise<void> {
    try {
      const file = await this.apiService.downloadInvoice(row.workshopInvoiceId);
      const link = document.createElement('a');
      link.setAttribute('href', `data:application/pdf;base64,${file.buffer}`);
      link.setAttribute('download', file.fileName);
      link.click();
      link.remove();
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  async cancelInvoice(row: IWorkshopInvoice): Promise<void> {
    const data: CancelWorkshopInvoiceDialogData = {
      invoiceLabel: row.invoiceId || `draft invoice for ${row.billToName}`,
      issued: !!row.invoiceId,
    };
    const dialogRef = this.dialog.open<CancelWorkshopInvoiceDialogComponent, CancelWorkshopInvoiceDialogData, string>(
      CancelWorkshopInvoiceDialogComponent,
      { width: '520px', data },
    );
    const reason = await firstValueFrom(dialogRef.afterClosed());
    if (!reason) {
      return;
    }
    try {
      await this.apiService.cancel(row.workshopInvoiceId, reason);
      this.snackBar.open('Invoice cancelled', 'Close', { duration: 3000 });
      await this.loadData();
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    }
  }
}
