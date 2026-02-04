import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
import { IMemberPocketGuide } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { Subject, takeUntil } from 'rxjs';
import {
  ManageMemberPocketGuideComponent,
  ManageMemberPocketGuideData
} from './manage-member-pocket-guide/manage-member-pocket-guide.component';

@Component({
  selector: 'lib-member-pocket-guide',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule, DataTableComponent, EmptyStateComponent, LoaderComponent],
  templateUrl: './member-pocket-guide.component.html',
  styleUrl: './member-pocket-guide.component.scss'
})
export class MemberPocketGuideComponent implements OnInit, OnDestroy {
  memberId!: number;
  pocketGuides: IMemberPocketGuide[] = [];
  loading = false;
  totalCount = 0;
  tableConfig!: ITableConfig<IMemberPocketGuide>;
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
        this.loadPocketGuides();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IMemberPocketGuide>[] = [
      { key: 'pocketGuide', label: 'Pocket Guide', dataKey: 'pocketGuide', sortable: true },
      {
        key: 'createdByUser',
        label: 'Created By',
        dataKey: 'createdByUser',
        sortable: false,
        formatter: createdByUserFormatter()
      },
      {
        key: 'updatedByUser',
        label: 'Updated By',
        dataKey: 'updatedByUser',
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
    this.tableConfig = {
      columns,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: false,
      showSearch: false,
    };
  }

  async loadPocketGuides(): Promise<void> {
    this.loading = true;
    try {
      const res = await this.apiService.getPocketGuides(this.memberId);
      this.pocketGuides = res.tableData;
      this.totalCount = res.count;
    } catch (error) {
      this.snackBar.open('Failed to load pocket guides. Please try again.', 'Close', {
        duration: 5000,
      });
      this.pocketGuides = [];
    } finally {
      this.loading = false;
    }
  }

  addPocketGuide(): void {
    const dialogData: ManageMemberPocketGuideData = {
      memberId: this.memberId
    };
    const dialogRef = this.dialog.open(ManageMemberPocketGuideComponent, {
      width: '600px',
      data: dialogData
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload pocket guides after successful update
        this.loadPocketGuides();
      }
    });
  }
}
