import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import {
  DataTableComponent,
  ITableColumn,
  ITableConfig,
  EmptyStateComponent,
  EmptyStateType,
  LoaderComponent,
  createdByUserFormatter,
  updatedByUserFormatter
} from "@shared";
import { IMemberIssue } from "@eatfit247-shared-lib";
import { MembersApiService } from "../../api.service";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "lib-member-issues",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, DataTableComponent, EmptyStateComponent, LoaderComponent],
  templateUrl: "./member-issues.component.html",
  styleUrl: "./member-issues.component.scss"
})
export class MemberIssuesComponent implements OnInit, OnDestroy {
  memberId!: number;
  issues: IMemberIssue[] = [];
  loading = false;
  tableConfig!: ITableConfig<IMemberIssue>;
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
      this.memberId = +params["id"];
      if (this.memberId) {
        this.loadIssues();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IMemberIssue>[] = [
      {
        key: "issue",
        label: "Issue",
        dataKey: "issue",
        sortable: true
      },
      {
        key: "issueCategory",
        label: "Category",
        dataKey: "issueCategory",
        sortable: false
      },
      {
        key: "issueStatus",
        label: "Status",
        dataKey: "issueStatus",
        sortable: false
      },
      {
        key: "createdBy",
        label: "Created By",
        dataKey: "createdBy",
        sortable: false,
        formatter: createdByUserFormatter()
      },
      {
        key: "updatedBy",
        label: "Updated By",
        dataKey: "updatedBy",
        sortable: false,
        formatter: updatedByUserFormatter()
      },
      {
        key: "createdAt",
        label: "Created At",
        dataKey: "createdAt",
        type: "date",
        sortable: true
      },
      {
        key: "updatedAt",
        label: "Updated At",
        dataKey: "updatedAt",
        type: "date",
        sortable: true
      }
    ];
    this.tableConfig = {
      columns,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: true
    };
  }

  async loadIssues(): Promise<void> {
    this.loading = true;
    try {
      this.issues = await this.apiService.getIssues(this.memberId);
    } catch (error) {
      console.error("Error loading issues:", error);
      this.issues = [];
    } finally {
      this.loading = false;
    }
  }

  addIssue(): void {
    // TODO: Open dialog/form to add new issue
    console.log("Add issue for member:", this.memberId);
  }
}
