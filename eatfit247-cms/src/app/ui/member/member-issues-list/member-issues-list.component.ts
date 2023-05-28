import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { tap } from 'rxjs';
import { Constants } from 'src/app/constants/Constants';
import { AlertTypeEnum } from 'src/app/enum/alert-type-enum';
import { ApiUrlEnum } from 'src/app/enum/api-url-enum';
import { IssueStatusEnum } from 'src/app/enum/issue-status-enum';
import { ServerResponseEnum } from 'src/app/enum/server-response-enum';
import { StringResources } from 'src/app/enum/string-resources';
import { AlertDialogDataInterface } from 'src/app/interfaces/alert-dialog-data.interface';
import { CommonSearchModel } from 'src/app/models/common-search.model';
import { MemberIssueModel } from 'src/app/models/member-isssue.model';
import { ResponseDataModel } from 'src/app/models/response-data.model';
import { HttpService } from 'src/app/service/http.service';
import { SnackBarService } from 'src/app/service/snack-bar.service';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import { MemberIssueDialogComponent } from '../member-issue-dialog/member-issue-dialog.component';
import { MemberIssueDatasource } from '../member-issue.datasource';

@Component({
  selector: 'app-member-issues-list',
  templateUrl: './member-issues-list.component.html',
  styleUrls: ['./member-issues-list.component.scss'],
})
export class MemberIssuesListComponent implements OnInit {
  displayedColumns = ['seqNo', 'issue', 'response', 'status', 'createdBy', 'respondedBy', 'action'];
  dataSource: MemberIssueDatasource;
  totalCount = 0;
  id: number;
  issueStatusEnum = IssueStatusEnum;
  stringRes = StringResources;
  defaultPageSize = Constants.DEFAULT_PAGE_SIZE;
  pageSizeList = Constants.PAGE_SIZE_LIST;
  payload: CommonSearchModel = new CommonSearchModel();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog) {
    this.activatedRoute.parent.params.subscribe(params => {
      this.id = Number(params['id']);
    });
    this.dataSource = new MemberIssueDatasource(this.httpService, this.snackBarService);
    this.dataSource.totalCount.subscribe((count: number) => this.totalCount = count);
  }

  async ngOnInit(): Promise<void> {
    await this.loadDataSet();
  }

  ngAfterViewInit() {
    this.paginator.page
      .pipe(
        tap(() => this.loadDataSet()),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.dataSource = null;
  }

  async loadDataSet(): Promise<void> {
    this.payload.pageNumber = this.paginator ? this.paginator.pageIndex : 0;
    this.payload.pageSize = this.paginator ? this.paginator.pageSize : Constants.DEFAULT_PAGE_SIZE;
    await this.dataSource.loadData(ApiUrlEnum.MEMBER_ISSUES, this.id, this.payload);
  }

  async searchResult(searchObj: CommonSearchModel): Promise<void> {
    if (searchObj) {
      this.payload.name = searchObj.name ? searchObj.name : null;
      this.payload.active = searchObj.active;
      this.payload.createdFrom = searchObj.createdFrom;
      this.payload.createdTo = searchObj.createdTo;
    } else {
      this.payload.name = null;
      this.payload.active = null;
      this.payload.createdFrom = null;
      this.payload.createdTo = null;
    }
    this.paginator.firstPage();
    await this.loadDataSet();
  }

  onEditClick(memberIssueModel: MemberIssueModel) {
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

  updateIssueStatus(item: MemberIssueModel, newStatus: number) {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.ALERT,
      message: newStatus == IssueStatusEnum.CANCELLED ? StringResources.CHANGE_ISSUE_STATUS_CANCEL_DESC : StringResources.CHANGE_ISSUE_STATUS_CLOSE_DESC,
      positiveBtnTxt: StringResources.YES,
      negativeBtnTxt: StringResources.NO,
      alertType: AlertTypeEnum.WARNING,
    };
    const dialogRef = this.dialog.open(DialogAlertComponent, {
      width: '350px',
      data: dialogData,
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

  markIssueCancelled(item: MemberIssueModel) {
    this.updateIssueStatus(item, IssueStatusEnum.CANCELLED);
  }

  async updateStatusTask(item: MemberIssueModel, newStatus: number): Promise<void> {
    const payload = {
      statusId: newStatus,
    };
    const res: ResponseDataModel = await this.httpService.patchRequest(ApiUrlEnum.MEMBER_ISSUE_UPDATE_STATUS, item.issueId, payload, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          await this.loadDataSet();
          break;
        case ServerResponseEnum.WARNING:
          this.snackBarService.showWarning(res.message);
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }

  async deleteIssue(item: MemberIssueModel): Promise<void> {
    const payload = {
      statusId: IssueStatusEnum.CANCELLED,
    };
    const res: ResponseDataModel = await this.httpService.deleteRequest(ApiUrlEnum.MEMBER_ISSUE_DELETE, item.issueId, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          await this.loadDataSet();
          break;
        case ServerResponseEnum.WARNING:
          this.snackBarService.showWarning(res.message);
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }
}
