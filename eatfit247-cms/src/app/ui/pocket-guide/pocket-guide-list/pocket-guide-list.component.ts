import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { StringResources } from "../../../enum/string-resources";
import { Constants } from "../../../constants/Constants";
import { MatPaginator } from "@angular/material/paginator";
import { FormBuilder } from "@angular/forms";
import { HttpService } from "../../../service/http.service";
import { SnackBarService } from "../../../service/snack-bar.service";
import { NavigationService } from "../../../service/navigation.service";
import { MatDialog } from "@angular/material/dialog";
import { tap } from "rxjs";
import { ApiUrlEnum } from "../../../enum/api-url-enum";
import { NavigationPathEnum } from "../../../enum/navigation-path-enum";
import { AlertDialogDataInterface } from "../../../interfaces/alert-dialog-data.interface";
import { AlertTypeEnum } from "../../../enum/alert-type-enum";
import { DialogAlertComponent } from "../../shared/components/dialog-alert/dialog-alert.component";
import { TableDataDatasource } from 'src/app/ui/table-data.datasource';
import { IPocketGuide, ITableListFilter } from 'shared-lib';


@Component({
  standalone: false,
  selector: "app-pocket-guide-list",
  templateUrl: "./pocket-guide-list.component.html",
  styleUrls: ["./pocket-guide-list.component.scss"]
})
export class PocketGuideListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ["seqNo", "imagePath", "title", "file", "status", "createdBy", "createdAt", "updatedBy", "updatedAt", "action"];
  dataSource: TableDataDatasource<IPocketGuide>;
  totalCount = 0;
  stringRes = StringResources;
  defaultPageSize = Constants.MASTER_PAGE_SIZE;
  pageSizeList = Constants.PAGE_SIZE_LIST;
  payload: ITableListFilter = {
    page: this.pageSizeList[0],
    limit: this.defaultPageSize
  };
  baseUrl = ApiUrlEnum.MEDIA_PATH;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private fb: FormBuilder,
    private httpService: HttpService,
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
    if(this.paginator) {
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
    await this.dataSource.loadData(ApiUrlEnum.POCKET_GUIDE_LIST, this.payload);
  }

  onAddClick() {
    this.navigationService.navigateTo(NavigationPathEnum.POCKET_GUIDES_MANAGE);
  }

  onEditClick(id: number) {
    this.navigationService.navigateToById(NavigationPathEnum.POCKET_GUIDES_MANAGE, id);
  }

  onDeleteClick(item: IPocketGuide, index: number) {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.ALERT,
      message: StringResources.CHANGE_STATUS_DESC,
      positiveBtnTxt: StringResources.YES,
      negativeBtnTxt: StringResources.NO,
      alertType: AlertTypeEnum.WARNING
    };
    const dialogRef = this.dialog.open(DialogAlertComponent, {
      width: "350px",
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateStatusTask(item, index);
      }
    });
  }

  async updateStatusTask(item: IPocketGuide, index: number): Promise<void> {
    const payload = {
      active: !item.active
    };
    const res = await this.httpService.patchRequest(ApiUrlEnum.POCKET_GUIDE_STATUS_CHANGE, item.id, payload, true);
    if (res) {
      this.snackBarService.showSuccess('Status changed successfully');
      await this.loadDataSet();
    }
  }

  async downloadFile(obj: IPocketGuide) {
    if (obj.filePath && obj.filePath.length > 0) {
      await this.httpService.downloadFile(`${ApiUrlEnum.MEDIA_PATH}${obj.filePath[0].webUrl}`, obj.name, true);
    }
  }
}
