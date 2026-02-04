import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  createdByUserFormatter,
  DataTableComponent,
  ITableAction,
  ITableColumn,
  ITableConfig,
  updatedByUserFormatter
} from '@shared';
import { IMember, ITableList } from '@eatfit247-shared-lib';
import { MembersApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-members',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, MatTooltipModule, RouterLink],
  templateUrl: './members.html',
  styleUrl: './members.scss',
})
export class Members implements OnInit, AfterViewInit {
  data: IMember[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IMember>;
  private searchSubject = new Subject<string>();

  @ViewChild('emailCell', { static: false })
  emailCellTemplate!: TemplateRef<any>;

  @ViewChild('nameCell', { static: false })
  nameCellTemplate!: TemplateRef<any>;

  constructor(
    private apiService: MembersApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Attach custom cell templates for name and email columns and trigger table re-initialization
    if (this.tableConfig?.columns) {
      let updated = false;

      if (this.nameCellTemplate) {
        const nameColumn = this.tableConfig.columns.find(
          (col) => col.key === 'name'
        );
        if (nameColumn) {
          nameColumn.cellTemplate = this.nameCellTemplate;
          updated = true;
        }
      }

      if (this.emailCellTemplate) {
        const emailColumn = this.tableConfig.columns.find(
          (col) => col.key === 'emailId'
        );
        if (emailColumn) {
          emailColumn.cellTemplate = this.emailCellTemplate;
          updated = true;
        }
      }

      if (updated) {
        // Reassign config reference so data table detects the change
        this.tableConfig = {
          ...this.tableConfig,
          columns: [...this.tableConfig.columns],
        };
      }
    }
  }

  private initializeTable(): void {
    const columns: ITableColumn<IMember>[] = [
      { key: 'memberId', label: 'ID', dataKey: 'memberId', sortable: true, width: '80px' },
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

    const actions: ITableAction<IMember>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search members...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No members found',
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
      const response: ITableList<IMember> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10 });
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
      const response: ITableList<IMember> = await this.apiService.getList({ page: pagination.pageIndex, limit: pagination.pageSize });
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
      const response: ITableList<IMember> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction });
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

  copyEmail(email?: string): void {
    if (!email) return;

    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).catch(() => this.fallbackCopy(email));
    } else {
      this.fallbackCopy(email);
    }
  }

  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  editItem(item: IMember): void {
    this.router.navigate(['/members/edit', item.memberId]);
  }

  createItem(): void {
    this.router.navigate(['/members/new']);
  }

  viewItem(item: IMember): void {
    this.router.navigate(['/members/details', item.memberId, 'dashboard']);
  }
}
