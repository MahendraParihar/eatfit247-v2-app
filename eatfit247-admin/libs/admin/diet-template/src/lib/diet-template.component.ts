import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import {
  DataTableComponent,
  ITableColumn,
  ITableConfig,
  ITableAction,
  createdByUserFormatter,
  updatedByUserFormatter,
} from '@shared';
import { ITableList, IDietTemplate } from '@eatfit247-shared-lib';
import { DietTemplateApiService } from './api.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'lib-diet-template',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatCardModule],
  templateUrl: './diet-template.html',
  styleUrl: './diet-template.scss',
})
export class DietTemplateComponent implements OnInit {
  data: IDietTemplate[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IDietTemplate>;
  private searchSubject = new Subject<string>();

  constructor(
    private apiService: DietTemplateApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
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
        width: '80px',
      },
      {
        key: 'dietTemplate',
        label: 'Diet Template',
        dataKey: 'dietTemplate',
        sortable: true,
        searchable: true,
      },
      {
        key: 'cycleNo',
        label: 'Cycle No',
        dataKey: 'cycleNo',
        sortable: true,
        width: '100px',
        align: 'center',
      },
      {
        key: 'dayNo',
        label: 'Day No',
        dataKey: 'dayNo',
        sortable: true,
        width: '100px',
        align: 'center',
      },
      {
        key: 'noOfCycle',
        label: 'No of Cycles',
        dataKey: 'noOfCycle',
        sortable: true,
        width: '120px',
        align: 'center',
      },
      {
        key: 'noOfDaysInCycle',
        label: 'Days in Cycle',
        dataKey: 'noOfDaysInCycle',
        sortable: true,
        width: '120px',
        align: 'center',
      },
      {
        key: 'active',
        label: 'Status',
        dataKey: 'active',
        sortable: true,
        width: '120px',
        align: 'center',
        formatter: (value) => (value ? 'Active' : 'Inactive'),
      },
      {
        key: 'createdByUser',
        label: 'Created By',
        dataKey: 'createdByUser',
        sortable: false,
        formatter: createdByUserFormatter(),
      },
      {
        key: 'updatedByUser',
        label: 'Updated By',
        dataKey: 'updatedByUser',
        sortable: false,
        formatter: updatedByUserFormatter(),
      },
      {
        key: 'createdAt',
        label: 'Created At',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true,
      },
      {
        key: 'updatedAt',
        label: 'Updated At',
        dataKey: 'updatedAt',
        type: 'date',
        sortable: true,
      },
    ];

    const actions: ITableAction<IDietTemplate>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      {
        label: 'Active',
        icon: 'check_circle',
        color: 'primary',
        visible: (row) => !row.active,
        onClick: (row) => this.toggleStatus(row),
      },
      {
        label: 'Inactive',
        icon: 'cancel',
        color: 'warn',
        visible: (row) => row.active === true,
        onClick: (row) => this.toggleStatus(row),
      },
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
      emptyMessage: 'No diet template records found',
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
            limit: this.tableConfig.pageSize || 10,
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
        },
      });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IDietTemplate> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10,
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
      });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  onSearchChange(search: string): void {
    this.searchSubject.next(search);
  }

  editItem(item: IDietTemplate): void {
    this.router.navigate(['/diet-template/edit', item.dietTemplateId]);
  }

  createItem(): void {
    this.router.navigate(['/diet-template/new']);
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
