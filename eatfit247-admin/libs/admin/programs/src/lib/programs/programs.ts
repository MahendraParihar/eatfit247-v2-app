import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn, TableConfig, TableAction, createdByUserFormatter, updatedByUserFormatter } from '@shared';
import { ITableList, IProgram } from '@eatfit247-shared-lib';
import { ProgramsApiService } from '../api.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'lib-programs',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './programs.html',
  styleUrl: './programs.scss',
})
export class Programs implements OnInit {
  data: IProgram[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: TableConfig<IProgram>;
  private searchSubject = new Subject<string>();

  constructor(private apiService: ProgramsApiService) {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: TableColumn<IProgram>[] = [
      { key: 'programId', label: 'ID', dataKey: 'programId', sortable: true, width: '80px' },
      { key: 'program', label: 'Program', dataKey: 'program', sortable: true, searchable: true },
      { key: 'programCategory', label: 'Category', dataKey: 'programCategory', sortable: false, formatter: (value) => value?.programCategory || '-' },
      { key: 'isSpecialProgram', label: 'Special', dataKey: 'isSpecialProgram', sortable: true, width: '100px', align: 'center', formatter: (value) => (value ? 'Yes' : 'No') },
      { key: 'active', label: 'Status', dataKey: 'active', sortable: true, width: '120px', align: 'center', formatter: (value) => (value ? 'Active' : 'Inactive') },
      { key: 'createdByUser', label: 'Created By', dataKey: 'createdByUser', sortable: false, formatter: createdByUserFormatter() },
      { key: 'updatedByUser', label: 'Updated By', dataKey: 'updatedByUser', sortable: false, formatter: updatedByUserFormatter() },
      { key: 'createdAt', label: 'Created At', dataKey: 'createdAt', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleString() : '') },
      { key: 'updatedAt', label: 'Updated At', dataKey: 'updatedAt', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleString() : '') },
    ];

    const actions: TableAction<IProgram>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search programs...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No programs found',
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => { this.data = response.data; this.totalCount = response.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IProgram> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10 });
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
      const response: ITableList<IProgram> = await this.apiService.getList({ page: pagination.pageIndex, limit: pagination.pageSize });
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
      const response: ITableList<IProgram> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction });
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

  editItem(item: IProgram): void {
    console.log('Edit program:', item);
  }

  viewItem(item: IProgram): void {
    console.log('View program:', item);
  }

  async toggleStatus(item: IProgram): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.program}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.programId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
