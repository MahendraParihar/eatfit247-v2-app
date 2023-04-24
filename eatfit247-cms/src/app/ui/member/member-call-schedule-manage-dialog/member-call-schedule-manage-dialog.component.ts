import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ResponseDataModel} from "../../../models/response-data.model";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {DropdownItem} from "../../../interfaces/dropdown-item";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpService} from "../../../service/http.service";
import {SnackBarService} from "../../../service/snack-bar.service";
import {StringResources} from "../../../enum/string-resources";
import {InputLength} from "../../../constants/input-length";
import {StatusList} from "../../../constants/status-list";
import {MemberCallLogModel} from "../../../models/member-call-log.model";
import {ValidationUtil} from "../../../utilites/validation-util";
import * as moment from "moment/moment";
import {Constants} from "../../../constants/Constants";

@Component({
  selector: 'app-member-call-schedule-manage-dialog',
  templateUrl: './member-call-schedule-manage-dialog.component.html',
  styleUrls: ['./member-call-schedule-manage-dialog.component.scss']
})
export class MemberCallScheduleManageDialogComponent implements OnInit {
  memberId: number;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  statusList = StatusList;
  dialogData: any;
  callTypeList: DropdownItem[];
  callPurposeList: DropdownItem[];
  callStatusList: DropdownItem[];
  callLogObj: MemberCallLogModel;

  formGroup: FormGroup = this.fb.group({
    callTypeId: [null, [Validators.required]],
    callPurposeId: [null, [Validators.required]],
    callStatusId: [null, [Validators.required]],
    detail: [null, [Validators.maxLength(this.inputLength.CHAR_200)]],
    conversionHistory: [null, [Validators.maxLength(this.inputLength.CHAR_200)]],
    date: [null, [Validators.maxLength(this.inputLength.CHAR_200)]],
    startTime: [null, [Validators.maxLength(this.inputLength.CHAR_200)]],
    endTime: [null, [Validators.maxLength(this.inputLength.CHAR_200)]],
    active: [true, [Validators.required]]
  });

  constructor(public dialogRef: MatDialogRef<MemberCallScheduleManageDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private fb: FormBuilder,
              private httpService: HttpService,
              private snackBarService: SnackBarService) {
    this.dialogData = data;
    this.memberId = data.memberId;
    if (!this.dialogData.new) {
      this.id = this.dialogData.memberCallLogId;
    }
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMetaData();
    if (this.id) {
      await this.loadDataById(this.id);
    }
  }

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
    if (this.callLogObj) {
      this.formGroup.patchValue({
        callTypeId: this.callLogObj.callTypeId,
        callPurposeId: this.callLogObj.callPurposeId,
        callStatusId: this.callLogObj.callLogStatusId,
        detail: this.callLogObj.detail,
        conversionHistory: this.callLogObj.conversionHistory,
        date: this.callLogObj.date,
        startTime: this.callLogObj.startTime ? moment(this.callLogObj.startTime, Constants.DEFAULT_TIME_FORMAT).format(Constants.DISPLAY_TIME_FORMAT) : null,
        endTime: this.callLogObj.endTime ? moment(this.callLogObj.endTime, Constants.DEFAULT_TIME_FORMAT).format(Constants.DISPLAY_TIME_FORMAT) : null,
        active: this.callLogObj.active
      });
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }

    let payload: any = this.formGroup.value;
    if (this.formGroup.value.date) {
      payload['date'] = moment(this.formGroup.value.date).toDate()
    }
    if (this.formGroup.value.startTime) {
      payload['startTime'] = moment(this.formGroup.value.startTime, Constants.DISPLAY_TIME_FORMAT).format(Constants.DEFAULT_TIME_FORMAT);
    }
    if (this.formGroup.value.endTime) {
      payload['endTime'] = moment(this.formGroup.value.endTime, Constants.DISPLAY_TIME_FORMAT).format(Constants.DEFAULT_TIME_FORMAT);
    }
    payload['memberId'] = this.memberId;
    let res: ResponseDataModel;
    if (!this.dialogData.new) {
      res = await this.httpService.putRequest(ApiUrlEnum.MEMBER_CALL_LOG_MANAGE, this.callLogObj.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_CALL_LOG_MANAGE + '/' + this.memberId, payload, true);
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
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_CALL_LOG_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.callLogObj = MemberCallLogModel.fromJson(res.data);
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
    this.callTypeList = [];
    this.callPurposeList = [];
    this.callStatusList = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_CALL_LOG_MASTER_DATA, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          for (const s of res.data.callType) {
            this.callTypeList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.callPurpose) {
            this.callPurposeList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.callStatus) {
            this.callStatusList.push(DropdownItem.fromJson(s));
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

}
