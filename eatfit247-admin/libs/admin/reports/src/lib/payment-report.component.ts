import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  DataTableComponent,
  ITableAction,
  ITableColumn,
  ITableConfig,
} from '@shared';
import { PaymentReportApiService, PaymentReportItem, PaymentReportFilter } from './api.service';
import { PaymentDetailsDialogComponent } from 'members';

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
    MatCardModule,
    MatDialogModule,
    DataTableComponent,
  ],
  templateUrl: './payment-report.html',
  styleUrl: './payment-report.scss',
})
export class PaymentReportComponent implements OnInit {
  filterForm!: FormGroup;
  data: PaymentReportItem[] = [];
  totalCount = 0;
  loading = false;
  exporting = false;
  tableConfig!: ITableConfig<PaymentReportItem>;
  franchiseOptions: { id: number | null; label: string }[] = [];
  startDatePicker: any;
  endDatePicker: any;
  selectedQuickFilter: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: PaymentReportApiService,
    private dialog: MatDialog,
    private router: Router,
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadFranchiseOptions();
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

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      franchiseId: [null],
    });
  }

  private initializeTable(): void {
    const columns: ITableColumn<PaymentReportItem>[] = [
      {
        key: 'memberName',
        label: 'Member Name',
        dataKey: 'memberName',
        sortable: true,
      },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        dataKey: 'totalAmount',
        sortable: true,
        formatter: (value: number, row: PaymentReportItem) => {
          return `${row.paymentObj.currency} ${row.paymentObj.pricing.totalAmount.toLocaleString(
            'en-IN',
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}`;
        },
      },
      {
        key: 'paymentDate',
        label: 'Payment Date',
        dataKey: 'paymentDate',
        type: 'date',
        sortable: true,
      },
      {
        key: 'franchiseName',
        label: 'Franchise Name',
        dataKey: 'franchiseName',
        sortable: true,
      },
    ];

    const actions: ITableAction<PaymentReportItem>[] = [
      {
        label: 'View Invoice',
        icon: 'receipt',
        color: 'primary',
        onClick: (row) => this.viewInvoice(row),
      },
      {
        label: 'View Member',
        icon: 'person',
        color: 'primary',
        onClick: (row) => this.viewMember(row),
      },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: false,
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50, 100],
      showHeader: true,
      emptyMessage: 'No payment records found',
    };
  }

  async loadFranchiseOptions(): Promise<void> {
    try {
      const franchises = await this.apiService.getFranchiseDropdown();
      this.franchiseOptions = [
        { id: null, label: 'All Franchises' },
        ...franchises.map((f) => ({ id: typeof f.id === 'string' ? Number(f.id) : f.id, label: f.label })),
      ];
    } catch (error) {
      console.error('Failed to load franchise options:', error);
    }
  }

  async onSearch(): Promise<void> {
    if (this.filterForm.invalid) {
      return;
    }

    this.loading = true;
    try {
      const formValue = this.filterForm.value;
      const params: PaymentReportFilter = {
        startDate: this.formatDate(formValue.startDate),
        endDate: this.formatDate(formValue.endDate),
        franchiseId: formValue.franchiseId || undefined,
      };

      const response = await this.apiService.getPaymentReport(params);
      this.data = response.tableData;
      this.totalCount = response.count;
    } catch (error) {
      console.error('Failed to load payment report:', error);
    } finally {
      this.loading = false;
    }
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

  viewInvoice(payment: PaymentReportItem): void {
    this.dialog.open(PaymentDetailsDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { payment },
    });
  }

  viewMember(payment: PaymentReportItem): void {
    this.router.navigate(['/members/details', payment.memberId, 'dashboard']);
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
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
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
      const params: PaymentReportFilter = {
        startDate: this.formatDate(formValue.startDate),
        endDate: this.formatDate(formValue.endDate),
        franchiseId: formValue.franchiseId || undefined,
      };

      const blob = await this.apiService.exportPaymentReports(params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with date range
      const startDateStr = params.startDate.replace(/-/g, '');
      const endDateStr = params.endDate.replace(/-/g, '');
      link.download = `payment-reports_${startDateStr}_to_${endDateStr}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export payment reports:', error);
    } finally {
      this.exporting = false;
    }
  }
}

