import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { Constants } from '../../../constants/Constants';
import { MatPaginator } from '@angular/material/paginator';
import { tap } from 'rxjs';
import { AdminUserDatasource } from '../admin-user.datasource';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { AdminUserModel } from '../../../models/admin-user.model';
import { NavigationService } from '../../../service/navigation.service';
import { NavigationPathEnum } from '../../../enum/navigation-path-enum';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import { CommonSearchModel } from '../../../models/common-search.model';
import { AdminUserStatusEnum } from '../../../enum/admin-user-status-enum';
import {
  DialogUserStatusChangeComponent,
} from '../../shared/components/dialog-user-status-change/dialog-user-status-change.component';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';

@Component({
  selector: 'app-admin-user-list',
  templateUrl: './admin-user-list.component.html',
  styleUrls: ['./admin-user-list.component.scss'],
})
export class AdminUserListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'image', 'name', 'role', 'emailId', 'contactNumber', 'startDate', 'endDate', 'status', 'action'];
  dataSource: AdminUserDatasource;
  totalCount = 0;
  stringRes = StringResources;
  adminUserStatusEnum = AdminUserStatusEnum;
  defaultPageSize = Constants.DEFAULT_PAGE_SIZE;
  pageSizeList = Constants.PAGE_SIZE_LIST;
  payload: CommonSearchModel = new CommonSearchModel();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    public dialog: MatDialog) {
    this.dataSource = new AdminUserDatasource(this.httpService, this.snackBarService);
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
    this.navigationService.navigateTo(NavigationPathEnum.ADMIN_MANAGE);
  }

  onEditClick(id: number) {
    this.navigationService.navigateToById(NavigationPathEnum.ADMIN_MANAGE, id);
  }

  onDeleteClick(item: AdminUserModel, index: number) {
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

  async updateStatusTask(item: AdminUserModel, result: {}, index: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.putRequest(ApiUrlEnum.ADMIN_UPDATE_STATUS, item.id, result, true);
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

  onResetPasswordClick(item: AdminUserModel) {
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
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.ADMIN_RESET_PASSWORD, id, null, true);
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
