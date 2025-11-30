import { Component, inject, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationService } from '../../../service/navigation.service';
import { ValidationUtil } from '../../../utilites/validation-util';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { InputLength } from '../../../constants/input-length';

@Component({
  standalone: false,
  selector: 'app-admin-user-change-password',
  templateUrl: './admin-user-change-password.component.html',
  styleUrls: ['./admin-user-change-password.component.scss']
})
export class AdminUserChangePasswordComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  stringRes = StringResources;
  inputLength = InputLength;
  hide1 = true;
  hide2 = true;
  hide3 = true;
  formGroup: FormGroup = this.fb.group({
    currentPassword: [null, [Validators.required]],
    newPassword: [null, [Validators.required]],
    repeatPassword: [null, [Validators.required]]
  });

  constructor(
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService
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
    const res = await this.httpService.postRequest(
      ApiUrlEnum.ADMIN_CHANGE_PASSWORD,
      payload,
      true
    );
    if (res) {
      this.snackBarService.showSuccess('Password changed successfully');
    }
  }
}
