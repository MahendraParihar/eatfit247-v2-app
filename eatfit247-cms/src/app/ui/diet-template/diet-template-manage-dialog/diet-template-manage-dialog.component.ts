import { Component, inject, Inject, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { StatusList } from '../../../constants/status-list';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { ValidationUtil } from '../../../utilites/validation-util';
import { ApiUrlEnum } from '../../../enum/api-url-enum';

@Component({
  standalone: false,
  selector: 'app-diet-template-manage-dialog',
  templateUrl: './diet-template-manage-dialog.component.html',
  styleUrls: ['./diet-template-manage-dialog.component.scss']
})
export class DietTemplateManageDialogComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
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
    if (!this.dialogData.new) {
      await this.httpService.putRequest(ApiUrlEnum.DIET_TEMPLATE_MANAGE, this.dietTemplateObj.id, payload, true);
    } else {
      await this.httpService.postRequest(ApiUrlEnum.DIET_TEMPLATE_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }

  async loadDataById(id: number): Promise<void> {
    const res = await this.httpService.getRequest(ApiUrlEnum.DIET_TEMPLATE_MANAGE, id, null, true);
    if (res) {
      this.dietTemplateObj = DietTemplateModel.fromJson(res.data);
      this.bindData();
    }
  }
}
