import {Component, Inject, OnInit, Renderer2} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ApiUrlEnum} from 'src/app/enum/api-url-enum';
import {ServerResponseEnum} from 'src/app/enum/server-response-enum';
import {StringResources} from 'src/app/enum/string-resources';
import {MemberPaymentModel} from 'src/app/models/member-payment.model';
import {ResponseDataModel} from 'src/app/models/response-data.model';
import {HttpService} from 'src/app/service/http.service';
import {SnackBarService} from 'src/app/service/snack-bar.service';
import { AddressModel } from '../../../models/address.model';
import { CommonUtil } from '../../../utilites/common-util';

@Component({
  selector: 'app-member-payment-invoice-dialog',
  templateUrl: './member-payment-invoice-dialog.component.html',
  styleUrls: ['./member-payment-invoice-dialog.component.scss']
})
export class MemberPaymentInvoiceDialogComponent implements OnInit {

  memberId: number;
  id: number;
  stringRes = StringResources;
  dialogData: any;
  memberPaymentObj: MemberPaymentModel;

  constructor(public dialogRef: MatDialogRef<MemberPaymentInvoiceDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private renderer: Renderer2,
              private httpService: HttpService,
              private snackBarService: SnackBarService) {
    this.dialogData = data;
    this.memberId = data.memberId;
    this.id = this.dialogData.memberCallLogId;
  }

  ngOnInit(): void {
    this.loadDataById();
  }

  onClose(): void {
    this.closeDialog(false);
  }

  closeDialog(flag: boolean) {
    this.dialogRef.close(flag);
  }

  getAddress(address: AddressModel):string{
    return CommonUtil.convertAddressObj(address);
  }

  async downloadInvoice(): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_PAYMENT_INVOICE_DOWNLOAD, this.id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          if (res.data) {
            this.downloadTemplate(res.data.buffer, res.data.fileName);
          }
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

  downloadTemplate(base64String: string, fileName:string) {
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

  async sendInvoice(): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_PAYMENT_INVOICE_SEND, this.id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
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

  private async loadDataById(): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_PAYMENT_MANAGE, this.id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.memberPaymentObj = MemberPaymentModel.fromJson(res.data);
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
