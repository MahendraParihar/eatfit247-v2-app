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
import { IBasicSearch, ITableList, ITaxMaster } from '@eatfit247-shared-lib';
import { TaxMasterApiService } from './api.service';

@Component({
  selector: 'lib-tax-master',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './tax-master.html',
  styleUrl: './tax-master.scss',
})
export class TaxMasterComponent implements OnInit {
  data: ITaxMaster[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<ITaxMaster>;

  constructor(
    private apiService: TaxMasterApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.initializeTable();
    void this.loadData({ page: 0, limit: 10 });
  }

  private initializeTable(): void {
    const columns: ITableColumn<ITaxMaster>[] = [
      { key: 'id', label: 'ID', dataKey: 'id', sortable: true, width: '80px' },
      { key: 'countryCode', label: 'Country', dataKey: 'countryCode', sortable: true },
      {
        key: 'transactionType',
        label: 'Transaction Type',
        dataKey: 'transactionType',
        sortable: true,
      },
      {
        key: 'taxSystem',
        label: 'Tax System',
        dataKey: 'taxSystem',
        sortable: true,
      },
      { key: 'taxCode', label: 'Tax Code', dataKey: 'taxCode', sortable: true },
      { key: 'taxName', label: 'Tax Name', dataKey: 'taxName', sortable: true, searchable: true },
      {
        key: 'taxPercent',
        label: 'Tax %',
        dataKey: 'taxPercent',
        sortable: true,
        formatter: (value) => `${value ?? 0}%`,
        align: 'right',
        width: '120px',
      },
      {
        key: 'applyOn',
        label: 'Apply On',
        dataKey: 'applyOn',
        sortable: true,
      },
      {
        key: 'effectiveFrom',
        label: 'Effective From',
        dataKey: 'effectiveFrom',
        type: 'date',
        sortable: true,
      },
      {
        key: 'effectiveTo',
        label: 'Effective To',
        dataKey: 'effectiveTo',
        type: 'date',
        sortable: true,
      },
      {
        key: 'isTaxInclusive',
        label: 'Inclusive',
        dataKey: 'isTaxInclusive',
        sortable: true,
        formatter: (value) => (value ? 'Yes' : 'No'),
        width: '120px',
        align: 'center',
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

    const actions: ITableAction<ITaxMaster>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      {
        label: 'Active',
        icon: 'check_circle',
        color: 'primary',
        visible: (row) => !row.active,
        onClick: (row) => this.toggleStatus(row),
      },
      {
        label: 'Inactive',
        icon: 'cancel',
        color: 'warn',
        visible: (row) => row.active,
        onClick: (row) => this.toggleStatus(row),
      },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search tax rules...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No tax rules found',
    };
  }

  async loadData(pagination: IBasicSearch): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<ITaxMaster> = await this.apiService.getList(pagination);
      this.data = response.tableData;
      this.totalCount = response.count;
    } finally {
      this.loading = false;
    }
  }

  async onPageChange(pagination: { pageIndex: number; pageSize: number }): Promise<void> {
    await this.loadData({ page: pagination.pageIndex, limit: pagination.pageSize });
  }

  async onSortChange(event: any): Promise<void> {
    const sort = event as { active: string; direction: 'asc' | 'desc' | '' };
    await this.loadData({
      page: 0,
      limit: this.tableConfig.pageSize || 10,
      sortBy: sort.active,
      sortOrder: sort.direction,
    } as IBasicSearch);
  }

  onSearchChange(search: string): void {
    void this.loadData({
      page: 0,
      limit: this.tableConfig.pageSize || 10,
      name: search || undefined,
    } as IBasicSearch);
  }

  editItem(item: ITaxMaster): void {
    this.router.navigate(['/tax-master/edit', item.id], { relativeTo: this.route.root });
  }

  createItem(): void {
    this.router.navigate(['/tax-master/new'], { relativeTo: this.route.root });
  }

  async toggleStatus(item: ITaxMaster): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.taxName}"?`);
    if (!confirmed) {
      return;
    }
    this.loading = true;
    try {
      await this.apiService.updateStatus(item.id, !item.active);
      await this.loadData({ page: 0, limit: this.tableConfig.pageSize || 10 });
    } finally {
      this.loading = false;
    }
  }
}


