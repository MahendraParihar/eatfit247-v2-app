import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { Constants } from '../../../constants/Constants';
import { MatPaginator } from '@angular/material/paginator';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import { ActivatedRoute } from '@angular/router';
import {
  MemberCallScheduleManageDialogComponent,
} from '../member-call-schedule-manage-dialog/member-call-schedule-manage-dialog.component';
import { TableDataDatasource } from 'src/app/ui/table-data.datasource';
import { IMemberCallLog, ITableListFilter } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-member-call-schedule',
  templateUrl: './member-call-schedule.component.html',
  styleUrls: ['./member-call-schedule.component.scss'],
})
export class MemberCallScheduleComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'detail', 'dateTime', 'callStatus', 'status', 'createdBy', 'updatedBy', 'action'];
  dataSource: TableDataDatasource<IMemberCallLog>;
  totalCount = 0;
  id: number;
  stringRes = StringResources;
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
    await this.dataSource.loadData(ApiUrlEnum.MEMBER_CALL_LOG, this.payload);
  }

  async searchResult(payload: ITableListFilter): Promise<void> {
    this.payload.search = payload.search;
    this.payload.createdTo = payload.createdTo;
    this.payload.createdFrom = payload.createdFrom;
    this.payload.name = payload.name;
    this.paginator.firstPage();
    await this.loadDataSet();
  }

  onAddClick() {
    const dialogData = {
      new: true,
      memberId: this.id,
    };
    const dialogRef = this.dialog.open(MemberCallScheduleManageDialogComponent, {
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

  onEditClick(id: number) {
    const dialogData = {
      new: false,
      memberId: this.id,
      memberCallLogId: id,
    };
    const dialogRef = this.dialog.open(MemberCallScheduleManageDialogComponent, {
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

  onDeleteClick(item: IMemberCallLog, index: number) {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.ALERT,
      message: StringResources.CHANGE_STATUS_DESC,
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
        this.updateStatusTask(item, index);
      }
    });
  }

  async updateStatusTask(item: IMemberCallLog, index: number): Promise<void> {
    const payload = {
      active: !item.active
    };
    const res = await this.httpService.patchRequest(ApiUrlEnum.MEMBER_CALL_LOG_UPDATE_STATUS, item.id, payload, true);
    this.snackBarService.showSuccess('Status changed successfully');
    await this.loadDataSet();
  }
}
