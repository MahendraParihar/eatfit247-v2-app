import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { Constants } from '../../../constants/Constants';
import { CommonSearchModel } from '../../../models/common-search.model';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { MemberBodyStatsDatasource } from '../member-body-stats.datasource';
import {
  MemberBodyStatsManageDialogComponent,
} from '../member-body-stats-manage-dialog/member-body-stats-manage-dialog.component';
import { MemberHealthParameterModelLog } from '../../../models/member-body-stats.model';

@Component({
  selector: 'app-member-body-stats-list',
  templateUrl: './member-body-stats-list.component.html',
  styleUrls: ['./member-body-stats-list.component.scss'],
})
export class MemberBodyStatsListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'logDate', 'status', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt', 'action'];
  dataSource: MemberBodyStatsDatasource;
  totalCount = 0;
  id: number;
  stringRes = StringResources;
  defaultPageSize = Constants.DEFAULT_PAGE_SIZE;
  pageSizeList = Constants.PAGE_SIZE_LIST;
  payload: CommonSearchModel = new CommonSearchModel();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private fb: FormBuilder,
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog) {
    this.activatedRoute.parent.params.subscribe(params => {
      this.id = Number(params['id']);
    });
    this.dataSource = new MemberBodyStatsDatasource(this.httpService, this.snackBarService);
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
    // this.dataSource = null;
  }

  async loadDataSet(): Promise<void> {
    this.payload.pageNumber = this.paginator ? this.paginator.pageIndex : 0;
    this.payload.pageSize = this.paginator ? this.paginator.pageSize : Constants.DEFAULT_PAGE_SIZE;
    await this.dataSource.loadData(ApiUrlEnum.MEMBER_BODY_STATS, this.id, this.payload);
  }

  async searchResult(searchObj: CommonSearchModel): Promise<void> {
    console.log(searchObj);
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
    const dialogData = {
      new: true,
      memberId: this.id,
    };
    const dialogRef = this.dialog.open(MemberBodyStatsManageDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
      if (result) {
        this.loadDataSet();
      }
    });
    // this.navigationService.navigateToById(NavigationPathEnum.MEMBER_CALL_SCHEDULE, this.id);
  }

  onEditClick(id: number) {
    const dialogData = {
      new: false,
      memberId: this.id,
      memberHealthLogId: id,
    };
    const dialogRef = this.dialog.open(MemberBodyStatsManageDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
      if (result) {
        this.loadDataSet();
      }
    });
  }

  onDeleteClick(item: MemberHealthParameterModelLog, index: number) {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.ALERT,
      message: StringResources.CHANGE_STATUS_DESC,
      positiveBtnTxt: StringResources.YES,
      negativeBtnTxt: StringResources.NO,
      alertType: AlertTypeEnum.WARNING,
    };
    const dialogRef = this.dialog.open(DialogAlertComponent, {
      width: '350px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
      if (result) {
        this.updateStatusTask(item, index);
      }
    });
  }

  async updateStatusTask(item: MemberHealthParameterModelLog, index: number): Promise<void> {
    const payload = {
      active: !item.active,
    };
    const res: ResponseDataModel = await this.httpService.patchRequest(ApiUrlEnum.MEMBER_BODY_STATS_UPDATE_STATUS, item.id, payload, true);
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
