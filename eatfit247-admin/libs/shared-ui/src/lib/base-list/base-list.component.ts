import { Directive, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { ITableList } from '@eatfit247-shared-lib';
import { ITableAction, ITableColumn, ITableConfig, ITablePagination, ITableSort } from '../data-table/data-table.interface';
import { createdByUserFormatter, updatedByUserFormatter } from '../utils/table-formatters';

/** Minimal API surface the base list component needs from its service. */
export interface ListApiService<T> {
  getList(params?: any): Promise<ITableList<T>>;
  updateStatus(id: number, active: boolean): Promise<void>;
}

export interface ListConfig {
  editRoute: string;
  createRoute: string;
  searchPlaceholder: string;
  emptyMessage: string;
  pageSize?: number;
  pageSizeOptions?: number[];
}

/**
 * Abstract base class for standard CRUD list components.
 *
 * Provides search (debounced), pagination, sorting, status toggle,
 * and edit/create navigation. Subclasses declare only entity-specific
 * columns, routes, and any extra actions.
 *
 * Common columns (Status, Created By, Updated By, Created At, Updated At)
 * are auto-appended after entity columns.
 */
@Directive()
export abstract class BaseListComponent<T> implements OnInit {
  protected abstract readonly apiService: ListApiService<T>;
  protected readonly router = inject(Router);

  data: T[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<T>;
  protected searchSubject = new Subject<string>();
  currentSearch = '';

  /** Route and display configuration. */
  protected abstract readonly listConfig: ListConfig;

  /** Entity-specific columns (common columns are auto-appended). */
  protected abstract buildEntityColumns(): ITableColumn<T>[];

  /** Return the primary key value for the given item. */
  protected abstract getItemId(item: T): number;

  /** Return a human-readable name for confirmation dialogs. */
  protected abstract getItemDisplayName(item: T): string;

  constructor() {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  protected initializeTable(): void {
    const columns = [...this.buildEntityColumns(), ...this.buildCommonColumns()];
    const actions = this.buildActions();
    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: this.listConfig.searchPlaceholder,
      showPagination: true,
      pageSize: this.listConfig.pageSize ?? 10,
      pageSizeOptions: this.listConfig.pageSizeOptions ?? [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: this.listConfig.emptyMessage,
    };
  }

  protected buildCommonColumns(): ITableColumn<T>[] {
    return [
      {
        key: 'active', label: 'Status', dataKey: 'active', sortable: true,
        width: '120px', align: 'center',
        formatter: (value: any) => (value ? 'Active' : 'Inactive'),
      },
      { key: 'createdByUser', label: 'Created By', dataKey: 'createdByUser', sortable: false, formatter: createdByUserFormatter() },
      { key: 'updatedByUser', label: 'Updated By', dataKey: 'updatedByUser', sortable: false, formatter: updatedByUserFormatter() },
      { key: 'createdAt', label: 'Created At', dataKey: 'createdAt', type: 'date', sortable: true },
      { key: 'updatedAt', label: 'Updated At', dataKey: 'updatedAt', type: 'date', sortable: true },
    ];
  }

  protected buildActions(): ITableAction<T>[] {
    return [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      ...this.buildExtraActions(),
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => !(row as Record<string, unknown>)['active'], onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => !!(row as Record<string, unknown>)['active'], onClick: (row) => this.toggleStatus(row) },
    ];
  }

  /** Override to insert extra actions between Edit and Active/Inactive. */
  protected buildExtraActions(): ITableAction<T>[] {
    return [];
  }

  /** Override to supply extra query params (e.g. dropdown filters) merged into every list call. */
  protected getExtraParams(): Record<string, any> {
    return {};
  }

  /** Call after changing an extra filter to reload from page 0. */
  protected async reloadWithFilters(): Promise<void> {
    await this.loadData();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((search) => {
        this.loading = true;
        return this.apiService.getList({ ...this.getExtraParams(), search, page: 0, limit: this.tableConfig?.pageSize ?? 10 });
      }),
    ).subscribe({
      next: (response) => {
        this.data = response.tableData;
        this.totalCount = response.count;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<T> = await this.apiService.getList({
        ...this.getExtraParams(),
        page: 0,
        limit: this.tableConfig.pageSize ?? 10,
        search: this.currentSearch?.trim() || undefined,
      });
      this.data = response.tableData;
      this.totalCount = response.count;
    } finally {
      this.loading = false;
    }
  }

  async onPageChange(pagination: ITablePagination): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<T> = await this.apiService.getList({
        ...this.getExtraParams(),
        page: pagination.pageIndex,
        limit: pagination.pageSize,
        search: this.currentSearch?.trim() || undefined,
      });
      this.data = response.tableData;
      this.totalCount = response.count;
    } finally {
      this.loading = false;
    }
  }

  async onSortChange(sort: ITableSort): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<T> = await this.apiService.getList({
        ...this.getExtraParams(),
        page: 0,
        limit: this.tableConfig.pageSize ?? 10,
        sortBy: sort.active,
        sortOrder: sort.direction,
        search: this.currentSearch?.trim() || undefined,
      });
      this.data = response.tableData;
      this.totalCount = response.count;
    } finally {
      this.loading = false;
    }
  }

  onSearchChange(search: string): void {
    this.currentSearch = search;
    this.searchSubject.next(search);
  }

  editItem(item: T): void {
    this.router.navigate([this.listConfig.editRoute, this.getItemId(item)]);
  }

  createItem(): void {
    this.router.navigate([this.listConfig.createRoute]);
  }

  async toggleStatus(item: T): Promise<void> {
    const active = (item as Record<string, unknown>)['active'];
    const action = active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${this.getItemDisplayName(item)}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(this.getItemId(item), !active);
        await this.loadData();
      } finally {
        this.loading = false;
      }
    }
  }
}
