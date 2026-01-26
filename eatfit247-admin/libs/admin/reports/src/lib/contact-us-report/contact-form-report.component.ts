import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatOption } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DataTableComponent, ITableAction, ITableColumn, ITableConfig } from '@shared';
import { IContactFormReportFilter, IContactFormReportItem } from '@eatfit247-shared-lib';
import { ContactFormReportApiService } from './api.service';
import { ViewContactFormDetailsComponent } from './view-contact-form-details/view-contact-form-details.component';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'lib-contact-form-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatButtonToggleModule,
    MatDialogModule,
    DataTableComponent,
    MatSelect,
    MatOption
  ],
  templateUrl: './contact-form-report.html',
  styleUrl: './contact-form-report.scss'
})
export class ContactFormReportComponent implements OnInit {
  filterForm!: FormGroup;
  data: IContactFormReportItem[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IContactFormReportItem>;
  selectedQuickFilter: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ContactFormReportApiService,
    private dialog: MatDialog
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeTable();
    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    this.filterForm.patchValue({
      startDate,
      endDate,
      isResponded: false
    });
    // Automatically trigger search on init with default filters
    this.onSearch();
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
      search: [null],
      isResponded: [false]
    });
  }

  private initializeTable(): void {
    const columns: ITableColumn<IContactFormReportItem>[] = [
      {
        key: 'name',
        label: 'Name',
        dataKey: 'name',
        sortable: true
      },
      {
        key: 'emailId',
        label: 'Email',
        dataKey: 'emailId',
        sortable: true,
        formatter: (value: string, row: IContactFormReportItem) => {
          return `${row.contactNumber}\n${row.emailId}`;
        }
      },
      {
        key: 'message',
        label: 'Message',
        dataKey: 'message',
        sortable: false,
        formatter: (value: string) => {
          return value && value.length > 50
            ? `${value.substring(0, 50)}...`
            : value;
        }
      },
      {
        key: 'isResponded',
        label: 'Status',
        dataKey: 'isResponded',
        sortable: true,
        formatter: (value: boolean) => {
          return value ? 'Responded' : 'Pending';
        }
      },
      {
        key: 'respondedByUserName',
        label: 'Responded By',
        dataKey: 'respondedByUserName',
        sortable: false,
        formatter: (value: string | null) => {
          return value || 'N/A';
        }
      },
      {
        key: 'createdAt',
        label: 'Submitted Date',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true
      }
    ];
    const actions: ITableAction<IContactFormReportItem>[] = [
      {
        label: 'View Details',
        icon: 'visibility',
        onClick: (item: IContactFormReportItem) => this.viewDetails(item),
        color: 'primary'
      }
    ];
    this.tableConfig = {
      columns,
      actions,
      showSearch: false,
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50, 100],
      showHeader: true,
      emptyMessage: 'No contact form submissions found'
    };
  }

  async onSearch(): Promise<void> {
    if (this.filterForm.invalid) {
      return;
    }
    this.loading = true;
    try {
      const formValue = this.filterForm.value;
      const params: IContactFormReportFilter = {
        startDate: this.formatDate(formValue.startDate),
        endDate: this.formatDate(formValue.endDate),
        search: formValue.search || '',
        isResponded: formValue.isResponded
      };
      const response = await this.apiService.getContactFormReport(params);
      this.data = response.tableData;
      this.totalCount = response.count;
    } catch (error) {
      console.error('Failed to load contact form report:', error);
    } finally {
      this.loading = false;
    }
  }

  async onPageChange(pagination: any): Promise<void> {
    await this.onSearch();
  }

  async onSortChange(sort: any): Promise<void> {
    await this.onSearch();
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
      endDate
    });
    // Automatically trigger search
    this.onSearch();
  }

  async viewDetails(item: IContactFormReportItem): Promise<void> {
    try {
      // Fetch full details
      const fullDetails = await this.apiService.getContactFormDetails(item.contactFormId);
      const dialogRef = this.dialog.open(ViewContactFormDetailsComponent, {
        width: '800px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        data: { contactForm: fullDetails },
        closeOnNavigation: false,
        disableClose: false
      });
      dialogRef.afterClosed().subscribe((result) => {
        // Reload data if response was submitted
        if (result?.updated) {
          this.onSearch();
        }
      });
    } catch (error) {
      console.error('Error loading contact form details:', error);
    }
  }
}

