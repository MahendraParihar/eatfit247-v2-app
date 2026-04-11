import { Component, OnInit, inject } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { DataTableComponent, ITableAction, ITableColumn, ITableConfig, ITableSort } from '@shared';
import { IMemberIssueReportFilter, IMemberIssueReportItem } from '@eatfit247-shared-lib';
import { MemberIssuesReportApiService } from './api.service';
import { ViewMemberIssueDetailsComponent } from './view-member-issue-details/view-member-issue-details.component';

@Component({
  selector: 'lib-member-issues-report',
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
    MatSnackBarModule,
    DataTableComponent,
    MatSelect,
    MatOption,
    MatSelectModule
  ],
  templateUrl: './member-issues-report.html',
  styleUrl: './member-issues-report.scss'
})
export class MemberIssuesReportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(MemberIssuesReportApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  filterForm!: FormGroup;
  data: IMemberIssueReportItem[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IMemberIssueReportItem>;
  selectedQuickFilter: string | null = null;
  issueStatusOptions: { id: number | null; label: string }[] = [];
  issueCategoryOptions: { id: number | null; label: string }[] = [];
  private reportSort: { sortBy: string; sortOrder: 'asc' | 'desc' } | null = null;

  constructor() {
    this.initializeForm();
  }

  async ngOnInit(): Promise<void> {
    this.initializeTable();
    await this.loadIssuesMasterData();
    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    this.filterForm.patchValue({
      startDate,
      endDate
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
      issueStatusId: [null],
      issueCategoryId: [null]
    });
  }

  private initializeTable(): void {
    const columns: ITableColumn<IMemberIssueReportItem>[] = [
      {
        key: 'memberName',
        label: 'Member Name',
        dataKey: 'memberName',
        sortable: true
      },
      {
        key: 'memberEmail',
        label: 'Email',
        dataKey: 'memberEmail',
        sortable: false
      },
      {
        key: 'memberContactNumber',
        label: 'Contact',
        dataKey: 'memberContactNumber',
        sortable: false,
        width: '120px'
      },
      {
        key: 'issue',
        label: 'Issue',
        dataKey: 'issue',
        sortable: false,
        formatter: (value: string) => {
          return value && value.length > 50
            ? `${value.substring(0, 50)}...`
            : value;
        }
      },
      {
        key: 'issueCategory',
        label: 'Category',
        dataKey: 'issueCategory',
        sortable: false
      },
      {
        key: 'issueStatus',
        label: 'Status',
        dataKey: 'issueStatus',
        sortable: false
      },
      {
        key: 'hasResponse',
        label: 'Has Response',
        dataKey: 'hasResponse',
        sortable: false,
        formatter: (value: boolean) => {
          return value ? 'Yes' : 'No';
        }
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true
      }
    ];
    const actions: ITableAction<IMemberIssueReportItem>[] = [
      {
        label: 'View/Respond',
        icon: 'chat',
        onClick: (item: IMemberIssueReportItem) => this.viewDetails(item),
        color: 'primary'
      },
      {
        label: 'View Member',
        icon: 'person',
        onClick: (item: IMemberIssueReportItem) => this.viewMember(item),
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
      emptyMessage: 'No member issues found'
    };
  }

  async onSearch(): Promise<void> {
    if (this.filterForm.invalid) {
      return;
    }
    this.loading = true;
    try {
      const params = this.buildReportParams();
      const response = await this.apiService.getMemberIssuesReport(params);
      this.data = response.tableData;
      this.totalCount = response.count;
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
    }
  }

  async onPageChange(pagination: any): Promise<void> {
    await this.onSearch();
  }

  async onSortChange(sort: ITableSort): Promise<void> {
    if (sort.direction === 'asc' || sort.direction === 'desc') {
      this.reportSort = { sortBy: sort.active, sortOrder: sort.direction };
    } else {
      this.reportSort = null;
    }
    await this.onSearch();
  }

  private buildReportParams(): IMemberIssueReportFilter {
    const formValue = this.filterForm.value;
    const params: IMemberIssueReportFilter = {
      startDate: this.formatDate(formValue.startDate),
      endDate: this.formatDate(formValue.endDate),
      search: formValue.search || undefined,
      issueStatusId: formValue.issueStatusId || undefined,
      issueCategoryId: formValue.issueCategoryId || undefined,
    };
    if (this.reportSort) {
      params.sortBy = this.reportSort.sortBy;
      params.sortOrder = this.reportSort.sortOrder;
    }
    return params;
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
        const currentFYStartMonth = 3; // April
        if (today.getMonth() >= currentFYStartMonth) {
          startDate = new Date(today.getFullYear(), currentFYStartMonth, 1);
        } else {
          startDate = new Date(today.getFullYear() - 1, currentFYStartMonth, 1);
        }
        endDate = new Date(today);
        break;
      }
      case 'lastFinancialYear': {
        if (today.getMonth() >= 3) {
          startDate = new Date(today.getFullYear() - 1, 3, 1);
          endDate = new Date(today.getFullYear(), 2, 31);
        } else {
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

  async viewDetails(item: IMemberIssueReportItem): Promise<void> {
    try {
      const dialogRef = this.dialog.open(ViewMemberIssueDetailsComponent, {
        width: '800px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        data: { memberIssue: item },
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
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  viewMember(item: IMemberIssueReportItem): void {
    this.router.navigate(['/members/details', item.memberId, 'dashboard']);
  }

  private async loadIssuesMasterData(): Promise<void> {
    try {
      const masterData = await this.apiService.getIssuesMasterData();
      this.issueStatusOptions = masterData.status.map(item => ({
        id: item.id as number,
        label: item.label
      }));
      this.issueCategoryOptions = masterData.categories.map(item => ({
        id: item.id as number,
        label: item.label
      }));
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
      this.issueStatusOptions = [];
      this.issueCategoryOptions = [];
    }
  }
}

