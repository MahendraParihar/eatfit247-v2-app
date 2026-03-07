import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { IFranchise, ITableList } from '@eatfit247-shared-lib';
import { FranchiseApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-franchise',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './franchise.html',
  styleUrl: './franchise.scss',
})
export class Franchise implements OnInit, AfterViewInit {
  private apiService = inject(FranchiseApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  data: IFranchise[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IFranchise>;
  private searchSubject = new Subject<string>();
  currentSearch = '';

  @ViewChild('companyNameCell', { static: false })
  companyNameCellTemplate!: TemplateRef<any>;

  constructor() {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Attach custom cell template for company name column and trigger table re-initialization
    if (this.tableConfig?.columns) {
      if (this.companyNameCellTemplate) {
        const companyNameColumn = this.tableConfig.columns.find(
          (col) => col.key === 'companyName'
        );
        if (companyNameColumn) {
          companyNameColumn.cellTemplate = this.companyNameCellTemplate;
          // Reassign config reference so data table detects the change
          this.tableConfig = {
            ...this.tableConfig,
            columns: [...this.tableConfig.columns],
          };
        }
      }
    }
  }

  private initializeTable(): void {
    const columns: ITableColumn<IFranchise>[] = [
      { key: 'franchiseId', label: 'ID', dataKey: 'franchiseId', sortable: true, width: '80px' },
      {
        key: 'logo',
        label: 'Logo',
        dataKey: 'logo',
        type: 'image',
        isAvatar: true,
        imageAlt: 'Franchise Logo',
        sortable: false,
        width: '80px',
        align: 'center'
      },
      { key: 'companyName', label: 'Company Name', dataKey: 'companyName', sortable: true, searchable: true },
      { key: 'franchiseCode', label: 'Code', dataKey: 'franchiseCode', sortable: true },
      { 
        key: 'name', 
        label: 'Name', 
        dataKey: 'firstName', 
        sortable: true, 
        searchable: true,
        formatter: (value, row) => {
          const firstName = row?.firstName || '';
          const lastName = row?.lastName || '';
          return `${firstName} ${lastName}`.trim() || '-';
        }
      },
      { key: 'emailId', label: 'Email', dataKey: 'emailId', sortable: true, searchable: true },
      { key: 'contactNumber', label: 'Contact', dataKey: 'contactNumber', sortable: true },
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

    const actions: ITableAction<IFranchise>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search franchise...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No franchise records found',
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
      const response: ITableList<IFranchise> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<IFranchise> = await this.apiService.getList({ page: pagination.pageIndex, limit: pagination.pageSize, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<IFranchise> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction, search: this.currentSearch?.trim() || undefined });
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

  editItem(item: IFranchise): void {
    this.router.navigate(['/franchise/edit', item.franchiseId]);
  }

  createItem(): void {
    this.router.navigate(['/franchise/new']);
  }

  viewItem(item: IFranchise): void {
    this.router.navigate(['/franchise/details', item.franchiseId, 'dashboard']);
  }

  async toggleStatus(item: IFranchise): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.companyName}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.franchiseId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
