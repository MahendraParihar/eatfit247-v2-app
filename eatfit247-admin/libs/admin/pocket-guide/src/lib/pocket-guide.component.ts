import { Component, OnInit, inject } from '@angular/core';
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
import { IPocketGuide, ITableList } from '@eatfit247-shared-lib';
import { PocketGuideApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-pocket-guide',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './pocket-guide.html',
  styleUrl: './pocket-guide.scss',
})
export class PocketGuide implements OnInit {
  private apiService = inject(PocketGuideApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  data: IPocketGuide[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IPocketGuide>;
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
    const columns: ITableColumn<IPocketGuide>[] = [
      {
        key: 'pocketGuideId',
        label: 'ID',
        dataKey: 'pocketGuideId',
        sortable: true,
        width: '80px',
      },
      {
        key: 'image',
        label: 'Image',
        isAvatar: true,
        dataKey: 'imagePath',
        sortable: false,
        type: 'image',
      },
      {
        key: 'pocketGuide',
        label: 'Title',
        dataKey: 'pocketGuide',
        sortable: true,
        searchable: true,
      },
      { key: 'url', label: 'URL', dataKey: 'url', sortable: true },
      {
        key: 'visitedCount',
        label: 'Views',
        dataKey: 'visitedCount',
        sortable: true,
        width: '100px',
        align: 'center',
      },
      {
        key: 'shareCount',
        label: 'Shares',
        dataKey: 'shareCount',
        sortable: true,
        width: '100px',
        align: 'center',
      },
      {
        key: 'isVisibleToAll',
        label: 'Visible',
        dataKey: 'isVisibleToAll',
        sortable: true,
        width: '100px',
        align: 'center',
        formatter: (value) => (value ? 'Yes' : 'No'),
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

    const actions: ITableAction<IPocketGuide>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search pocket guide...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No pocket guide records found',
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => { this.data = response.tableData; this.totalCount = response.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IPocketGuide> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<IPocketGuide> = await this.apiService.getList({ page: pagination.pageIndex, limit: pagination.pageSize, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<IPocketGuide> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction, search: this.currentSearch?.trim() || undefined });
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

  editItem(item: IPocketGuide): void {
    this.router.navigate(['/pocket-guide/edit', item.pocketGuideId]);
  }

  createItem(): void {
    this.router.navigate(['/pocket-guide/new']);
  }

  viewItem(item: IPocketGuide): void {
    // View pocket guide - implementation depends on requirements
  }

  async toggleStatus(item: IPocketGuide): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.pocketGuide}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.pocketGuideId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
