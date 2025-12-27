import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent, ITableColumn, ITableConfig, EmptyStateComponent, EmptyStateType, LoaderComponent, createdByUserFormatter, updatedByUserFormatter } from '@shared';
import { IMemberPocketGuide } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-member-pocket-guide',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, DataTableComponent, EmptyStateComponent, LoaderComponent],
  templateUrl: './member-pocket-guide.component.html',
  styleUrl: './member-pocket-guide.component.scss'
})
export class MemberPocketGuideComponent implements OnInit, OnDestroy {
  memberId!: number;
  pocketGuides: IMemberPocketGuide[] = [];
  loading = false;
  tableConfig!: ITableConfig<IMemberPocketGuide>;
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

  async loadPocketGuides(): Promise<void> {
    this.loading = true;
    try {
      this.pocketGuides = await this.apiService.getPocketGuides(this.memberId);
    } catch (error) {
      console.error('Error loading pocket guides:', error);
      this.pocketGuides = [];
    } finally {
      this.loading = false;
    }
  }

  addPocketGuide(): void {
    // TODO: Open dialog/form to add new pocket guide
    console.log('Add pocket guide for member:', this.memberId);
  }
}
