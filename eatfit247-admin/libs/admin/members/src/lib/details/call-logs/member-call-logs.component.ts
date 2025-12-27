import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent, ITableColumn, ITableConfig, EmptyStateComponent, EmptyStateType, LoaderComponent } from '@shared';
import { IMemberCallLog } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-member-call-logs',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, DataTableComponent, EmptyStateComponent, LoaderComponent],
  templateUrl: './member-call-logs.component.html',
  styleUrl: './member-call-logs.component.scss'
})
export class MemberCallLogsComponent implements OnInit, OnDestroy {
  memberId!: number;
  callLogs: IMemberCallLog[] = [];
  loading = false;
  tableConfig!: ITableConfig<IMemberCallLog>;
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
        this.loadCallLogs();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IMemberCallLog>[] = [
      { key: 'date', label: 'Date', dataKey: 'date', sortable: true, width: '120px', formatter: (value) => this.formatDate(value) },
      { key: 'startTime', label: 'Start Time', dataKey: 'startTime', sortable: true, width: '120px', formatter: (value) => this.formatTime(value) },
      { key: 'endTime', label: 'End Time', dataKey: 'endTime', sortable: true, width: '120px', formatter: (value) => this.formatTime(value) },
      { key: 'callType', label: 'Call Type', dataKey: 'callType', sortable: false },
      { key: 'callPurpose', label: 'Call Purpose', dataKey: 'callPurpose', sortable: false },
      { key: 'callLogStatus', label: 'Status', dataKey: 'callLogStatus', sortable: false },
      { key: 'detail', label: 'Detail', dataKey: 'detail', sortable: false },
      { key: 'conversionHistory', label: 'Conversion History', dataKey: 'conversionHistory', sortable: false },
      { key: 'active', label: 'Active', dataKey: 'active', sortable: true, width: '100px', align: 'center', formatter: (value) => value ? 'Yes' : 'No' },
    ];

    this.tableConfig = {
      columns,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: true,
    };
  }

  async loadCallLogs(): Promise<void> {
    this.loading = true;
    try {
      this.callLogs = await this.apiService.getCallLogs(this.memberId);
    } catch (error) {
      console.error('Error loading call logs:', error);
      this.callLogs = [];
    } finally {
      this.loading = false;
    }
  }

  private formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private formatTime(value: any): string {
    if (!value) return '';
    // Handle both string time format (HH:mm:ss) and Date objects
    if (typeof value === 'string') {
      return value.substring(0, 5); // Return HH:mm format
    }
    return value;
  }

  addCallLog(): void {
    // TODO: Open dialog/form to add new call log
    console.log('Add call log for member:', this.memberId);
  }
}
