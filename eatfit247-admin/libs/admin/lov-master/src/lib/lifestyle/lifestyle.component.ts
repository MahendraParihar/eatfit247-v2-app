import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  createdByUserFormatter,
  DataTableComponent,
  ITableAction,
  ITableColumn,
  ITableConfig,
  updatedByUserFormatter
} from '@shared';
import { ILifestyle, ITableList } from '@eatfit247-shared-lib';
import { LovMasterApiService } from '../api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-lifestyle',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './lifestyle.html',
  styleUrl: './lifestyle.scss',
})
export class Lifestyle implements OnInit {
  data: ILifestyle[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<ILifestyle>;
  private searchSubject = new Subject<string>();

  constructor(
    private apiService: LovMasterApiService,
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
    const columns: ITableColumn<ILifestyle>[] = [
      { key: 'lifestyleId', label: 'ID', dataKey: 'lifestyleId', sortable: true, width: '80px' },
      {
        key: 'image',
        label: 'Image',
        dataKey: 'imagePath',
        type: 'image',
        isAvatar: true,
        imageAlt: 'Lifestyle Image',
        sortable: false,
        width: '80px',
        align: 'center'
      },
      { key: 'lifestyle', label: 'Lifestyle', dataKey: 'lifestyle', sortable: true, searchable: true },
      { key: 'active', label: 'Status', dataKey: 'active', sortable: true, width: '120px', align: 'center', formatter: (value) => (value ? 'Active' : 'Inactive') },
      { key: 'createdByUser', label: 'Created By', dataKey: 'createdByUser', sortable: false, formatter: createdByUserFormatter() },
      { key: 'updatedByUser', label: 'Updated By', dataKey: 'updatedByUser', sortable: false, formatter: updatedByUserFormatter() },
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
        type: 'date',
        dataKey: 'updatedAt',
        sortable: true
      },
    ];

    const actions: ITableAction<ILifestyle>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search lifestyle...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No lifestyle records found',
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getLifestyleList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => { this.data = response.tableData; this.totalCount = response.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<ILifestyle> = await this.apiService.getLifestyleList({ page: 0, limit: this.tableConfig.pageSize || 10 });
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
      const response: ITableList<ILifestyle> = await this.apiService.getLifestyleList({ page: pagination.pageIndex, limit: pagination.pageSize });
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
      const response: ITableList<ILifestyle> = await this.apiService.getLifestyleList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction });
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

  editItem(item: ILifestyle): void {
    this.router.navigate(['/lov-master/lifestyle/edit', item.lifestyleId]);
  }

  createItem(): void {
    this.router.navigate(['/lov-master/lifestyle/new']);
  }

  async toggleStatus(item: ILifestyle): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.lifestyle}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateLifestyleStatus(item.lifestyleId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}

