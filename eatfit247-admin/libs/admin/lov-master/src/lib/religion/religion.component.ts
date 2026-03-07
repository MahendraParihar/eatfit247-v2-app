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
import { IReligion, ITableList } from '@eatfit247-shared-lib';
import { LovMasterApiService } from '../api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-religion',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './religion.html',
  styleUrl: './religion.scss',
})
export class Religion implements OnInit {
  data: IReligion[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IReligion>;
  private searchSubject = new Subject<string>();
  currentSearch = '';

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
    const columns: ITableColumn<IReligion>[] = [
      { key: 'religionId', label: 'ID', dataKey: 'religionId', sortable: true, width: '80px' },
      {
        key: 'image',
        label: 'Image',
        dataKey: 'imagePath',
        type: 'image',
        isAvatar: true,
        imageAlt: 'Religion Image',
        sortable: false,
        width: '80px',
        align: 'center'
      },
      { key: 'religion', label: 'Religion', dataKey: 'religion', sortable: true, searchable: true },
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

    const actions: ITableAction<IReligion>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search religion...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No religion records found',
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getReligionList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => { this.data = response.tableData; this.totalCount = response.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IReligion> = await this.apiService.getReligionList({ page: 0, limit: this.tableConfig.pageSize || 10, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<IReligion> = await this.apiService.getReligionList({ page: pagination.pageIndex, limit: pagination.pageSize, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<IReligion> = await this.apiService.getReligionList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction, search: this.currentSearch?.trim() || undefined });
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

  editItem(item: IReligion): void {
    this.router.navigate(['/lov-master/religion/edit', item.religionId]);
  }

  createItem(): void {
    this.router.navigate(['/lov-master/religion/new']);
  }

  async toggleStatus(item: IReligion): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.religion}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateReligionStatus(item.religionId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}

