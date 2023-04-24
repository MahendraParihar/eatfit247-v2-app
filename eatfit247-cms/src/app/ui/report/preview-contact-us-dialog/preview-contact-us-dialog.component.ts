import {Component, Inject, OnInit} from '@angular/core';
import {StringResources} from "../../../enum/string-resources";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ContactUsModel} from "../../../models/contact-us.model";
import {InputLength} from "../../../constants/input-length";
import {FormBuilder, Validators} from "@angular/forms";
import {ValidationUtil} from "../../../utilites/validation-util";

@Component({
  selector: 'app-preview-contact-us-dialog',
  templateUrl: './preview-contact-us-dialog.component.html',
  styleUrls: ['./preview-contact-us-dialog.component.scss']
})
export class PreviewContactUsDialogComponent implements OnInit {

  dialogData: ContactUsModel;
  stringRes = StringResources;
  inputLength = InputLength;

  formGroup = this.fb.group({
    respondedMessage: [null, [Validators.required, Validators.maxLength(this.inputLength.CHAR_1000)]],
  });

  constructor(public dialogRef: MatDialogRef<PreviewContactUsDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ContactUsModel,
              public fb: FormBuilder) {
    this.dialogData = data;
  }

  get formControl() {
    return this.formGroup.controls;
  }

  ngOnInit(): void {
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
