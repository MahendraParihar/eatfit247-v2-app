import {Component, Inject, OnInit} from '@angular/core';
import {StringResources} from "../../../enum/string-resources";
import {InputLength} from "../../../constants/input-length";
import {StatusList} from "../../../constants/status-list";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {HttpService} from "../../../service/http.service";
import {SnackBarService} from "../../../service/snack-bar.service";
import {ValidationUtil} from "../../../utilites/validation-util";
import {ResponseDataModel} from "../../../models/response-data.model";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {DietTemplateModel} from "../../../models/diet-template.model";

@Component({
  selector: 'app-diet-template-manage-dialog',
  templateUrl: './diet-template-manage-dialog.component.html',
  styleUrls: ['./diet-template-manage-dialog.component.scss']
})
export class DietTemplateManageDialogComponent implements OnInit {
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  statusList = StatusList;
  dialogData: any;
  dietTemplateObj: DietTemplateModel;

  formGroup: FormGroup = this.fb.group({
    name: [null, [Validators.required, Validators.maxLength(InputLength.CHAR_100)]],
    noOfCycle: [null, [Validators.required, Validators.min(1), Validators.maxLength(64)]],
    noOfDaysInCycle: [null, [Validators.required, Validators.min(1), Validators.maxLength(364)]],
    isWeekly: [null, [Validators.required]],
    active: [true, [Validators.required]]
  });

  constructor(public dialogRef: MatDialogRef<DietTemplateManageDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private fb: FormBuilder,
              private httpService: HttpService,
              private snackBarService: SnackBarService) {
    this.dialogData = data;
    if (!this.dialogData.new) {
      this.id = this.dialogData.dietTemplateId;
    }
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
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
    if (this.dietTemplateObj) {
      this.formGroup.patchValue({
        name: this.dietTemplateObj.title,
        noOfCycle: this.dietTemplateObj.noOfCycle,
        noOfDaysInCycle: this.dietTemplateObj.noOfDaysInCycle,
        isWeekly: this.dietTemplateObj.isWeekly,
        active: this.dietTemplateObj.active
      });
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }

    let payload: any = this.formGroup.value;

    let res: ResponseDataModel;
    if (!this.dialogData.new) {
      res = await this.httpService.putRequest(ApiUrlEnum.DIET_TEMPLATE_MANAGE, this.dietTemplateObj.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.DIET_TEMPLATE_MANAGE, payload, true);
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
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.DIET_TEMPLATE_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.dietTemplateObj = DietTemplateModel.fromJson(res.data);
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
