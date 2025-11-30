import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { StringResources } from '../../../enum/string-resources';
import { DialogForgotPasswordComponent } from '../dialog-forgot-password/dialog-forgot-password.component';
import { NavigationService } from '../../../service/navigation.service';
import { NavigationPathEnum } from '../../../enum/navigation-path-enum';
import { InputLength } from '../../../constants/input-length';
import { AESCryptoUtil } from '../../../utilites/crypto-aes';
import { ValidationUtil } from '../../../utilites/validation-util';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  stringRes = StringResources;
  hide = true;
  formGroup: UntypedFormGroup = this.fb.group({
    emailId: [
      'mahendra.parihar10@gmail.com',
      [
        Validators.required,
        Validators.min(2),
        Validators.max(InputLength.MAX_EMAIL),
        Validators.pattern(ValidationUtil.EMAIL_REGEX)
      ]
    ],
    password: [
      'Mahendra@123',
      [
        Validators.required,
        Validators.min(2),
        Validators.max(InputLength.MAX_PASSWORD),
        Validators.pattern(ValidationUtil.PASSWORD_REGEX)
      ]
    ]
  });

  constructor(private authService: AuthService,
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
    const res = await this.authService.signIn(payload);
    if (res) {
      this.navigationService.navigateToHome();
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
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.navigationService.navigateToById(NavigationPathEnum.RESET_PASSWORD, AESCryptoUtil.encryptUsingAES256(result.emailId));
      }
    });
  }
}
