import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { AdminUserStatusEnum } from '../../../enum/admin-user-status-enum';
import { Constants } from '../../../constants/Constants';
import { CommonSearchModel } from '../../../models/common-search.model';
import { MatPaginator } from '@angular/material/paginator';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs';
import { NavigationPathEnum } from '../../../enum/navigation-path-enum';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import {
  DialogUserStatusChangeComponent,
} from '../../shared/components/dialog-user-status-change/dialog-user-status-change.component';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { MemberListModel } from '../../../models/member.model';
import { MemberDatasource } from '../member.datasource';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';

@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss'],
})
export class MemberListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'name', 'contactNo', 'emailId', 'nutritionist', 'franchise', 'referrer', 'country', 'status', 'action'];
  // displayedColumns = ['image', "data", 'status', "action"];
  dataSource: MemberDatasource;
  totalCount = 0;
  stringRes = StringResources;
  adminUserStatusEnum = AdminUserStatusEnum;
  navigationPathEnum = NavigationPathEnum;
  defaultPageSize = Constants.DEFAULT_PAGE_SIZE;
  pageSizeList = Constants.PAGE_SIZE_LIST;
  payload: CommonSearchModel = new CommonSearchModel();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    public dialog: MatDialog) {
    this.dataSource = new MemberDatasource(this.httpService, this.snackBarService);
    this.dataSource.totalCount.subscribe((count: number) => this.totalCount = count);
  }

  async ngOnInit(): Promise<void> {
    await this.loadDataSet();
  }

  ngAfterViewInit() {
    if(this.paginator) {
      this.paginator.page
        .pipe(
          tap(() => this.loadDataSet()),
        )
        .subscribe();
    }
  }

  ngOnDestroy(): void {
  }

  async loadDataSet(): Promise<void> {
    this.payload.pageNumber = this.paginator ? this.paginator.pageIndex : 0;
    this.payload.pageSize = this.paginator ? this.paginator.pageSize : Constants.DEFAULT_PAGE_SIZE;
    await this.dataSource.loadData(this.payload);
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

  onAddClick() {
    this.navigationService.navigateTo(NavigationPathEnum.MEMBERS_MANAGE);
  }

  onEditClick(id: number) {
    this.navigationService.navigateToById(NavigationPathEnum.MEMBERS_MANAGE, id);
  }

  onViewClick(id: number) {
    this.navigationService.navigateToById(NavigationPathEnum.MEMBERS_DETAIL, id);
  }

  onFranchiseClick(id: number) {
    this.navigationService.navigateToById(NavigationPathEnum.FRANCHISE_DETAIL, id);
  }

  onReferrerClick(id: number) {
    this.navigationService.navigateToById(NavigationPathEnum.REFERRER_DETAIL, id);
  }

  onDeleteClick(item: MemberListModel, index: number) {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.ALERT,
      message: StringResources.CHANGE_STATUS_DESC,
      positiveBtnTxt: StringResources.YES,
      negativeBtnTxt: StringResources.NO,
      alertType: AlertTypeEnum.WARNING,
    };
    const dialogRef = this.dialog.open(DialogUserStatusChangeComponent, {
      width: '400px',
      disableClose: true,
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe(result => {

      if (result) {
        this.updateStatusTask(item, result, index);
      }
    });
  }

  async updateStatusTask(item: MemberListModel, result: {}, index: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.putRequest(ApiUrlEnum.MEMBER_UPDATE_STATUS, item.id, result, true);
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

  onResetPasswordClick(item: MemberListModel) {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.RESET_PASSWORD_TITLE,
      message: StringResources.RESET_PASSWORD_DESC,
      positiveBtnTxt: StringResources.YES,
      negativeBtnTxt: StringResources.NO,
      alertType: AlertTypeEnum.WARNING,
    };
    const dialogRef = this.dialog.open(DialogAlertComponent, {
      width: '400px',
      disableClose: true,
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe(result => {

      if (result) {
        this.resetPassword(item.id);
      }
    });
  }

  async resetPassword(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_RESET_PASSWORD, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
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
