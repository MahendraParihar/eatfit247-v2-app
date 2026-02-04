import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createdByUserFormatter,
  DataTableComponent,
  ITableAction,
  ITableColumn,
  ITableConfig,
  updatedByUserFormatter
} from '@shared';
import { IPressMedia, ITableList } from '@eatfit247-shared-lib';
import { PressMediaApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-media-press',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './media-press.html',
  styleUrl: './media-press.scss',
})
export class MediaPress implements OnInit {
  data: IPressMedia[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IPressMedia>;
  private searchSubject = new Subject<string>();

  constructor(
    private apiService: PressMediaApiService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IPressMedia>[] = [
      { key: 'pressMediaId', label: 'ID', dataKey: 'pressMediaId', sortable: true, width: '80px' },
      { key: 'title', label: 'Title', dataKey: 'title', sortable: true, searchable: true },
      { key: 'type', label: 'Type', dataKey: 'type', sortable: true, width: '100px', align: 'center', formatter: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '-' },
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

    const actions: ITableAction<IPressMedia>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search media & press...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No media & press records found',
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
      const response: ITableList<IPressMedia> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10 });
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
      const response: ITableList<IPressMedia> = await this.apiService.getList({ page: pagination.pageIndex, limit: pagination.pageSize });
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
      const response: ITableList<IPressMedia> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction });
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

  editItem(item: IPressMedia): void {
    this.router.navigate(['/media-press/edit', item.pressMediaId]);
  }

  createItem(): void {
    this.router.navigate(['/media-press/new']);
  }

  viewItem(item: IPressMedia): void {
    // View functionality can be implemented here if needed
  }

  async toggleStatus(item: IPressMedia): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.title}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.pressMediaId, !item.active);
        this.snackBar.open(
          `Media & press ${item.active ? 'deactivated' : 'activated'} successfully`,
          'Close',
          { duration: 3000 }
        );
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
