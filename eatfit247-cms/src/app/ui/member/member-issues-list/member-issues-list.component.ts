import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { tap } from 'rxjs';
import { Constants } from 'src/app/constants/Constants';
import { AlertTypeEnum } from 'src/app/enum/alert-type-enum';
import { ApiUrlEnum } from 'src/app/enum/api-url-enum';
import { IssueStatusEnum } from 'shared-lib';
import { StringResources } from 'src/app/enum/string-resources';
import { AlertDialogDataInterface } from 'src/app/interfaces/alert-dialog-data.interface';
import { HttpService } from 'src/app/service/http.service';
import { SnackBarService } from 'src/app/service/snack-bar.service';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import { MemberIssueDialogComponent } from '../member-issue-dialog/member-issue-dialog.component';
import { TableDataDatasource } from 'src/app/ui/table-data.datasource';
import { IMemberHealthIssue, ITableListFilter, IResponse } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-member-issues-list',
  templateUrl: './member-issues-list.component.html',
  styleUrls: ['./member-issues-list.component.scss'],
})
export class MemberIssuesListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'issue', 'response', 'status', 'createdBy', 'respondedBy', 'action'];
  dataSource: TableDataDatasource<IMemberHealthIssue>;
  totalCount = 0;
  id: number;
  issueStatusEnum = IssueStatusEnum;
  stringRes = StringResources;
  defaultPageSize = Constants.DEFAULT_PAGE_SIZE;
  pageSizeList = Constants.PAGE_SIZE_LIST;
  payload: ITableListFilter = {
    page: this.pageSizeList[0],
    limit: this.defaultPageSize
  };
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog) {
    this.activatedRoute.parent.params.subscribe(params => {
      this.id = Number(params['id']);
    });
    this.dataSource = new TableDataDatasource(this.httpService);
    this.dataSource.totalCount.subscribe((count: number) => this.totalCount = count);
  }

  async ngOnInit(): Promise<void> {
    await this.loadDataSet();
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.paginator.page
        .pipe(
          tap(() => this.loadDataSet())
        )
        .subscribe();
    }
  }

  ngOnDestroy(): void {
    this.dataSource = null;
  }

  async loadDataSet(): Promise<void> {
    this.payload.page = this.paginator ? this.paginator.pageIndex : 0;
    this.payload.limit = this.paginator ? this.paginator.pageSize : Constants.DEFAULT_PAGE_SIZE;
    await this.dataSource.loadData(ApiUrlEnum.MEMBER_ISSUES, this.payload);
  }

  onEditClick(memberIssueModel: IMemberHealthIssue) {
    const dialogData = {
      new: false,
      memberId: this.id,
      memberIssueModel: memberIssueModel,
    };
    const dialogRef = this.dialog.open(MemberIssueDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDataSet();
      }
    });
  }

  updateIssueStatus(item: IMemberHealthIssue, newStatus: number) {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.ALERT,
      message: newStatus == IssueStatusEnum.CANCELLED ? StringResources.CHANGE_ISSUE_STATUS_CANCEL_DESC : StringResources.CHANGE_ISSUE_STATUS_CLOSE_DESC,
      positiveBtnTxt: StringResources.YES,
      negativeBtnTxt: StringResources.NO,
      alertType: AlertTypeEnum.WARNING
    };
    const dialogRef = this.dialog.open(DialogAlertComponent, {
      width: '350px',
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (newStatus == IssueStatusEnum.CANCELLED) {
          this.deleteIssue(item);
        } else {
          this.updateStatusTask(item, newStatus);
        }
      }
    });
  }

  markIssueCancelled(item: IMemberHealthIssue) {
    this.updateIssueStatus(item, IssueStatusEnum.CANCELLED);
  }

  async updateStatusTask(item: IMemberHealthIssue, newStatus: number): Promise<void> {
    const payload = {
      statusId: newStatus
    };
    const res = await this.httpService.patchRequest<IResponse<void>>(ApiUrlEnum.MEMBER_ISSUE_UPDATE_STATUS, item.id, payload, true);
    if (res) {
      this.snackBarService.showSuccess('Status changed successfully');
      await this.loadDataSet();
    }
  }

  async deleteIssue(item: IMemberHealthIssue): Promise<void> {
    const payload = {
      statusId: IssueStatusEnum.CANCELLED
    };
    const res = await this.httpService.deleteRequest<IResponse<void>>(ApiUrlEnum.MEMBER_ISSUE_DELETE, item.id, true);
    if (res) {
      this.snackBarService.showSuccess('Status changed successfully');
      await this.loadDataSet();
    }
  }
}
