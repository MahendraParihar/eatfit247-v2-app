import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn, TableConfig, TableAction, createdByUserFormatter, updatedByUserFormatter } from '@shared';
import { ITableList, ISleepingPattern } from '@eatfit247-shared-lib';
import { LovMasterApiService } from '../api.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'lib-sleeping-pattern',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './sleeping-pattern.html',
  styleUrl: './sleeping-pattern.scss',
})
export class SleepingPattern implements OnInit {
  data: ISleepingPattern[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: TableConfig<ISleepingPattern>;
  private searchSubject = new Subject<string>();

  constructor(private apiService: LovMasterApiService) {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: TableColumn<ISleepingPattern>[] = [
      { key: 'sleepingPatternId', label: 'ID', dataKey: 'sleepingPatternId', sortable: true, width: '80px' },
      { key: 'sleepingPattern', label: 'Sleeping Pattern', dataKey: 'sleepingPattern', sortable: true, searchable: true },
      { key: 'imagePath', label: 'Image', dataKey: 'imagePath', sortable: false, width: '100px', align: 'center', formatter: (value) => { if (!value) return '-'; const images = Array.isArray(value) ? value : (typeof value === 'string' ? JSON.parse(value) : [value]); return images?.[0]?.webUrl || images?.[0]?.url || '-'; } },
      { key: 'active', label: 'Status', dataKey: 'active', sortable: true, width: '120px', align: 'center', formatter: (value) => (value ? 'Active' : 'Inactive') },
      { key: 'createdByUser', label: 'Created By', dataKey: 'createdByUser', sortable: false, formatter: createdByUserFormatter() },
      { key: 'updatedByUser', label: 'Updated By', dataKey: 'updatedByUser', sortable: false, formatter: updatedByUserFormatter() },
      { key: 'createdAt', label: 'Created At', dataKey: 'createdAt', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleString() : '') },
      { key: 'updatedAt', label: 'Updated At', dataKey: 'updatedAt', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleString() : '') },
    ];

    const actions: TableAction<ISleepingPattern>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search sleeping pattern...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No sleeping pattern records found',
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getSleepingPatternList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => { this.data = response.data; this.totalCount = response.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<ISleepingPattern> = await this.apiService.getSleepingPatternList({ page: 0, limit: this.tableConfig.pageSize || 10 });
      this.data = response.data;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  async onPageChange(pagination: any): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<ISleepingPattern> = await this.apiService.getSleepingPatternList({ page: pagination.pageIndex, limit: pagination.pageSize });
      this.data = response.data;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  async onSortChange(sort: any): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<ISleepingPattern> = await this.apiService.getSleepingPatternList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction });
      this.data = response.data;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  onSearchChange(search: string): void {
    this.searchSubject.next(search);
  }

  editItem(item: ISleepingPattern): void {
    console.log('Edit sleeping pattern:', item);
  }

  async toggleStatus(item: ISleepingPattern): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.sleepingPattern}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateSleepingPatternStatus(item.sleepingPatternId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}

