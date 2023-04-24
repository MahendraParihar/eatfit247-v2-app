import {Component, OnInit} from '@angular/core';
import {StringResources} from '../../../enum/string-resources';
import {HttpService} from '../../../service/http.service';
import {SnackBarService} from '../../../service/snack-bar.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NavigationService} from '../../../service/navigation.service';
import {ValidationUtil} from '../../../utilites/validation-util';
import {ServerResponseEnum} from '../../../enum/server-response-enum';
import {ApiUrlEnum} from '../../../enum/api-url-enum';
import {ResponseDataModel} from '../../../models/response-data.model';
import {InputLength} from '../../../constants/input-length';

@Component({
  selector: 'app-admin-user-change-password',
  templateUrl: './admin-user-change-password.component.html',
  styleUrls: ['./admin-user-change-password.component.scss'],
})
export class AdminUserChangePasswordComponent implements OnInit {
  stringRes = StringResources;
  inputLength = InputLength;

  hide1 = true;
  hide2 = true;
  hide3 = true;

  formGroup: FormGroup = this.fb.group({
    currentPassword: [null, [Validators.required]],
    newPassword: [null, [Validators.required]],
    repeatPassword: [null, [Validators.required]],
  });

  constructor(
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private fb: FormBuilder
  ) {
  }

  get formControl() {
    return this.formGroup.controls;
  }

  ngOnInit(): void {
  }

  onCancel(): void {
    this.navigationService.back();
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }

    const payload = this.formGroup.value;

    const res: ResponseDataModel = await this.httpService.postRequest(
      ApiUrlEnum.ADMIN_CHANGE_PASSWORD,
      payload,
      true
    );
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.formGroup.reset();
          this.snackBarService.showSuccess(res.message);
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
