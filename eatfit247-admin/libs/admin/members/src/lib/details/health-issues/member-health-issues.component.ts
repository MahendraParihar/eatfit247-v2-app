import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import {
  createdByUserFormatter,
  DataTableComponent,
  EmptyStateComponent,
  EmptyStateType,
  ITableColumn,
  ITableConfig,
  LoaderComponent,
  updatedByUserFormatter
} from '@shared';
import { IMemberHealthIssue } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { Subject, takeUntil } from 'rxjs';
import {
  ManageMemberHealthIssueComponent,
  ManageMemberHealthIssueData
} from './manage-member-health-issue/manage-member-health-issue.component';

@Component({
  selector: 'lib-member-health-issues',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    DataTableComponent,
    EmptyStateComponent,
    LoaderComponent,
  ],
  templateUrl: './member-health-issues.component.html',
  styleUrl: './member-health-issues.component.scss',
})
export class MemberHealthIssuesComponent implements OnInit, OnDestroy {
  memberId!: number;
  healthIssues: IMemberHealthIssue[] = [];
  loading = false;
  totalCount = 0;
  tableConfig!: ITableConfig<IMemberHealthIssue>;
  EmptyStateType = EmptyStateType;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private apiService: MembersApiService,
    private dialog: MatDialog,
  ) {
    this.initializeTable();
  }

  ngOnInit(): void {
    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.memberId = +params['id'];
        if (this.memberId) {
          this.loadHealthIssues();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IMemberHealthIssue>[] = [
      {
        key: 'healthIssue',
        label: 'Health Issue',
        dataKey: 'healthIssue',
        sortable: true,
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

    this.tableConfig = {
      columns,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: false,
      showSearch: false,
    };
  }

  async loadHealthIssues(): Promise<void> {
    this.loading = true;
    try {
      const res = await this.apiService.getHealthIssues(this.memberId);
      this.healthIssues = res.tableData;
      this.totalCount = res.count;
    } catch (error) {
      console.error('Error loading health issues:', error);
      this.healthIssues = [];
    } finally {
      this.loading = false;
    }
  }

  addHealthIssue(): void {
    const dialogData: ManageMemberHealthIssueData = {
      memberId: this.memberId,
    };
    const dialogRef = this.dialog.open(ManageMemberHealthIssueComponent, {
      width: '600px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload health issues after successful update
        this.loadHealthIssues();
      }
    });
  }
}
