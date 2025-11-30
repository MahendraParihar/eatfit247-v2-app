import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { AdminUserStatusEnum } from '../../../enum/admin-user-status-enum';
import { Constants } from '../../../constants/Constants';
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
  DialogUserStatusChangeComponent
} from '../../shared/components/dialog-user-status-change/dialog-user-status-change.component';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import { TableDataDatasource } from 'src/app/ui/table-data.datasource';
import { IMemberList, ITableListFilter } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss']
})
export class MemberListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'name', 'contactNo', 'emailId', 'nutritionist', 'franchise', 'referrer', 'country', 'status', 'action'];
  // displayedColumns = ['image', "data", 'status', "action"];
  dataSource: TableDataDatasource<IMemberList>;
  totalCount = 0;
  stringRes = StringResources;
  adminUserStatusEnum = AdminUserStatusEnum;
  navigationPathEnum = NavigationPathEnum;
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
    await this.dataSource.loadData(ApiUrlEnum.MEMBER_LIST, this.payload);
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

  onDeleteClick(item: IMemberList, index: number) {
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

  async updateStatusTask(item: IMemberList, result: {}, index: number): Promise<void> {
    const res = await this.httpService.putRequest(ApiUrlEnum.MEMBER_UPDATE_STATUS, item.memberId, result, true);
    if (res) {
      this.snackBarService.showSuccess('Status changed successfully');
      await this.loadDataSet();
    }
  }

  onResetPasswordClick(item: IMemberList) {
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
        this.resetPassword(item.memberId);
      }
    });
  }

  async resetPassword(id: number): Promise<void> {
    const res = await this.httpService.getRequest(ApiUrlEnum.MEMBER_RESET_PASSWORD, id, null, true);
    if (res) {
      this.snackBarService.showSuccess('Password reset successfully');
      await this.loadDataSet();
    }
  }
}
