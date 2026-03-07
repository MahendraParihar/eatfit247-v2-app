import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import {
  createdByUserFormatter,
  DataTableComponent,
  ITableAction,
  ITableColumn,
  ITableConfig,
  updatedByUserFormatter
} from '@shared';
import { IDietTemplate, ITableList } from '@eatfit247-shared-lib';
import { DietTemplateApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import {
  ManageDietTemplateDialogComponent,
  ManageDietTemplateDialogData
} from './dialog/manage-diet-template-dialog.component';

@Component({
  selector: 'lib-diet-template',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatCardModule],
  templateUrl: './diet-template.html',
  styleUrl: './diet-template.scss'
})
export class DietTemplateComponent implements OnInit {
  private apiService = inject(DietTemplateApiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  data: IDietTemplate[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IDietTemplate>;
  private searchSubject = new Subject<string>();
  currentSearch = '';

  constructor() {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IDietTemplate>[] = [
      {
        key: 'dietTemplateId',
        label: 'ID',
        dataKey: 'dietTemplateId',
        sortable: true,
        width: '80px'
      },
      {
        key: 'dietTemplate',
        label: 'Diet Template',
        dataKey: 'dietTemplate',
        sortable: true,
        searchable: true
      },
      {
        key: 'noOfCycle',
        label: 'No of Cycles',
        dataKey: 'noOfCycle',
        sortable: true,
        width: '120px',
        align: 'center'
      },
      {
        key: 'noOfDaysInCycle',
        label: 'Days in Cycle',
        dataKey: 'noOfDaysInCycle',
        sortable: true,
        width: '120px',
        align: 'center'
      },
      {
        key: 'active',
        label: 'Status',
        dataKey: 'active',
        sortable: true,
        width: '120px',
        align: 'center',
        formatter: (value) => (value ? 'Active' : 'Inactive')
      },
      {
        key: 'createdByUser',
        label: 'Created By',
        dataKey: 'createdByUser',
        sortable: false,
        formatter: createdByUserFormatter()
      },
      {
        key: 'updatedByUser',
        label: 'Updated By',
        dataKey: 'updatedByUser',
        sortable: false,
        formatter: updatedByUserFormatter()
      },
      {
        key: 'createdAt',
        label: 'Created At',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true
      },
      {
        key: 'updatedAt',
        label: 'Updated At',
        dataKey: 'updatedAt',
        type: 'date',
        sortable: true
      }
    ];
    const actions: ITableAction<IDietTemplate>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      {
        label: 'Add Day Plan',
        icon: 'add',
        color: 'primary',
        visible: (row) => !(row as any).isWeekly,
        onClick: (row) => this.addDayPlan(row)
      },
      {
        label: 'Add Cycle Plan',
        icon: 'add',
        color: 'primary',
        visible: (row) => !!(row as any).isWeekly,
        onClick: (row) => this.addCyclePlan(row)
      },
      {
        label: 'Active',
        icon: 'check_circle',
        color: 'primary',
        visible: (row) => !row.active,
        onClick: (row) => this.toggleStatus(row)
      },
      {
        label: 'Inactive',
        icon: 'cancel',
        color: 'warn',
        visible: (row) => row.active,
        onClick: (row) => this.toggleStatus(row)
      }
    ];
    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search diet template...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No diet template records found'
    };
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          this.loading = true;
          return this.apiService.getList({
            search,
            page: 0,
            limit: this.tableConfig.pageSize || 10
          });
        })
      )
      .subscribe({
        next: (response) => {
          this.data = response.tableData;
          this.totalCount = response.count;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IDietTemplate> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10,
        search: this.currentSearch?.trim() || undefined
      });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  async onPageChange(pagination: any): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IDietTemplate> = await this.apiService.getList({
        page: pagination.pageIndex,
        limit: pagination.pageSize,
        search: this.currentSearch?.trim() || undefined
      });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  async onSortChange(sort: any): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IDietTemplate> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10,
        sortBy: sort.active,
        sortOrder: sort.direction,
        search: this.currentSearch?.trim() || undefined
      });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  onSearchChange(search: string): void {
    this.currentSearch = search;
    this.searchSubject.next(search);
  }

  editItem(item: IDietTemplate): void {
    const dialogData: ManageDietTemplateDialogData = {
      dietTemplate: item
    };
    const dialogRef = this.dialog.open(ManageDietTemplateDialogComponent, {
      width: '600px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload data after successful update
        this.loadData();
      }
    });
  }

  manageDetails(item: IDietTemplate): void {
    // Navigate to cycle 1 by default, admin can navigate to other cycles from there
    this.router.navigate(['/diet-template/details', item.dietTemplateId, 'cycle', 1]);
  }

  addDayPlan(item: IDietTemplate): void {
    // Navigate to add day-wise diet details - start with cycle 1, day 1
    this.router.navigate(['/diet-template/details', item.dietTemplateId, 'cycle', 1, 'day', 1]);
  }

  addCyclePlan(item: IDietTemplate): void {
    // Navigate to add weekly diet details - start with cycle 1 (no day number)
    this.router.navigate(['/diet-template/details', item.dietTemplateId, 'cycle', 1]);
  }

  createItem(): void {
    const dialogData: ManageDietTemplateDialogData = {};
    const dialogRef = this.dialog.open(ManageDietTemplateDialogComponent, {
      width: '600px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload data after successful create
        this.loadData();
      }
    });
  }

  async toggleStatus(item: IDietTemplate): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(
      `Are you sure you want to ${action} "${item.dietTemplate}"?`
    );
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.dietTemplateId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
