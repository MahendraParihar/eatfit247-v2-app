import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  DataTableComponent,
  ITableAction,
  ITableColumn,
  ITableConfig,
} from '@shared';
import {
  IMemberProductReportFilter,
  IMemberProductReportItem,
  ShipmentStatusEnum,
} from '@eatfit247-shared-lib';
import { MemberProductReportApiService } from './api.service';
import { ShipmentAdminApiService } from './shipment-admin-api.service';
import {
  MemberProductShipmentStatusDialogComponent,
  MemberProductShipmentStatusDialogData,
} from './shipment-status-dialog/shipment-status-dialog.component';

@Component({
  selector: 'lib-member-product-report',
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
    MatCardModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    DataTableComponent,
  ],
  templateUrl: './member-product-report.html',
  styleUrl: './member-product-report.scss',
})
export class MemberProductReportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(MemberProductReportApiService);
  private shipmentAdminApi = inject(ShipmentAdminApiService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  filterForm!: FormGroup;
  data: IMemberProductReportItem[] = [];
  totalCount = 0;
  loading = false;
  exporting = false;
  bulkExporting = false;
  tableConfig!: ITableConfig<IMemberProductReportItem>;
  franchiseOptions: { id: number | null; label: string }[] = [];
  paymentStatusOptions: { id: number | null; label: string }[] = [];
  readonly shipmentStatusEnumValues = Object.values(ShipmentStatusEnum);
  startDatePicker: any;
  endDatePicker: any;
  selectedQuickFilter: string | null = null;
  selectedItems: IMemberProductReportItem[] = [];
  private readonly creatingShipmentOrderIds = new Set<number>();

  constructor() {
    this.initializeForm();
    this.initializeTable();
  }

  ngOnInit(): void {
    this.loadFranchiseOptions();
    this.loadPaymentStatusOptions();

    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    this.filterForm.patchValue({
      startDate,
      endDate,
    });

    // Reset quick filter when dates are manually changed
    this.filterForm.get('startDate')?.valueChanges.subscribe(() => {
      if (this.selectedQuickFilter) {
        this.selectedQuickFilter = null;
      }
    });

    this.filterForm.get('endDate')?.valueChanges.subscribe(() => {
      if (this.selectedQuickFilter) {
        this.selectedQuickFilter = null;
      }
    });
  }

  onQuickFilterChange(value: string | null): void {
    if (value) {
      this.applyQuickFilter(value);
    } else {
      this.selectedQuickFilter = null;
    }
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      franchiseId: [null],
      paymentStatusId: [null],
      shipmentPresence: ['all'],
      shipmentStatus: [null as ShipmentStatusEnum | null],
    });
  }

  private initializeTable(): void {
    const columns: ITableColumn<IMemberProductReportItem>[] = [
      {
        key: 'invoiceId',
        label: 'Invoice ID',
        dataKey: 'invoiceId',
        sortable: true,
        width: '120px',
      },
      {
        key: 'memberName',
        label: 'Member Name',
        dataKey: 'memberName',
        sortable: true,
      },
      {
        key: 'memberEmail',
        label: 'Email',
        dataKey: 'memberEmail',
        sortable: false,
      },
      {
        key: 'memberContactNumber',
        label: 'Contact',
        dataKey: 'memberContactNumber',
        sortable: false,
        width: '120px',
      },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        dataKey: 'totalAmount',
        sortable: true,
        width: '140px',
        formatter: (value: number, row: IMemberProductReportItem) => {
          const currency = row.currency || 'INR';
          const totalAmount = row.totalAmount || 0;
          return `${currency} ${totalAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        },
      },
      {
        key: 'paymentStatus',
        label: 'Payment Status',
        dataKey: 'paymentStatus',
        sortable: true,
        width: '130px',
      },
      {
        key: 'paymentDate',
        label: 'Payment Date',
        dataKey: 'paymentDate',
        type: 'date',
        sortable: true,
        width: '130px',
      },
      {
        key: 'shipmentStatus',
        label: 'Shipment status',
        dataKey: 'shipment',
        sortable: false,
        width: '140px',
        formatter: (_value: unknown, row: IMemberProductReportItem) =>
          this.formatShipmentStatusCell(row),
      },
      {
        key: 'shipmentCarrier',
        label: 'Carrier',
        dataKey: 'shipment',
        sortable: false,
        width: '120px',
        formatter: (_value: unknown, row: IMemberProductReportItem) =>
          row.shipment?.providerName ?? '—',
      },
      {
        key: 'shipmentTracking',
        label: 'Tracking #',
        dataKey: 'shipment',
        sortable: false,
        width: '130px',
        formatter: (_value: unknown, row: IMemberProductReportItem) =>
          row.shipment?.trackingNumber ?? '—',
      },
      {
        key: 'franchise',
        label: 'Franchise',
        dataKey: 'franchise',
        sortable: true,
      },
    ];

    const actions: ITableAction<IMemberProductReportItem>[] = [
      {
        label: 'View Order',
        icon: 'shopping_cart',
        color: 'primary',
        onClick: (row) => this.viewOrder(row),
      },
      {
        label: 'Create shipment',
        icon: 'add_box',
        color: 'accent',
        visible: (row) => !row.shipment?.shipmentId,
        disabled: (row) => this.creatingShipmentOrderIds.has(row.memberProductId),
        onClick: (row) => {
          void this.createShipmentForRow(row);
        },
      },
      {
        label: 'Shipping',
        icon: 'local_shipping',
        color: 'primary',
        visible: (row) => !!row.shipment?.shipmentId,
        onClick: (row) => this.openShipmentDialog(row),
      },
    ];

    this.tableConfig = {
      columns,
      actions,
      selectable: true,
      showSearch: false,
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50, 100],
      showHeader: true,
      emptyMessage: 'No product orders found',
    };
  }

  async loadFranchiseOptions(): Promise<void> {
    try {
      const franchises = await this.apiService.getFranchiseDropdown();
      this.franchiseOptions = [
        { id: null, label: 'All Franchises' },
        ...franchises.map((f) => ({
          id: typeof f.id === 'string' ? Number(f.id) : f.id,
          label: f.label,
        })),
      ];
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  async loadPaymentStatusOptions(): Promise<void> {
    try {
      const statuses = await this.apiService.getPaymentStatusDropdown();
      this.paymentStatusOptions = [
        { id: null, label: 'All Statuses' },
        ...statuses.map((s) => ({
          id: typeof s.id === 'string' ? Number(s.id) : s.id,
          label: s.label,
        })),
      ];
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  async onSearch(): Promise<void> {
    if (this.filterForm.invalid) {
      return;
    }

    this.loading = true;
    try {
      const formValue = this.filterForm.value;
      const params: IMemberProductReportFilter = {
        startDate: this.formatDate(formValue.startDate),
        endDate: this.formatDate(formValue.endDate),
        franchiseId: formValue.franchiseId || undefined,
        paymentStatusId: formValue.paymentStatusId || undefined,
        ...this.buildShipmentFilterParams(formValue),
      };

      const response = await this.apiService.getMemberProductReport(params);
      this.data = response.tableData;
      this.totalCount = response.count;
      // Clear selection when new data is loaded
      this.selectedItems = [];
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
    }
  }

  onSelectionChange(selectedItems: IMemberProductReportItem[]): void {
    this.selectedItems = selectedItems;
  }

  async onPageChange(pagination: any): Promise<void> {
    // For now, we'll reload with the same filters
    // In a real scenario, you might want to add pagination params
    await this.onSearch();
  }

  async onSortChange(sort: any): Promise<void> {
    // Sorting can be handled server-side if needed
    await this.onSearch();
  }

  private buildShipmentFilterParams(formValue: {
    shipmentPresence?: string;
    shipmentStatus?: ShipmentStatusEnum | null;
  }): Pick<IMemberProductReportFilter, 'hasShipment' | 'shipmentStatus'> {
    const out: Pick<IMemberProductReportFilter, 'hasShipment' | 'shipmentStatus'> = {};
    if (formValue.shipmentPresence === 'yes') {
      out.hasShipment = true;
    } else if (formValue.shipmentPresence === 'no') {
      out.hasShipment = false;
    }
    if (formValue.shipmentStatus) {
      out.shipmentStatus = formValue.shipmentStatus;
    }
    return out;
  }

  formatShipmentStatusCell(row: IMemberProductReportItem): string {
    if (!row.shipment) {
      return 'No shipment';
    }
    return this.formatShipmentStatusLabel(row.shipment.status);
  }

  formatShipmentStatusLabel(status: string): string {
    if (!status) {
      return '—';
    }
    return status
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }

  async createShipmentForRow(row: IMemberProductReportItem): Promise<void> {
    if (row.shipment?.shipmentId) {
      return;
    }
    const orderId = row.memberProductId;
    if (this.creatingShipmentOrderIds.has(orderId)) {
      return;
    }
    this.creatingShipmentOrderIds.add(orderId);
    this.cdr.markForCheck();
    try {
      await this.shipmentAdminApi.createShipmentForMemberProductOrder(orderId);
      this.snackBar.open('Shipment creation requested.', 'Close', {
        duration: 4000,
      });
      await this.onSearch();
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.creatingShipmentOrderIds.delete(orderId);
      this.cdr.markForCheck();
    }
  }

  openShipmentDialog(row: IMemberProductReportItem): void {
    const shipmentId = row.shipment?.shipmentId;
    if (!shipmentId) {
      return;
    }
    const data: MemberProductShipmentStatusDialogData = { shipmentId };
    const ref = this.dialog.open(MemberProductShipmentStatusDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data,
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.retried) {
        void this.onSearch();
      }
    });
  }

  viewOrder(productOrder: IMemberProductReportItem): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree([
        '/members/details',
        productOrder.memberId,
        'product-orders',
      ])
    );
    window.open(url, '_blank');
  }

  private formatDate(date: Date): string {
    if (!date) {
      return '';
    }
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  applyQuickFilter(filterType: string): void {
    this.selectedQuickFilter = filterType;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    let endDate: Date = new Date(today);

    switch (filterType) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'currentMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case 'lastMonth': {
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        startDate = new Date(lastMonth);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      }
      case 'thisQuarter': {
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(today);
        break;
      }
      case 'thisFinancialYear': {
        // Assuming financial year starts from April (month 3, 0-indexed)
        const currentFYStartMonth = 3; // April
        if (today.getMonth() >= currentFYStartMonth) {
          // Current financial year started this calendar year
          startDate = new Date(today.getFullYear(), currentFYStartMonth, 1);
        } else {
          // Current financial year started last calendar year
          startDate = new Date(today.getFullYear() - 1, currentFYStartMonth, 1);
        }
        endDate = new Date(today);
        break;
      }
      case 'lastFinancialYear': {
        // Assuming financial year starts from April (month 3, 0-indexed)
        if (today.getMonth() >= 3) {
          // Last financial year was from April of last year to March of this year
          startDate = new Date(today.getFullYear() - 1, 3, 1);
          endDate = new Date(today.getFullYear(), 2, 31);
        } else {
          // Last financial year was from April of year before last to March of last year
          startDate = new Date(today.getFullYear() - 2, 3, 1);
          endDate = new Date(today.getFullYear() - 1, 2, 31);
        }
        break;
      }
      default:
        return;
    }

    this.filterForm.patchValue({
      startDate,
      endDate,
    });

    // Automatically trigger search
    this.onSearch();
  }

  async onExport(): Promise<void> {
    if (this.filterForm.invalid) {
      return;
    }

    this.exporting = true;
    try {
      const formValue = this.filterForm.value;
      const params: IMemberProductReportFilter = {
        startDate: this.formatDate(formValue.startDate),
        endDate: this.formatDate(formValue.endDate),
        franchiseId: formValue.franchiseId || undefined,
        paymentStatusId: formValue.paymentStatusId || undefined,
        ...this.buildShipmentFilterParams(formValue),
      };

      const blob = await this.apiService.exportMemberProductReports(params);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with date range
      const startDateStr = params.startDate.replace(/-/g, '');
      const endDateStr = params.endDate.replace(/-/g, '');
      link.download = `member-product-reports_${startDateStr}_to_${endDateStr}.zip`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      this.snackBar.open(
        'Failed to export member product reports. Please try again.',
        'Close',
        {
          duration: 5000,
        }
      );
    } finally {
      this.exporting = false;
    }
  }

  async onBulkExport(): Promise<void> {
    if (this.selectedItems.length === 0) {
      this.snackBar.open(
        'Please select at least one item to export.',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }

    this.bulkExporting = true;
    try {
      const memberProductIds = this.selectedItems.map(
        (item) => item.memberProductId
      );
      const blob = await this.apiService.exportMemberProductReportsBulk(
        memberProductIds
      );

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, -5);
      link.download = `member-product-reports_selected_${timestamp}.zip`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Clear selection after successful export
      this.selectedItems = [];
    } catch (error) {
      this.snackBar.open(
        'Failed to export selected reports. Please try again.',
        'Close',
        {
          duration: 5000,
        }
      );
    } finally {
      this.bulkExporting = false;
    }
  }
}
