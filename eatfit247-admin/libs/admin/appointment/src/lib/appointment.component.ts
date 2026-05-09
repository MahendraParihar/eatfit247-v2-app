import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import {
  DataTableComponent,
  ITableAction,
  ITableColumn,
  ITableConfig,
  createdByUserFormatter,
  updatedByUserFormatter,
} from '@shared';
import { ITableList } from '@eatfit247-shared-lib';
import { AppointmentApiService, IAppointment } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

const STATUS_LABELS: Record<number, string> = {
  1: 'Scheduled',
  2: 'Confirmed',
  3: 'Completed',
  4: 'Cancelled',
  5: 'No Show',
};

@Component({
  selector: 'lib-appointment-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './appointment.html',
  styleUrl: './appointment.scss',
})
export class AppointmentList implements OnInit {
  private apiService = inject(AppointmentApiService);
  private router = inject(Router);

  data: IAppointment[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IAppointment>;
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
    const columns: ITableColumn<IAppointment>[] = [
      {
        key: 'appointmentId',
        label: 'ID',
        dataKey: 'appointmentId',
        sortable: true,
        width: '80px',
      },
      {
        key: 'appointmentDate',
        label: 'Date',
        dataKey: 'appointmentDate',
        sortable: true,
        width: '120px',
        formatter: (value) => this.formatDate(value),
      },
      {
        key: 'startTime',
        label: 'Time',
        dataKey: 'startTime',
        sortable: true,
        width: '140px',
        formatter: (_value, row) => `${this.formatTime(row?.startTime)} - ${this.formatTime(row?.endTime)}`,
      },
      {
        key: 'assignedAdmin',
        label: 'Nutritionist',
        dataKey: 'assignedAdmin',
        sortable: false,
        formatter: (value) => value ? `${value.firstName} ${value.lastName}` : '-',
      },
      {
        key: 'guestName',
        label: 'Guest / Member',
        dataKey: 'guestName',
        sortable: false,
        searchable: true,
        formatter: (_value, row) => row?.guestName || (row?.memberId ? `Member #${row.memberId}` : '-'),
      },
      {
        key: 'appointmentTypeRef',
        label: 'Type',
        dataKey: 'appointmentTypeRef',
        sortable: false,
        formatter: (value) => value?.appointmentType || '-',
      },
      {
        key: 'status',
        label: 'Status',
        dataKey: 'status',
        sortable: true,
        width: '120px',
        formatter: (value) => STATUS_LABELS[value] || 'Unknown',
      },
      {
        key: 'franchise',
        label: 'Franchise',
        dataKey: 'franchise',
        sortable: false,
        formatter: (value) => value?.franchise || '-',
      },
      {
        key: 'createdBy',
        label: 'Created By',
        dataKey: 'createdBy',
        sortable: false,
        formatter: createdByUserFormatter(),
      },
      {
        key: 'updatedBy',
        label: 'Updated By',
        dataKey: 'updatedBy',
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
    ];

    const actions: ITableAction<IAppointment>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        onClick: (row) => this.deleteItem(row),
        visible: (row) => row.status !== 4,
      },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search appointments...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No appointments found',
    };
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private formatTime(value: string | null | undefined): string {
    if (!value) return '';
    if (typeof value === 'string') {
      return value.substring(0, 5);
    }
    return value;
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
      const response: ITableList<IAppointment> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10,
        search: this.currentSearch?.trim() || undefined,
      });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  async onPageChange(pagination: { pageIndex: number; pageSize: number }): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IAppointment> = await this.apiService.getList({
        page: pagination.pageIndex,
        limit: pagination.pageSize,
        search: this.currentSearch?.trim() || undefined,
      });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  async onSortChange(sort: { active: string; direction: string }): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IAppointment> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10,
        sortBy: sort.active,
        sortOrder: sort.direction,
        search: this.currentSearch?.trim() || undefined,
      });
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

  editItem(item: IAppointment): void {
    this.router.navigate(['/appointments/edit', item.appointmentId]);
  }

  createItem(): void {
    this.router.navigate(['/appointments/new']);
  }

  async deleteItem(item: IAppointment): Promise<void> {
    if (confirm('Are you sure you want to delete this appointment?')) {
      try {
        await this.apiService.delete(item.appointmentId);
        await this.loadData();
      } catch {
        // Error handled by interceptor
      }
    }
  }
}
