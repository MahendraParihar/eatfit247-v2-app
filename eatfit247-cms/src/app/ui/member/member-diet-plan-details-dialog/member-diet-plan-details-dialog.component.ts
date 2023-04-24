import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ApiUrlEnum} from 'src/app/enum/api-url-enum';
import {ServerResponseEnum} from 'src/app/enum/server-response-enum';
import {HttpService} from 'src/app/service/http.service';
import {SnackBarService} from 'src/app/service/snack-bar.service';
import {StringResources} from '../../../enum/string-resources';

@Component({
  selector: 'app-member-diet-plan-details-dialog',
  templateUrl: './member-diet-plan-details-dialog.component.html',
  styleUrls: ['./member-diet-plan-details-dialog.component.scss']
})
export class MemberDietPlanDetailsDialogComponent implements OnInit {

  dietPlanDetail: any;
  stringRes = StringResources;
  displayColumns = ['category', 'detail', 'recipes'];
  id: number;

  constructor(public dialogRef: MatDialogRef<MemberDietPlanDetailsDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private httpService: HttpService,
              private snackBarService: SnackBarService,) {
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
    const res = await this.httpService.getRequest(ApiUrlEnum.MEMBER_DIET_PLAN_DOWNLOAD + `/${this.id}/${this.dietPlanDetail.dietPlanId}/${this.dietPlanDetail.cycleNo}/${this.dietPlanDetail.dayNo}`, null, null, true);

    if (!res) {
      return false;
    }
    switch (res.code) {
      case ServerResponseEnum.SUCCESS:
        if (res.data) {
          await this.httpService.downloadFile(res.data.filePath, res.data.fileName);
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

  async sendEmail(): Promise<boolean> {
    const apiResponse = await this.httpService.getRequest(ApiUrlEnum.MEMBER_DIET_PLAN_SEND_EMAIL + `/${this.id}/${this.dietPlanDetail.dietPlanId}/${this.dietPlanDetail.cycleNo}/${this.dietPlanDetail.dayNo}`, null, null, true);

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
