import { AfterViewInit, Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import {
  MemberPaymentManageDialogComponent,
} from '../member-payment-manage-dialog/member-payment-manage-dialog.component';
import {
  MemberPaymentInvoiceDialogComponent,
} from '../member-payment-invoice-dialog/member-payment-invoice-dialog.component';
import { TableDataDatasource } from 'src/app/ui/table-data.datasource';
import { IMemberPayment, IResponse, ITableListFilter } from 'shared-lib';
import { Constants } from '../../../constants/Constants';
import { MatPaginator } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-member-payment-history',
  templateUrl: './member-payment-history.component.html',
  styleUrls: ['./member-payment-history.component.scss'],
})
export class MemberPaymentHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'plan', 'dateTime', 'paymentStatus', 'paymentMode', 'amount', 'updatedBy', 'action'];
  dataSource: TableDataDatasource<IMemberPayment>;
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
    private renderer: Renderer2,
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
  }

  ngOnDestroy(): void {
    this.dataSource = null;
  }

  async loadDataSet(): Promise<void> {
    this.payload.page = this.paginator ? this.paginator.pageIndex : 0;
    this.payload.limit = this.paginator ? this.paginator.pageSize : Constants.DEFAULT_PAGE_SIZE;
    await this.dataSource.loadData(ApiUrlEnum.MEMBER_PAYMENT, this.payload);
  }

  onAddClick() {
    const dialogData = {
      new: true,
      memberId: this.id,
    };
    const dialogRef = this.dialog.open(MemberPaymentManageDialogComponent, {
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
    const dialogRef = this.dialog.open(MemberPaymentManageDialogComponent, {
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

  onViewClick(id: number) {
    const dialogData = {
      new: false,
      memberId: this.id,
      memberPaymentId: id,
    };
    const dialogRef = this.dialog.open(MemberPaymentInvoiceDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true,
    });
  }

  onDeleteClick(item: IMemberPayment, index: number) {
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

  async updateStatusTask(item: IMemberPayment, index: number): Promise<void> {
    const payload = {
      active: !item.active
    };
    const res = await this.httpService.patchRequest(ApiUrlEnum.MEMBER_PAYMENT_UPDATE_STATUS, item.id, payload, true);
    this.snackBarService.showSuccess('Status changed successfully');
    await this.loadDataSet();
  }

  async downloadInvoice(paymentId: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<any>>(ApiUrlEnum.MEMBER_PAYMENT_INVOICE_DOWNLOAD, paymentId, null, true);
    if (res && res.data) {
      this.downloadTemplate(res.data.buffer, res.data.fileName);
    }
  }

  downloadTemplate(base64String: string, fileName: string) {
    if (base64String) {
      const mediaType = 'data:application/pdf;base64,';
      const link = this.renderer.createElement('a');
      link.setAttribute('target', '_blank');
      link.setAttribute('href', mediaType + base64String);
      link.setAttribute('download', `${fileName}`);
      link.click();
      link.remove();
    }
  }
}
