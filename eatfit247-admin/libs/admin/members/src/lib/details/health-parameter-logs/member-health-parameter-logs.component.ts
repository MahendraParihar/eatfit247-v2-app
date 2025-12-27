import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent, ITableColumn, ITableConfig, EmptyStateComponent, EmptyStateType, LoaderComponent, createdByUserFormatter, updatedByUserFormatter } from '@shared';
import { IMemberHealthParameterLog } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-member-health-parameter-logs',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, DataTableComponent, EmptyStateComponent, LoaderComponent],
  templateUrl: './member-health-parameter-logs.component.html',
  styleUrl: './member-health-parameter-logs.component.scss'
})
export class MemberHealthParameterLogsComponent implements OnInit, OnDestroy {
  memberId!: number;
  healthParameterLogs: IMemberHealthParameterLog[] = [];
  loading = false;
  tableConfig!: ITableConfig<IMemberHealthParameterLog>;
  EmptyStateType = EmptyStateType;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private apiService: MembersApiService
  ) {
    this.initializeTable();
  }

  ngOnInit(): void {
    this.route.parent?.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.memberId = +params['id'];
      if (this.memberId) {
        this.loadHealthParameterLogs();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IMemberHealthParameterLog>[] = [
      { 
        key: 'logDate', 
        label: 'Log Date', 
        dataKey: 'logDate', 
        sortable: true,
        formatter: (value) => this.formatDate(value)
      },
      { 
        key: 'healthParameters', 
        label: 'Health Parameters', 
        dataKey: 'healthParameters', 
        sortable: false,
        formatter: (value) => this.formatHealthParameters(value)
      },
      { key: 'active', label: 'Active', dataKey: 'active', sortable: true, width: '100px', align: 'center', formatter: (value) => value ? 'Yes' : 'No' },
      { key: 'createdBy', label: 'Created By', dataKey: 'createdBy', sortable: false, formatter: createdByUserFormatter() },
      { key: 'updatedBy', label: 'Updated By', dataKey: 'updatedBy', sortable: false, formatter: updatedByUserFormatter() },
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

    this.tableConfig = {
      columns,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: true,
    };
  }

  async loadHealthParameterLogs(): Promise<void> {
    this.loading = true;
    try {
      this.healthParameterLogs = await this.apiService.getHealthParameterLogs(this.memberId);
    } catch (error) {
      console.error('Error loading health parameter logs:', error);
      this.healthParameterLogs = [];
    } finally {
      this.loading = false;
    }
  }

  formatDate(value: any): string {
    if (!value) return '';
    // Convert timestamp (number) to Date
    const date = typeof value === 'number' ? new Date(value) : new Date(value);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatHealthParameters(value: any[]): string {
    if (!value || !Array.isArray(value) || value.length === 0) return '-';
    return value.map((param: any) => `${param.healthParameter || 'N/A'}: ${param.value || 'N/A'} ${param.healthParameterUnit || ''}`).join(', ');
  }

  addBodyStatsLog(): void {
    // TODO: Open dialog/form to add new body stats log
    console.log('Add body stats log for member:', this.memberId);
  }
}
