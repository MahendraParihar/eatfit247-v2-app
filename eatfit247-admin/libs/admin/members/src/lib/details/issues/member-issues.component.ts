import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog } from "@angular/material/dialog";
import {
  DataTableComponent,
  ITableColumn,
  ITableConfig,
  ITableAction,
  EmptyStateComponent,
  EmptyStateType,
  LoaderComponent,
  createdByUserFormatter,
  updatedByUserFormatter
} from "@shared";
import { IMemberIssue } from "@eatfit247-shared-lib";
import { MembersApiService } from "../../api.service";
import { Subject, takeUntil } from "rxjs";
import {
  ManageMemberIssueComponent,
  ManageMemberIssueData
} from "./manage-member-issue/manage-member-issue.component";
import {
  IssueChatComponent,
  IssueChatData
} from "./issue-chat/issue-chat.component";

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
    private apiService: MembersApiService,
    private dialog: MatDialog
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
        key: "createdByUser",
        label: "Created By",
        dataKey: "createdByUser",
        sortable: false,
        formatter: createdByUserFormatter()
      },
      {
        key: "updatedByUser",
        label: "Updated By",
        dataKey: "updatedByUser",
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
    const actions: ITableAction<IMemberIssue>[] = [
      { label: 'View/Respond', icon: 'chat', color: 'primary', onClick: (row) => this.openChat(row) },
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editIssue(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: true,
      showSearch: false,
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
    const dialogData: ManageMemberIssueData = {
      memberId: this.memberId,
    };
    const dialogRef = this.dialog.open(ManageMemberIssueComponent, {
      width: '600px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload issues after successful create/update
        this.loadIssues();
      }
    });
  }

  editIssue(issue: IMemberIssue): void {
    const dialogData: ManageMemberIssueData = {
      memberId: this.memberId,
      issue: {
        memberIssueId: issue.memberIssueId,
        memberId: issue.memberId,
        issue: issue.issue,
        issueStatusId: issue.issueStatusId,
        issueCategoryId: issue.issueCategoryId,
      },
    };
    const dialogRef = this.dialog.open(ManageMemberIssueComponent, {
      width: '600px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload issues after successful update
        this.loadIssues();
      }
    });
  }

  openChat(issue: IMemberIssue): void {
    const dialogData: IssueChatData = {
      memberId: this.memberId,
      issue: issue,
    };
    const dialogRef = this.dialog.open(IssueChatComponent, {
      width: '600px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload issues after chat interaction (status might have changed)
        this.loadIssues();
      }
    });
  }
}
