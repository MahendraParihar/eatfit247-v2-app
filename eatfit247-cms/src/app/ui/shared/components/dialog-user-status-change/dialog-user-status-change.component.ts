import {Component, Inject, OnInit} from '@angular/core';
import {AlertDialogDataInterface} from "../../../../interfaces/alert-dialog-data.interface";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, Validators} from "@angular/forms";
import {InputLength} from "../../../../constants/input-length";
import {StringResources} from "../../../../enum/string-resources";
import {AdminUserStatusEnum} from "../../../../enum/admin-user-status-enum";
import {MatSelectChange} from "@angular/material/select";
import {ValidationUtil} from "../../../../utilites/validation-util";

@Component({
  selector: 'app-dialog-user-status-change',
  templateUrl: './dialog-user-status-change.component.html',
  styleUrls: ['./dialog-user-status-change.component.scss']
})
export class DialogUserStatusChangeComponent implements OnInit {

  dialogData: AlertDialogDataInterface;
  inputLength = InputLength;
  stringRes = StringResources;
  adminUserStatusEnum = AdminUserStatusEnum;
  formGroup = this.fb.group({
    reason: [null, [Validators.required, Validators.maxLength(this.inputLength.CHAR_1000)]],
    statusId: [null, [Validators.required]]
  });

  constructor(public fb: FormBuilder,
              public dialogRef: MatDialogRef<DialogUserStatusChangeComponent>,
              @Inject(MAT_DIALOG_DATA) public data: AlertDialogDataInterface) {
    this.dialogData = data;
  }

  get formControl() {
    return this.formGroup.controls;
  }

  ngOnInit(): void {
  }

  onStatusChange(event: MatSelectChange): void {
    /*switch (event.value) {
      case this.adminUserStatusEnum.ACTIVE:
        this.formGroup.get('reason').setValidators([Validators.required]);
        this.formGroup.get('reason').updateValueAndValidity();
        break;
      case this.adminUserStatusEnum.IN_ACTIVE:
        this.formGroup.get('reason').setValidators([Validators.required]);
        this.formGroup.get('reason').updateValueAndValidity();
        break;
      case this.adminUserStatusEnum.VERIFICATION_PENDING:
        this.formGroup.get('reason').setValidators([Validators.required]);
        this.formGroup.get('reason').updateValueAndValidity();
        break;
    }*/
  }

  onPositiveClick(): void {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    this.closeDialog(this.formGroup.value);
  }

  onNegativeClick(): void {
    this.closeDialog(null);
  }

  closeDialog(formValue: any) {
    this.dialogRef.close(formValue);
  }

}
