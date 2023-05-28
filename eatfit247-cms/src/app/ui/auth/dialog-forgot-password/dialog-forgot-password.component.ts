import { Component, Inject, OnInit } from '@angular/core';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ResponseDataModel } from '../../../models/response-data.model';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { ErrorHandlerService } from '../../../service/error-handler.service';
import { InputLength } from '../../../constants/input-length';
import { StringResources } from '../../../enum/string-resources';
import { ValidationUtil } from '../../../utilites/validation-util';
import { AESCryptoUtil } from '../../../utilites/crypto-aes';

@Component({
  selector: 'app-dialog-forgot-password',
  templateUrl: './dialog-forgot-password.component.html',
  styleUrls: ['./dialog-forgot-password.component.scss'],
})
export class DialogForgotPasswordComponent implements OnInit {
  stringRes = StringResources;
  dialogData: AlertDialogDataInterface;
  formGroup: UntypedFormGroup = this.fb.group({
    emailId: ['mahendra.parihar10@gmail.com', [Validators.required, Validators.email, Validators.maxLength(InputLength.MAX_EMAIL)]],
  });

  constructor(private fb: UntypedFormBuilder,
    private httpService: HttpService,
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
      emailId: AESCryptoUtil.encryptUsingAES256(this.formGroup.value.emailId),
    };
    await this.httpService.postRequest(ApiUrlEnum.SEND_FORGOT_PASSWORD_OTP, payload, true).then((res: ResponseDataModel) => {
      if (res) {
        switch (res.code) {
          case ServerResponseEnum.SUCCESS:
            const temp = {
              emailId: this.formGroup.value.emailId,
            };
            this.dialogRef.close(temp);
            break;
          case ServerResponseEnum.WARNING:
          case ServerResponseEnum.ACCOUNT_VERIFICATION_PENDING:
            // account not present, account invalid, account not verified, account in-active
            this.snackBarService.showWarning(res.message);
            break;
          case ServerResponseEnum.ERROR:
            this.snackBarService.showError(res.message);
            break;
        }
      }
    }).catch((e: any) => {
      this.errorHandlerService.handleError(e);
    });
  }
}
