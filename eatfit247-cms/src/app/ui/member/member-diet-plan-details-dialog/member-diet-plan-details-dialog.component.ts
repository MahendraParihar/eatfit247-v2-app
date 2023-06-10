import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiUrlEnum } from 'src/app/enum/api-url-enum';
import { ServerResponseEnum } from 'src/app/enum/server-response-enum';
import { HttpService } from 'src/app/service/http.service';
import { SnackBarService } from 'src/app/service/snack-bar.service';
import { StringResources } from '../../../enum/string-resources';

@Component({
  selector: 'app-member-diet-plan-details-dialog',
  templateUrl: './member-diet-plan-details-dialog.component.html',
  styleUrls: ['./member-diet-plan-details-dialog.component.scss'],
})
export class MemberDietPlanDetailsDialogComponent implements OnInit {
  dietPlanDetail: any;
  stringRes = StringResources;
  displayColumns = ['category', 'detail', 'recipes'];
  id: number;

  constructor(public dialogRef: MatDialogRef<MemberDietPlanDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private renderer: Renderer2,
    private httpService: HttpService,
    private snackBarService: SnackBarService) {
    this.dietPlanDetail = data.dietPlanDetails;
    this.id = data.id;
  }

  ngOnInit(): void {
  }

  onClose(): void {
    this.closeDialog(false);
  }

  closeDialog(flag: boolean) {
    this.dialogRef.close(flag);
  }

  async downloadDietPlan(): Promise<boolean> {
    let url;
    if (this.dietPlanDetail.dayNo) {
      url = ApiUrlEnum.MEMBER_DIET_PLAN_DOWNLOAD_DAY + `/${this.id}/${this.dietPlanDetail.dietPlanId}/${this.dietPlanDetail.cycleNo}/${this.dietPlanDetail.dayNo}`;
    } else {
      url = ApiUrlEnum.MEMBER_DIET_PLAN_DOWNLOAD_CYCLE + `/${this.id}/${this.dietPlanDetail.dietPlanId}/${this.dietPlanDetail.cycleNo}`;
    }
    const res = await this.httpService.getRequest(url, null, null, true);
    if (!res) {
      return false;
    }
    switch (res.code) {
      case ServerResponseEnum.SUCCESS:
        if (res.data) {
          this.downloadTemplate(res.data.buffer, res.data.fileName);
        }
        return true;
      case ServerResponseEnum.WARNING:
        this.snackBarService.showWarning(res.message);
        return false;
      case ServerResponseEnum.ERROR:
      default:
        this.snackBarService.showError(res.message);
        return false;
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

  async sendEmail(): Promise<boolean> {
    let url;
    if (this.dietPlanDetail.dayNo) {
      url = `${ApiUrlEnum.MEMBER_DIET_PLAN_SEND_EMAIL_DAY}/${this.id}/${this.dietPlanDetail.dietPlanId}/${this.dietPlanDetail.cycleNo}/${this.dietPlanDetail.dayNo}`;
    } else {
      url = `${ApiUrlEnum.MEMBER_DIET_PLAN_SEND_EMAIL_CYCLE}/${this.id}/${this.dietPlanDetail.dietPlanId}/${this.dietPlanDetail.cycleNo}`;
    }
    const apiResponse = await this.httpService.getRequest(url, null, null, true);
    if (!apiResponse) {
      return false;
    }
    switch (apiResponse.code) {
      case ServerResponseEnum.SUCCESS:
        this.snackBarService.showSuccess(apiResponse.message);
        return true;
      case ServerResponseEnum.WARNING:
        this.snackBarService.showWarning(apiResponse.message);
        return false;
      case ServerResponseEnum.ERROR:
      default:
        this.snackBarService.showError(apiResponse.message);
        return false;
    }
  }
}
