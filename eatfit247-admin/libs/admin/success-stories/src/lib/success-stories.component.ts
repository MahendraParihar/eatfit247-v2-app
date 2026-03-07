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
import { ISuccessStory, ITableList } from '@eatfit247-shared-lib';
import { SuccessStoriesApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-success-stories',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './success-stories.html',
  styleUrl: './success-stories.scss',
})
export class SuccessStories implements OnInit {
  data: ISuccessStory[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<ISuccessStory>;
  private searchSubject = new Subject<string>();
  currentSearch = '';

  constructor(
    private apiService: SuccessStoriesApiService,
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
    const columns: ITableColumn<ISuccessStory>[] = [
      { key: 'successStoryId', label: 'ID', dataKey: 'successStoryId', sortable: true, width: '80px' },
      { key: 'name', label: 'Name', dataKey: 'name', sortable: true, searchable: true },
      { key: 'title', label: 'Title', dataKey: 'title', sortable: true, searchable: true },
      { key: 'date', label: 'Date', dataKey: 'date', sortable: true, type: 'date', width: '120px' },
      { key: 'image', label: 'Image', dataKey: 'imagePath', sortable: false, width: '100px', align: 'center', isAvatar: true, type: 'image' },
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
        dataKey: 'updatedAt',
        type: 'date',
        sortable: true
      },
    ];

    const actions: ITableAction<ISuccessStory>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search success stories...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No success stories found',
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
      const response: ITableList<ISuccessStory> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<ISuccessStory> = await this.apiService.getList({ page: pagination.pageIndex, limit: pagination.pageSize, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<ISuccessStory> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction, search: this.currentSearch?.trim() || undefined });
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

  editItem(item: ISuccessStory): void {
    this.router.navigate(['/success-stories/edit', item.successStoryId]);
  }

  createItem(): void {
    this.router.navigate(['/success-stories/new']);
  }

  viewItem(item: ISuccessStory): void {
    // View success story - implementation depends on requirements
  }

  async toggleStatus(item: ISuccessStory): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.successStoryId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}

