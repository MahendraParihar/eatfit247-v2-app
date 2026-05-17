import { Component, inject, OnInit } from '@angular/core';
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
  ITablePagination,
  ITableSort,
  updatedByUserFormatter
} from '@shared';
import { IProgramPlan, ITableList } from '@eatfit247-shared-lib';
import { ProgramPlanApiService } from '../program-plan-api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-program-plans',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './program-plans.html',
  styleUrl: './program-plans.scss'
})
export class ProgramPlans implements OnInit {
  data: IProgramPlan[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IProgramPlan>;
  private searchSubject = new Subject<string>();

  private apiService = inject(ProgramPlanApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.setupSearch();
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IProgramPlan>[] = [
      {
        key: 'programPlanId',
        label: 'ID',
        dataKey: 'programPlanId',
        sortable: true,
        width: '80px'
      },
      {
        key: 'plan',
        label: 'Plan',
        dataKey: 'plan',
        sortable: true,
        searchable: true
      },
      {
        key: 'inrAmount',
        label: 'Amount (INR)',
        dataKey: 'inrAmount',
        sortable: true,
        width: '120px'
      },
      {
        key: 'sequenceNumber',
        label: 'Sequence',
        dataKey: 'sequenceNumber',
        sortable: true,
        width: '100px'
      },
      {
        key: 'noOfCycle',
        label: 'Cycles',
        dataKey: 'noOfCycle',
        sortable: true,
        width: '100px'
      },
      {
        key: 'noOfDaysInCycle',
        label: 'Days/Cycle',
        dataKey: 'noOfDaysInCycle',
        sortable: true,
        width: '120px'
      },
      {
        key: 'isOnline',
        label: 'Online',
        dataKey: 'isOnline',
        sortable: true,
        width: '100px',
        formatter: (value: boolean) => (value ? 'Yes' : 'No')
      },
      {
        key: 'isVisibleOnWeb',
        label: 'Visible',
        dataKey: 'isVisibleOnWeb',
        sortable: true,
        width: '100px',
        formatter: (value: boolean) => (value ? 'Yes' : 'No')
      },
      {
        key: 'active',
        label: 'Status',
        dataKey: 'active',
        sortable: true,
        width: '100px',
        formatter: (value: boolean) => (value ? 'Active' : 'Inactive')
      },
      {
        key: 'createdAt',
        label: 'Created At',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true,
        width: '180px'
      },
      {
        key: 'createdByUser',
        label: 'Created By',
        dataKey: 'createdByUser',
        formatter: createdByUserFormatter(),
        sortable: false,
        width: '150px'
      },
      {
        key: 'updatedByUser',
        label: 'Updated By',
        dataKey: 'updatedByUser',
        formatter: updatedByUserFormatter(),
        sortable: false,
        width: '150px'
      }
    ];
    const actions: ITableAction<IProgramPlan>[] = [
      {
        label: 'Edit',
        icon: 'edit',
        color: 'primary',
        onClick: (row) => this.editItem(row)
      },
      {
        label: 'Active',
        icon: 'check_circle',
        color: 'primary',
        visible: (row) => row.active,
        onClick: (row) => this.toggleStatus(row)
      },
      {
        label: 'Inactive',
        icon: 'cancel',
        color: 'warn',
        visible: (row) => !row.active,
        onClick: (row) => this.toggleStatus(row)
      }
    ];
    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search program plans...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No program plan found'
    };
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          this.loading = true;
          const params: any = {
            page: 0,
            limit: this.tableConfig.pageSize
          };
          if (searchTerm) {
            params.search = searchTerm;
          }
          return this.apiService.getList(params);
        })
      )
      .subscribe({
        next: (response: ITableList<IProgramPlan>) => {
          this.data = response.tableData;
          this.totalCount = response.count;
          this.loading = false;
        },
        error: () => {
          // Error toast is handled by HttpErrorInterceptor
          this.loading = false;
        }
      });
  }

  async loadData(searchTerm: string = ''): Promise<void> {
    this.loading = true;
    const params: any = {
      page: 0,
      limit: this.tableConfig.pageSize
    };
    if (searchTerm) {
      params.search = searchTerm;
    }
    // Check if programId is in route params
    const programId = this.route.snapshot.queryParamMap.get('programId');
    if (programId) {
      params.programId = programId;
    }
    this.loading = true;
    const res = await this.apiService.getList(params);
    this.data = res.tableData;
    this.totalCount = res.count;
    this.loading = false;
  }

  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  async onPageChange(page: ITablePagination): Promise<void> {
    const params: any = {
      page: page.pageIndex,
      limit: page.pageSize
    };
    const searchTerm =
      (document.querySelector('input[type="search"]') as HTMLInputElement)
        ?.value || '';
    if (searchTerm) {
      params.search = searchTerm;
    }
    const programId = this.route.snapshot.queryParamMap.get('programId');
    if (programId) {
      params.programId = programId;
    }
    this.loading = true;
    const res = await this.apiService.getList(params);
    this.data = res.tableData;
    this.totalCount = res.count;
    this.loading = false;
  }

  async onSortChange(sort: ITableSort): Promise<void> {
    const params: any = {
      page: 0,
      limit: this.tableConfig.pageSize,
      sortField: sort.active,
      sortDirection: sort.direction
    };
    const searchTerm =
      (document.querySelector('input[type="search"]') as HTMLInputElement)
        ?.value || '';
    if (searchTerm) {
      params.search = searchTerm;
    }
    const programId = this.route.snapshot.queryParamMap.get('programId');
    if (programId) {
      params.programId = programId;
    }
    this.loading = true;
    this.loading = true;
    const res = await this.apiService.getList(params);
    this.data = res.tableData;
    this.totalCount = res.count;
    this.loading = false;
  }

  createItem(): void {
    const programId = this.route.snapshot.queryParamMap.get('programId');
    if (programId) {
      this.router.navigate(['/program-plans/new'], {
        queryParams: { programId }
      });
    } else {
      this.router.navigate(['/program-plans/new']);
    }
  }

  editItem(row: IProgramPlan): void {
    this.router.navigate(['/program-plans/edit', row.programPlanId]);
  }

  async toggleStatus(row: IProgramPlan): Promise<void> {
    await this.apiService.updateStatus(row.programPlanId, !row.active);
    await this.loadData();
  }
}
