import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import * as moment from 'moment';
import { Constants } from '../../../constants/Constants';
import { ValidationUtil } from '../../../utilites/validation-util';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { MemberHealthParameter, MemberHealthParameterModelLog } from '../../../models/member-body-stats.model';
import { FieldTypeEnum } from '../../../enum/field-type-enum';

@Component({
  selector: 'app-member-body-stats-manage-dialog',
  templateUrl: './member-body-stats-manage-dialog.component.html',
  styleUrls: ['./member-body-stats-manage-dialog.component.scss'],
})
export class MemberBodyStatsManageDialogComponent implements OnInit {
  memberId: number;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  dialogData: any;
  memberHealthLogObj: MemberHealthParameterModelLog;
  fieldTypeEnum = FieldTypeEnum;
  formGroup: FormGroup = this.fb.group({
    logDate: [null, [Validators.required]],
    bodyStats: this.fb.array([]),
  });
  currentDate = new Date();
  minDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 2, this.currentDate.getDay() + 1);

  constructor(public dialogRef: MatDialogRef<MemberBodyStatsManageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private httpService: HttpService,
    private snackBarService: SnackBarService) {
    this.dialogData = data;
    this.memberId = data.memberId;
    if (!this.dialogData.new) {
      this.id = this.dialogData.memberHealthLogId;
    }
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    if (this.id) {
      await this.loadDataById(this.id);
    } else {
      await this.loadMetaData();
    }
  }

  // region body stats item
  healthParameterArray(): FormArray {
    return this.formGroup.get('bodyStats') as FormArray;
  }

  newHealthParameter(healthParameterObj: MemberHealthParameter): FormGroup {
    return this.fb.group({
      healthParameterId: [healthParameterObj.healthParameterId, [Validators.required]],
      value: [healthParameterObj.inputValue ? healthParameterObj.inputValue : null, healthParameterObj.requiredField ? [Validators.required] : []],
      healthParameterUnitId: [healthParameterObj.healthParameterUnitId ? healthParameterObj.healthParameterUnitId : null, []],
    });
  }

  addHealthParameter(healthParameterObj: MemberHealthParameter): void {
    this.healthParameterArray().push(this.newHealthParameter(healthParameterObj));
  }

  removeAgenda(i: number): void {
    this.healthParameterArray().removeAt(i);
  }

  // endregion
  onPositiveClick(): void {
    this.closeDialog(true);
  }

  onNegativeClick(): void {
    this.closeDialog(false);
  }

  closeDialog(flag: boolean) {
    this.dialogRef.close(flag);
  }

  bindData(): void {
    if (this.memberHealthLogObj) {
      this.formGroup.patchValue({
        logDate: this.memberHealthLogObj.logDate ? this.memberHealthLogObj.logDate : null,
      });
      if (this.memberHealthLogObj.memberHealthParameters && this.memberHealthLogObj.memberHealthParameters.length > 0) {
        for (const s of this.memberHealthLogObj.memberHealthParameters) {
          this.addHealthParameter(s);
        }
      }
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    if (this.formGroup.value.date) {
      payload['logDate'] = moment(this.formGroup.value.logDate).toDate();
    }
    payload['memberId'] = this.memberId;
    const bodyStats = [];
    for (const s of payload.bodyStats) {
      if (s.value) {
        bodyStats.push(s);
      }
    }
    payload['bodyStats'] = bodyStats;
    let res: ResponseDataModel;
    if (!this.dialogData.new) {
      res = await this.httpService.putRequest(ApiUrlEnum.MEMBER_BODY_STATS_MANAGE, this.memberHealthLogObj.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_BODY_STATS_MANAGE + '/' + this.memberId, payload, true);
    }
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          this.onPositiveClick();
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

  async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_BODY_STATS_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.memberHealthLogObj = MemberHealthParameterModelLog.fromJson(res.data);
          this.bindData();
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

  async loadMetaData(): Promise<void> {
    this.memberHealthLogObj = new MemberHealthParameterModelLog();
    this.memberHealthLogObj.logDate = moment().format(Constants.APP_DATE_FORMATS.parse.dateInput);
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_BODY_STATS_MASTER_DATA, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.memberHealthLogObj.memberHealthParameters = [];
          for (const s of res.data) {
            this.memberHealthLogObj.memberHealthParameters.push(MemberHealthParameter.fromJson(s));
          }
          this.bindData();
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
