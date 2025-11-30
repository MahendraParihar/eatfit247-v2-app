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
import { NavigationPathEnum } from '../../../enum/navigation-path-enum';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import { TableDataDatasource } from 'src/app/ui/table-data.datasource';
import { IDietTemplate, ITableListFilter } from 'shared-lib';
import {
  DietTemplateManageDialogComponent
} from '../diet-template-manage-dialog/diet-template-manage-dialog.component';

@Component({
  standalone: false,
  selector: 'app-diet-template-list',
  templateUrl: './diet-template-list.component.html',
  styleUrls: ['./diet-template-list.component.scss']
})
export class DietTemplateListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'title', 'noOfCycle', 'daysInCycle', 'isWeekly', 'status', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt', 'action'];
  dataSource: TableDataDatasource<IDietTemplate>;
  totalCount = 0;
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
    await this.dataSource.loadData(ApiUrlEnum.DIET_TEMPLATE_LIST, this.payload);
  }

  onAddClick() {
    const dialogData = {
      new: true
    };
    const dialogRef = this.dialog.open(DietTemplateManageDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDataSet();
      }
    });
    // this.navigationService.navigateToById(NavigationPathEnum.MEMBER_CALL_SCHEDULE, this.id);
  }

  onEditClick(id: number) {
    const dialogData = {
      new: false,
      dietTemplateId: id
    };
    const dialogRef = this.dialog.open(DietTemplateManageDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDataSet();
      }
    });
    // this.navigationService.navigateToById(NavigationPathEnum.MEMBER_CALL_SCHEDULE, id);
  }

  onDietPlanClick(dietTemplateId: number) {
    this.navigationService.navigateToById(NavigationPathEnum.DIET_TEMPLATE_DETAILS, dietTemplateId);
  }

  onDeleteClick(item: DietTemplateModel, index: number) {
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

  async updateStatusTask(item: DietTemplateModel, index: number): Promise<void> {
    const payload = {
      active: !item.active
    };
    const res = await this.httpService.patchRequest(ApiUrlEnum.DIET_TEMPLATE_STATUS_CHANGE, item.id, payload, true);
    if (res) {
      this.snackBarService.showSuccess('Status changed successfully');
      await this.loadDataSet();
    }
  }
}
