import {Component, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {HttpService} from "../../../service/http.service";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {ResponseDataModel} from "../../../models/response-data.model";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {MatDialog} from "@angular/material/dialog";
import {DialogAlertComponent} from "../../shared/components/dialog-alert/dialog-alert.component";
import {AlertDialogDataInterface} from "../../../interfaces/alert-dialog-data.interface";
import {StringResources} from "../../../enum/string-resources";
import {SnackBarService} from "../../../service/snack-bar.service";
import {DialogForgotPasswordComponent} from "../dialog-forgot-password/dialog-forgot-password.component";
import {NavigationService} from "../../../service/navigation.service";
import {NavigationPathEnum} from "../../../enum/navigation-path-enum";
import {InputLength} from "../../../constants/input-length";
import {AESCryptoUtil} from "../../../utilites/crypto-aes";
import {ValidationUtil} from "../../../utilites/validation-util";
import {AuthUserModel} from "../../../models/auth-user.model";
import {StorageService} from "../../../service/storage.service";
import {AlertTypeEnum} from "../../../enum/alert-type-enum";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  stringRes = StringResources;

  hide = true;
  formGroup: UntypedFormGroup = this.fb.group({
    emailId: ['mahendra.parihar10@gmail.com', [Validators.required, Validators.email, Validators.maxLength(InputLength.MAX_EMAIL)]],
    password: ['Mahendra@123', [Validators.required, Validators.maxLength(100)]]
  });

  constructor(private fb: UntypedFormBuilder,
              private httpService: HttpService,
              private snackBarService: SnackBarService,
              private storageService: StorageService,
              private navigationService: NavigationService,
              public dialog: MatDialog) {
  }

  get formControl() {
    return this.formGroup.controls;
  }

  ngOnInit(): void {
  }

  async loginTask(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    const payload = {
      emailId: AESCryptoUtil.encryptUsingAES256(this.formGroup.value.emailId),
      password: AESCryptoUtil.encryptUsingAES256(this.formGroup.value.password)
    };
    const res: ResponseDataModel = await this.httpService.postRequest(ApiUrlEnum.LOGIN, payload, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          const authUserObj = AuthUserModel.fromJson(res.data);
          if (authUserObj) {
            this.storageService.setAuthUser(authUserObj);
            this.navigationService.navigateToHome()
          } else {
            this.snackBarService.showError(this.stringRes.ERROR_SOMETHING_WRONG);
          }
          break;
        case ServerResponseEnum.ACCOUNT_VERIFICATION_PENDING:
          await this.sendActivationLink();
          // account not verified
          break;
        case ServerResponseEnum.WARNING:
          // account not present, account invalid, account in-active
          this.openAlertDialog(res.message);
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }

  openForgotPasswordDialog(): void {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.FORGOT_PASSWORD,
      message: StringResources.FORGOT_PASSWORD_NOT,
      positiveBtnTxt: StringResources.SEND_OTP,
      negativeBtnTxt: StringResources.NO,
      alertType: AlertTypeEnum.WARNING
    };
    const dialogRef = this.dialog.open(DialogForgotPasswordComponent, {
      width: '350px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
      if (result) {
        this.navigationService.navigateToById(NavigationPathEnum.RESET_PASSWORD, AESCryptoUtil.encryptUsingAES256(result.emailId));
      }
    });
  }

  async sendActivationLink(): Promise<void> {
    const payload = {
      emailId: AESCryptoUtil.encryptUsingAES256(this.formGroup.value.emailId)
    };
    const res: ResponseDataModel = await this.httpService.postRequest(ApiUrlEnum.SEND_ACTIVATION_LINK, payload, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          break;
        case ServerResponseEnum.WARNING:
          // account not present, account invalid, account not verified, account in-active
          this.openAlertDialog(res.message);
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }

  openAlertDialog(msg: string): void {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.ALERT,
      message: msg,
      positiveBtnTxt: StringResources.OK,
      negativeBtnTxt: '',
      alertType: AlertTypeEnum.WARNING
    };
    const dialogRef = this.dialog.open(DialogAlertComponent, {
      width: '300px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
    });
  }
}
