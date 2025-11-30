import { Component, inject, Inject, OnInit } from '@angular/core';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { ErrorHandlerService } from '../../../service/error-handler.service';
import { InputLength } from '../../../constants/input-length';
import { StringResources } from '../../../enum/string-resources';
import { ValidationUtil } from '../../../utilites/validation-util';
import { AESCryptoUtil } from '../../../utilites/crypto-aes';

@Component({
  standalone: false,
  selector: 'app-dialog-forgot-password',
  templateUrl: './dialog-forgot-password.component.html',
  styleUrls: ['./dialog-forgot-password.component.scss']
})
export class DialogForgotPasswordComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  stringRes = StringResources;
  dialogData: AlertDialogDataInterface;
  formGroup: UntypedFormGroup = this.fb.group({
    emailId: ['', [Validators.required, Validators.email, Validators.maxLength(InputLength.MAX_EMAIL)]]
  });

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private errorHandlerService: ErrorHandlerService,
    public dialogRef: MatDialogRef<DialogForgotPasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogDataInterface) {
    this.dialogData = data;
  }

  get formControl() {
    return this.formGroup.controls;
  }

  ngOnInit(): void {
  }

  onNegativeClick(): void {
    this.dialogRef.close(null);
  }

  async forgotPasswordTask(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    const payload = {
      emailId: AESCryptoUtil.encryptUsingAES256(this.formGroup.value.emailId)
    };
    const res = await this.httpService.postRequest(ApiUrlEnum.SEND_FORGOT_PASSWORD_OTP, payload, true);
    if (res) {
      const temp = {
        emailId: this.formGroup.value.emailId
      };
      this.dialogRef.close(temp);
    }
  }
}
