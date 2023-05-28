import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { FormBuilder } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { MemberPaymentDatasource } from '../member-payment.datasource';
import { MemberPaymentModel } from '../../../models/member-payment.model';
import {
  MemberPaymentManageDialogComponent,
} from '../member-payment-manage-dialog/member-payment-manage-dialog.component';
import {
  MemberPaymentInvoiceDialogComponent,
} from '../member-payment-invoice-dialog/member-payment-invoice-dialog.component';

@Component({
  selector: 'app-member-payment-history',
  templateUrl: './member-payment-history.component.html',
  styleUrls: ['./member-payment-history.component.scss'],
})
export class MemberPaymentHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'plan', 'dateTime', 'paymentStatus', 'paymentMode', 'amount', 'updatedBy', 'action'];
  dataSource: MemberPaymentDatasource;
  totalCount = 0;
  id: number;
  stringRes = StringResources;

  constructor(private fb: FormBuilder,
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog) {
    this.activatedRoute.parent.params.subscribe(params => {
      this.id = Number(params['id']);
    });
    this.dataSource = new MemberPaymentDatasource(this.httpService, this.snackBarService);
    this.dataSource.totalCount.subscribe((count: number) => this.totalCount = count);
  }

  async ngOnInit(): Promise<void> {
    await this.loadDataSet();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy(): void {
    // this.dataSource = null;
  }

  async loadDataSet(): Promise<void> {
    await this.dataSource.loadData(ApiUrlEnum.MEMBER_PAYMENT, this.id);
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
      memberCallLogId: id,
    };
    const dialogRef = this.dialog.open(MemberPaymentManageDialogComponent, {
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
    // this.navigationService.navigateToById(NavigationPathEnum.MEMBER_CALL_SCHEDULE, id);
  }

  onViewClick(id: number) {
    const dialogData = {
      new: false,
      memberId: this.id,
      memberCallLogId: id,
    };
    const dialogRef = this.dialog.open(MemberPaymentInvoiceDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true,
    });
    // dialogRef.afterClosed().subscribe(result => {
    //   console.log('The dialog was closed', JSON.stringify(result));
    //   if (result) {
    //   }
    // });
  }

  onDeleteClick(item: MemberPaymentModel, index: number) {
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

  async updateStatusTask(item: MemberPaymentModel, index: number): Promise<void> {
    const payload = {
      active: !item.active,
    };
    const res: ResponseDataModel = await this.httpService.patchRequest(ApiUrlEnum.MEMBER_PAYMENT_UPDATE_STATUS, item.id, payload, true);
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
