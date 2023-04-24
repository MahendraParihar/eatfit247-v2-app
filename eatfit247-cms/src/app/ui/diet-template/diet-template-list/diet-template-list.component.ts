import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {StringResources} from "../../../enum/string-resources";
import {Constants} from "../../../constants/Constants";
import {CommonSearchModel} from "../../../models/common-search.model";
import {MatPaginator} from "@angular/material/paginator";
import {HttpService} from "../../../service/http.service";
import {SnackBarService} from "../../../service/snack-bar.service";
import {NavigationService} from "../../../service/navigation.service";
import {MatDialog} from "@angular/material/dialog";
import {tap} from "rxjs";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {NavigationPathEnum} from "../../../enum/navigation-path-enum";
import {AlertDialogDataInterface} from "../../../interfaces/alert-dialog-data.interface";
import {AlertTypeEnum} from "../../../enum/alert-type-enum";
import {DialogAlertComponent} from "../../shared/components/dialog-alert/dialog-alert.component";
import {ResponseDataModel} from "../../../models/response-data.model";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {DietTemplateDatasource} from "../diet-template.datasource";
import {DietTemplateModel} from "../../../models/diet-template.model";
import {DietTemplateManageDialogComponent} from "../diet-template-manage-dialog/diet-template-manage-dialog.component";

@Component({
  selector: 'app-diet-template-list',
  templateUrl: './diet-template-list.component.html',
  styleUrls: ['./diet-template-list.component.scss']
})
export class DietTemplateListComponent implements OnInit, AfterViewInit, OnDestroy {

  displayedColumns = ["seqNo", 'title', 'noOfCycle', 'daysInCycle', 'isWeekly', 'status', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt', "action"];
  dataSource: DietTemplateDatasource;
  totalCount = 0;

  stringRes = StringResources;

  defaultPageSize = Constants.DEFAULT_PAGE_SIZE;
  pageSizeList = Constants.PAGE_SIZE_LIST;
  payload: CommonSearchModel = new CommonSearchModel();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private httpService: HttpService,
              private snackBarService: SnackBarService,
              private navigationService: NavigationService,
              public dialog: MatDialog) {
    this.dataSource = new DietTemplateDatasource(this.httpService, this.snackBarService);
    this.dataSource.totalCount.subscribe((count: number) => this.totalCount = count);
  }

  async ngOnInit(): Promise<void> {
    await this.loadDataSet();
  }

  ngAfterViewInit() {
    this.paginator.page
      .pipe(
        tap(() => this.loadDataSet())
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    // this.dataSource = null;
  }

  async loadDataSet(): Promise<void> {
    this.payload.pageNumber = this.paginator ? this.paginator.pageIndex : 0;
    this.payload.pageSize = this.paginator ? this.paginator.pageSize : Constants.DEFAULT_PAGE_SIZE;
    await this.dataSource.loadData(ApiUrlEnum.DIET_TEMPLATE_LIST, this.payload);
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
      new: true
    };
    const dialogRef = this.dialog.open(DietTemplateManageDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true
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
      dietTemplateId: id
    };
    const dialogRef = this.dialog.open(DietTemplateManageDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
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
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
      if (result) {
        this.updateStatusTask(item, index);
      }
    });
  }

  async updateStatusTask(item: DietTemplateModel, index: number): Promise<void> {
    const payload = {
      active: !item.active
    };

    const res: ResponseDataModel = await this.httpService.patchRequest(ApiUrlEnum.DIET_TEMPLATE_STATUS_CHANGE, item.id, payload, true);
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
