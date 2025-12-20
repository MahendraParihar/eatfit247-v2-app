import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  DataTableComponent,
  ITableColumn,
  ITableConfig,
  ITableAction,
  createdByUserFormatter,
  updatedByUserFormatter
} from '@shared';
import { ITableList, IEatingHabit } from '@eatfit247-shared-lib';
import { LovMasterApiService } from '../api.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'lib-eating-habit',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './eating-habit.html',
  styleUrl: './eating-habit.scss',
})
export class EatingHabit implements OnInit {
  data: IEatingHabit[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IEatingHabit>;
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
    const columns: ITableColumn<IEatingHabit>[] = [
      { key: 'eatingHabitId', label: 'ID', dataKey: 'eatingHabitId', sortable: true, width: '80px' },
      {
        key: 'image',
        label: 'Image',
        dataKey: 'imagePath',
        type: 'image',
        isAvatar: true,
        imageAlt: 'Eating Habit Image',
        sortable: false,
        width: '80px',
        align: 'center'
      },
      { key: 'eatingHabit', label: 'Eating Habit', dataKey: 'eatingHabit', sortable: true, searchable: true },
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

    const actions: ITableAction<IEatingHabit>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search eating habit...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No eating habit records found',
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getEatingHabitList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => { this.data = response.tableData; this.totalCount = response.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IEatingHabit> = await this.apiService.getEatingHabitList({ page: 0, limit: this.tableConfig.pageSize || 10 });
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
      const response: ITableList<IEatingHabit> = await this.apiService.getEatingHabitList({ page: pagination.pageIndex, limit: pagination.pageSize });
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
      const response: ITableList<IEatingHabit> = await this.apiService.getEatingHabitList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction });
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

  editItem(item: IEatingHabit): void {
    this.router.navigate(['/lov-master/eating-habit/edit', item.eatingHabitId]);
  }

  createItem(): void {
    this.router.navigate(['/lov-master/eating-habit/new']);
  }

  async toggleStatus(item: IEatingHabit): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.eatingHabit}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateEatingHabitStatus(item.eatingHabitId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}

