import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { HttpService } from '../../../service/http.service';
import { InputLength } from '../../../constants/input-length';
import { ActivatedRoute } from '@angular/router';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { NavigationPathEnum } from '../../../enum/navigation-path-enum';
import { StringResources } from '../../../enum/string-resources';
import { ErrorHandlerService } from '../../../service/error-handler.service';
import { AESCryptoUtil } from '../../../utilites/crypto-aes';
import { ValidationUtil } from '../../../utilites/validation-util';

@Component({
  standalone: false,
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  hide = true;
  hide1 = true;
  stringRes = StringResources;
  formGroup: UntypedFormGroup = this.fb.group({
    emailId: ['', [Validators.required, Validators.email, Validators.maxLength(InputLength.MAX_EMAIL)]],
    otp: ['', [Validators.required, Validators.maxLength(InputLength.OTP), Validators.minLength(InputLength.OTP)]],
    password: ['', [Validators.required, Validators.minLength(InputLength.MIN_PASSWORD), Validators.maxLength(InputLength.MAX_PASSWORD)]],
    repeatPassword: ['', [Validators.required, Validators.minLength(InputLength.MIN_PASSWORD), Validators.maxLength(InputLength.MAX_PASSWORD)]]
  });

  constructor(private httpService: HttpService,
    private activatedRoute: ActivatedRoute,
    private errorHandlerService: ErrorHandlerService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    public dialog: MatDialog) {
    let emId = this.activatedRoute.snapshot.paramMap.get('id');
    if (!emId) {
      this.navigationService.navigateToLogin();
    }
    emId = AESCryptoUtil.decryptUsingAES256(emId);
    this.formGroup.patchValue({ emailId: emId });
  }

  get formControl() {
    return this.formGroup.controls;
  }

  ngOnInit(): void {
  }

  async resetPasswordTask(): Promise<any> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    const payload = {
      emailId: AESCryptoUtil.encryptUsingAES256(this.formGroup.value.emailId),
      password: AESCryptoUtil.encryptUsingAES256(this.formGroup.value.password),
      repeatPassword: AESCryptoUtil.encryptUsingAES256(this.formGroup.value.repeatPassword),
      otp: this.formGroup.value.otp
    };
    const res = await this.httpService.postRequest(ApiUrlEnum.RESET_PASSWORD, payload, true);
    if (res) {
      this.navigationService.navigateTo(NavigationPathEnum.LOGIN);
    }
  }

  async resendOtpTask(): Promise<any> {
    const payload = {
      emailId: AESCryptoUtil.encryptUsingAES256(this.formGroup.value.emailId)
    };
    const res = await this.httpService.postRequest(ApiUrlEnum.SEND_FORGOT_PASSWORD_OTP, payload, true);
    if (res) {
      this.snackBarService.showSuccess('OTP sent successfully. Please check your email.');
    }
  }

  backToLogin() {
    this.navigationService.navigateToLogin();
  }
}
