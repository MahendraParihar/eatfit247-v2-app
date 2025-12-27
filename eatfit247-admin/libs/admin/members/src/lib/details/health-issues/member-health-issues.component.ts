import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent, ITableColumn, ITableConfig, EmptyStateComponent, EmptyStateType, LoaderComponent, createdByUserFormatter, updatedByUserFormatter } from '@shared';
import { IMemberHealthIssue } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-member-health-issues',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, DataTableComponent, EmptyStateComponent, LoaderComponent],
  templateUrl: './member-health-issues.component.html',
  styleUrl: './member-health-issues.component.scss'
})
export class MemberHealthIssuesComponent implements OnInit, OnDestroy {
  memberId!: number;
  healthIssues: IMemberHealthIssue[] = [];
  loading = false;
  tableConfig!: ITableConfig<IMemberHealthIssue>;
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
      { key: 'healthIssue', label: 'Health Issue', dataKey: 'healthIssue', sortable: true },
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

  async loadHealthIssues(): Promise<void> {
    this.loading = true;
    try {
      this.healthIssues = await this.apiService.getHealthIssues(this.memberId);
    } catch (error) {
      console.error('Error loading health issues:', error);
      this.healthIssues = [];
    } finally {
      this.loading = false;
    }
  }

  addHealthIssue(): void {
    // TODO: Open dialog/form to add new health issue
    console.log('Add health issue for member:', this.memberId);
  }
}
