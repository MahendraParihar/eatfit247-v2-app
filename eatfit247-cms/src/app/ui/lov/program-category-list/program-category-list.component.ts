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
import { ILov, ITableListFilter } from 'shared-lib';
@Component({
  standalone: false,
  selector: 'app-program-category-list',
  templateUrl: './program-category-list.component.html',
  styleUrls: ['./program-category-list.component.scss'],
})
export class ProgramCategoryListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'title', 'status', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt', 'action'];
  dataSource: TableDataDatasource<ILov>;
  totalCount = 0;
  stringRes = StringResources;
  defaultPageSize = Constants.MASTER_PAGE_SIZE;
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
    if(this.paginator) {
      this.paginator.page
        .pipe(
          tap(() => this.loadDataSet()),
        )
        .subscribe();
    }
  }

  ngOnDestroy(): void {
    this.dataSource = null;
  }

  async loadDataSet(): Promise<void> {
    this.payload.page = this.paginator ? this.paginator.pageIndex : 0;
    this.payload.limit = this.paginator ? this.paginator.pageSize : Constants.MASTER_PAGE_SIZE;
    await this.dataSource.loadData(ApiUrlEnum.PROGRAM_CATEGORY_LIST, this.payload);
  }

  onAddClick() {
    this.navigationService.navigateTo(NavigationPathEnum.PROGRAM_CATEGORY_MANAGE);
  }

  onEditClick(id: number) {
    this.navigationService.navigateToById(NavigationPathEnum.PROGRAM_CATEGORY_MANAGE, id);
  }

  onDeleteClick(item: ILov, index: number) {
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

      if (result) {
        this.updateStatusTask(item, index);
      }
    });
  }

  async updateStatusTask(item: ILov, index: number): Promise<void> {
    const payload = {
      active: !item.active
    };
    const res = await this.httpService.patchRequest(ApiUrlEnum.PROGRAM_CATEGORY_STATUS_CHANGE, item.id, payload, true);
    this.snackBarService.showSuccess('Status changed successfully');
    await this.loadDataSet();
  }
}
