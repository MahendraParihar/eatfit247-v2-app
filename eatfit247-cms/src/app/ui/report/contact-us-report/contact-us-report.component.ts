import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { Constants } from '../../../constants/Constants';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import { PreviewContactUsDialogComponent } from '../preview-contact-us-dialog/preview-contact-us-dialog.component';
import { TableDataDatasource } from 'src/app/ui/table-data.datasource';
import { IContactUs, ITableListFilter } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-contact-us-report',
  templateUrl: './contact-us-report.component.html',
  styleUrls: ['./contact-us-report.component.scss']
})
export class ContactUsReportComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'name', 'emailId', 'contactNo', 'status', 'respondedBy', 'createdAt', 'updatedAt', 'action'];
  dataSource: TableDataDatasource<IContactUs>;
  totalCount = 0;
  stringRes = StringResources;
  defaultPageSize = Constants.DEFAULT_PAGE_SIZE;
  pageSizeList = Constants.PAGE_SIZE_LIST;
  payload: ITableListFilter = {
    page: this.pageSizeList[0],
    limit: this.defaultPageSize
  };
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
    await this.dataSource.loadData(ApiUrlEnum.CONTACT_US_LIST, this.payload);
  }

  async searchResult(payload: ITableListFilter): Promise<void> {
    this.payload.search = payload.search;
    this.payload.createdTo = payload.createdTo;
    this.payload.createdFrom = payload.createdFrom;
    this.payload.name = payload.name;
    this.paginator.firstPage();
    await this.loadDataSet();
  }

  /*onAddClick() {
    this.navigationService.navigateTo(NavigationPathEnum.PROGRAM_PLAN_MANAGE);
  }*/
  onEditClick(item: IContactUs, index: number) {
    const dialogRef = this.dialog.open(PreviewContactUsDialogComponent, {
      data: item,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sendResponseTask(item, result, index);
      }
    });
  }

  async onSendResponseMailClick(item: IContactUs, index: number): Promise<void> {
    const res = await this.httpService.getRequest(ApiUrlEnum.CONTACT_US_SEND_MAIL, item.id, null, true);
    if (res) {
      this.snackBarService.showSuccess('Email sent successfully');
    }
  }

  onDeleteClick(item: IContactUs, index: number) {
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

  async updateStatusTask(item: IContactUs, index: number): Promise<void> {
    const payload = {
      active: !item.active
    };
    const res = await this.httpService.patchRequest(ApiUrlEnum.CONTACT_US_STATUS_CHANGE, item.id, payload, true);
    if (res) {
      this.snackBarService.showSuccess('Status changed successfully');
      await this.loadDataSet();
    }
  }

  async sendResponseTask(item: IContactUs, formData: any, index: number): Promise<void> {
    const res = await this.httpService.putRequest(ApiUrlEnum.CONTACT_US_SEND_RESPONSE, item.id, formData, true);
    if (res) {
      this.snackBarService.showSuccess('Respond sent successfully');
      await this.loadDataSet();
    }
  }
}
