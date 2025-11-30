import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { Constants } from '../../../constants/Constants';
import { MatPaginator } from '@angular/material/paginator';
import { tap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { NavigationService } from '../../../service/navigation.service';
import { NavigationPathEnum } from '../../../enum/navigation-path-enum';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import { AdminUserStatusEnum } from '../../../enum/admin-user-status-enum';
import {
  DialogUserStatusChangeComponent
} from '../../shared/components/dialog-user-status-change/dialog-user-status-change.component';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import { TableDataDatasource } from 'src/app/ui/table-data.datasource';
import { IAdminUserList, ITableListFilter } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-admin-user-list',
  templateUrl: './admin-user-list.component.html',
  styleUrls: ['./admin-user-list.component.scss']
})
export class AdminUserListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'image', 'name', 'role', 'emailId', 'contactNumber', 'startDate', 'endDate', 'status', 'action'];
  dataSource: TableDataDatasource<IAdminUserList>;
  totalCount = 0;
  stringRes = StringResources;
  adminUserStatusEnum = AdminUserStatusEnum;
  defaultPageSize = Constants.DEFAULT_PAGE_SIZE;
  pageSizeList = Constants.PAGE_SIZE_LIST;
  payload: ITableListFilter = {
    page: this.pageSizeList[0],
    limit: this.defaultPageSize
  };
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    public dialog: MatDialog) {
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

  async searchResult(payload: ITableListFilter): Promise<void> {
    this.payload.search = payload.search;
    this.payload.createdTo = payload.createdTo;
    this.payload.createdFrom = payload.createdFrom;
    this.payload.name = payload.name;
    this.paginator.firstPage();
    await this.loadDataSet();
  }

  async loadDataSet(): Promise<void> {
    this.payload.page = this.paginator ? this.paginator.pageIndex : 0;
    this.payload.limit = this.paginator ? this.paginator.pageSize : Constants.DEFAULT_PAGE_SIZE;
    await this.dataSource.loadData(ApiUrlEnum.ADMIN_LIST, this.payload);
  }

  onAddClick() {
    this.navigationService.navigateTo(NavigationPathEnum.ADMIN_MANAGE);
  }

  onEditClick(id: number) {
    this.navigationService.navigateToById(NavigationPathEnum.ADMIN_MANAGE, id);
  }

  onDeleteClick(item: IAdminUserList, index: number) {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.ALERT,
      message: StringResources.CHANGE_STATUS_DESC,
      positiveBtnTxt: StringResources.YES,
      negativeBtnTxt: StringResources.NO,
      alertType: AlertTypeEnum.WARNING
    };
    const dialogRef = this.dialog.open(DialogUserStatusChangeComponent, {
      width: '400px',
      disableClose: true,
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateStatusTask(item, result, index);
      }
    });
  }

  async updateStatusTask(item: IAdminUserList, result: {}, index: number): Promise<void> {
    const res = await this.httpService.putRequest(ApiUrlEnum.ADMIN_UPDATE_STATUS, item.adminId, result, true);
    if (res) {
      this.snackBarService.showSuccess('Status change successfully');
      await this.loadDataSet();
    }
  }

  onResetPasswordClick(item: IAdminUserList) {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.RESET_PASSWORD_TITLE,
      message: StringResources.RESET_PASSWORD_DESC,
      positiveBtnTxt: StringResources.YES,
      negativeBtnTxt: StringResources.NO,
      alertType: AlertTypeEnum.WARNING
    };
    const dialogRef = this.dialog.open(DialogAlertComponent, {
      width: '400px',
      disableClose: true,
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.resetPassword(item.adminId);
      }
    });
  }

  async resetPassword(id: number): Promise<void> {
    const res = await this.httpService.getRequest(ApiUrlEnum.ADMIN_RESET_PASSWORD, id, null, true);
    if (res) {
      this.snackBarService.showSuccess('Password reset successfully');
    }
  }
}
