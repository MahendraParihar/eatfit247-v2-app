import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  DataTableComponent,
  EmptyStateComponent,
  EmptyStateType,
  ITableActionButton,
  ITableColumn,
  ITableConfig,
  LoaderComponent
} from '@shared';
import { IMemberCallLog } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { Subject, takeUntil } from 'rxjs';
import { ManageMemberCallLogComponent } from './manage-member-call-log/manage-member-call-log.component';
import { ViewCallLogDetailsComponent } from './view-call-log-details/view-call-log-details.component';
import { CancelCallLogDialogComponent } from './cancel-call-log-dialog/cancel-call-log-dialog.component';
import { CompleteCallLogDialogComponent } from './complete-call-log-dialog/complete-call-log-dialog.component';

@Component({
  selector: 'lib-member-call-logs',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, DataTableComponent, EmptyStateComponent, LoaderComponent],
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
    private apiService: MembersApiService,
    private dialog: MatDialog
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
      {
        key: 'startTime',
        type: 'date',
        label: 'Start Time',
        dataKey: 'startTime',
        sortable: true,
      },
      {
        key: 'endTime',
        type: 'date',
        label: 'End Time',
        dataKey: 'endTime',
        sortable: true,
      },
      {
        key: 'callType',
        label: 'Call Type',
        dataKey: 'callType',
        sortable: false,
      },
      {
        key: 'callPurpose',
        label: 'Call Purpose',
        dataKey: 'callPurpose',
        sortable: false,
      },
      {
        key: 'callLogStatus',
        label: 'Status',
        dataKey: 'callLogStatus',
        sortable: false,
      },
      {
        key: 'active',
        label: 'Active',
        dataKey: 'active',
        sortable: true,
        width: '100px',
        align: 'center',
        formatter: (value) => (value ? 'Yes' : 'No'),
      },
    ];

    const actions: ITableActionButton<IMemberCallLog>[] = [
      {
        label: 'View Details',
        icon: 'visibility',
        onClick: (row) => this.viewCallLogDetails(row),
      },
      {
        label: 'Edit',
        icon: 'edit',
        onClick: (row) => this.editCallLog(row),
        visible: (row) => row.active !== false && row.callLogStatus !== 'Cancelled' && row.callLogStatus !== 'Completed',
      },
      {
        label: 'Mark as Completed',
        icon: 'check_circle',
        color: 'primary',
        onClick: (row) => this.completeCallLog(row),
        visible: (row) => row.active !== false && row.callLogStatus !== 'Cancelled' && row.callLogStatus !== 'Completed',
      },
      {
        label: 'Cancel',
        icon: 'cancel',
        color: 'warn',
        onClick: (row) => this.cancelCallLog(row),
        visible: (row) => row.active !== false && row.callLogStatus !== 'Cancelled' && row.callLogStatus !== 'Completed',
      },
    ];

    this.tableConfig = {
      columns,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: true,
      actionsConfig: {
        buttons: actions,
        column: {
          asMenu: true,
          menuTriggerIcon: 'more_vert',
          headerLabel: 'Actions',
          width: '80px',
          align: 'center',
        },
      },
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
    if (!this.memberId) {
      return;
    }
    const dialogRef = this.dialog.open(ManageMemberCallLogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: this.memberId
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCallLogs();
      }
    });
  }

  viewCallLogDetails(callLog: IMemberCallLog): void {
    this.dialog.open(ViewCallLogDetailsComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: callLog,
    });
  }

  editCallLog(callLog: IMemberCallLog): void {
    if (!this.memberId) {
      return;
    }
    // TODO: Update ManageMemberCallLogComponent to support edit mode with call log data
    // Currently using memberId, but should pass callLog data for edit mode
    const dialogRef = this.dialog.open(ManageMemberCallLogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: this.memberId
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCallLogs();
      }
    });
  }

  async cancelCallLog(callLog: IMemberCallLog): Promise<void> {
    const dialogRef = this.dialog.open(CancelCallLogDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
    });

    dialogRef.afterClosed().subscribe(async (reason: string | null) => {
      if (reason && this.memberId) {
        try {
          await this.apiService.cancelCallLog(
            this.memberId,
            callLog.memberCallLogId,
            reason
          );
          this.loadCallLogs();
        } catch (error) {
          console.error('Error cancelling call log:', error);
        }
      }
    });
  }

  async completeCallLog(callLog: IMemberCallLog): Promise<void> {
    const dialogRef = this.dialog.open(CompleteCallLogDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
    });

    dialogRef.afterClosed().subscribe(async (reason: string | null) => {
      if (reason && this.memberId) {
        try {
          await this.apiService.completeCallLog(
            this.memberId,
            callLog.memberCallLogId,
            reason
          );
          this.loadCallLogs();
        } catch (error) {
          console.error('Error completing call log:', error);
        }
      }
    });
  }
}
