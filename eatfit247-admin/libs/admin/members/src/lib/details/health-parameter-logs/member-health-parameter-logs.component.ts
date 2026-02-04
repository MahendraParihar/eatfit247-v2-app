import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createdByUserFormatter,
  DataTableComponent,
  EmptyStateComponent,
  EmptyStateType,
  ITableActionButton,
  ITableColumn,
  ITableConfig,
  LoaderComponent,
  updatedByUserFormatter,
  WarningDialogComponent,
  WarningDialogData
} from '@shared';
import { IMemberHealthParameterLog } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import {
  ManageMemberBodyStatsComponent,
  ManageMemberBodyStatsData
} from './manage-member-body-stats/manage-member-body-stats.component';
import {
  ViewHealthParameterLogDetailsComponent
} from './view-health-parameter-log-details/view-health-parameter-log-details.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-member-health-parameter-logs',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, DataTableComponent, EmptyStateComponent, LoaderComponent],
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
    private apiService: MembersApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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
        type: 'date',
        label: 'Log Date',
        dataKey: 'logDate',
        sortable: true
      },
      {
        key: 'active',
        label: 'Active',
        dataKey: 'active',
        sortable: true,
        width: '100px',
        align: 'center',
        formatter: (value) => value ? 'Yes' : 'No'
      },
      {
        key: 'createdBy',
        label: 'Created By',
        dataKey: 'createdBy',
        sortable: false,
        formatter: createdByUserFormatter()
      },
      {
        key: 'updatedBy',
        label: 'Updated By',
        dataKey: 'updatedBy',
        sortable: false,
        formatter: updatedByUserFormatter()
      },
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
      }
    ];

    const actions: ITableActionButton<IMemberHealthParameterLog>[] = [
      {
        label: 'View Details',
        icon: 'visibility',
        onClick: (row) => this.viewHealthParameterLogDetails(row),
      },
      {
        label: 'Edit',
        icon: 'edit',
        onClick: (row) => this.editHealthParameterLog(row),
        visible: (row) => row.active !== false,
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        onClick: (row) => this.deleteHealthParameterLog(row),
        visible: (row) => row.active !== false,
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

  async loadHealthParameterLogs(): Promise<void> {
    this.loading = true;
    try {
      this.healthParameterLogs = await this.apiService.getHealthParameterLogs(this.memberId);
    } catch (error) {
      this.snackBar.open('Failed to load health parameter logs. Please try again.', 'Close', {
        duration: 5000,
      });
      this.healthParameterLogs = [];
    } finally {
      this.loading = false;
    }
  }

  formatDate(value: any): string {
    if (!value) return '';
    // logDate is now a Date object
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatHealthParameters(value: any[]): string {
    if (!value || !Array.isArray(value) || value.length === 0) return '-';
    return value.map((param: any) => `${param.healthParameter || 'N/A'}: ${param.value || 'N/A'} ${param.healthParameterUnit || ''}`).join(', ');
  }

  addBodyStatsLog(): void {
    if (!this.memberId) {
      this.snackBar.open('Member ID is not available', 'Close', {
        duration: 3000,
      });
      return;
    }
    const dialogData: ManageMemberBodyStatsData = {
      memberId: this.memberId
    };
    try {
      const dialogRef = this.dialog.open(ManageMemberBodyStatsComponent, {
        width: '800px',
        maxWidth: '80vw',
        data: dialogData
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.loadHealthParameterLogs();
        }
      });
    } catch (error) {
      this.snackBar.open('Failed to open dialog. Please try again.', 'Close', {
        duration: 3000,
      });
    }
  }

  async viewHealthParameterLogDetails(log: IMemberHealthParameterLog): Promise<void> {
    try {
      // Fetch full details
      const fullLog = await this.apiService.getHealthParameterLog(this.memberId, log.memberHealthParameterLogId);
      const dialogRef = this.dialog.open(ViewHealthParameterLogDetailsComponent, {
        width: '800px',
        maxWidth: '90vw',
        data: fullLog
      });
    } catch (error) {
      this.snackBar.open('Failed to load health parameter log details. Please try again.', 'Close', {
        duration: 5000,
      });
    }
  }

  editHealthParameterLog(log: IMemberHealthParameterLog): void {
    if (!this.memberId) {
      this.snackBar.open('Member ID is not available', 'Close', {
        duration: 3000,
      });
      return;
    }
    const dialogData: ManageMemberBodyStatsData = {
      memberId: this.memberId,
      log: log
    };
    try {
      const dialogRef = this.dialog.open(ManageMemberBodyStatsComponent, {
        width: '800px',
        maxWidth: '80vw',
        data: dialogData
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.loadHealthParameterLogs();
        }
      });
    } catch (error) {
      this.snackBar.open('Failed to open edit dialog. Please try again.', 'Close', {
        duration: 3000,
      });
    }
  }

  async deleteHealthParameterLog(log: IMemberHealthParameterLog): Promise<void> {
    const dialogData: WarningDialogData = {
      title: 'Delete Health Parameter Log',
      message: `Are you sure you want to delete the health parameter log for ${this.formatDate(log.logDate)}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(WarningDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await this.apiService.deleteHealthParameterLog(this.memberId, log.memberHealthParameterLogId);
          this.snackBar.open('Health parameter log deleted successfully', 'Close', {
            duration: 3000,
          });
          this.loadHealthParameterLogs();
        } catch (error) {
          // Error toast is handled by HttpErrorInterceptor
        }
      }
    });
  }
}
