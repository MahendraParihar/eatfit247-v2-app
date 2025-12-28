import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ValidationUtil } from '../../../utilites/validation-util';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { InputLength } from '../../../constants/input-length';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { FileTypeEnum, IAdminUserList, IDropdownItem, IResponse } from 'shared-lib';
import moment from 'moment';

@Component({
  standalone: false,
  selector: 'app-admin-user-edit-setting',
  templateUrl: './admin-user-edit-profile.component.html',
  styleUrls: ['./admin-user-edit-profile.component.scss']
})
export class AdminUserEditProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  adminUserObj: IAdminUserList;
  stringRes = StringResources;
  inputLength = InputLength;
  mediaForEnum = MediaForEnum;
  fileTypeEnum = FileTypeEnum;
  roleList: IDropdownItem[] = [];
  franchiseList: IDropdownItem[] = [];
  statusList: IDropdownItem[] = [];
  countryCodeList: IDropdownItem[] = [];
  formGroup: FormGroup = this.fb.group({
    firstName: [null, [Validators.required, Validators.minLength(InputLength.MIN_NAME), Validators.maxLength(InputLength.MAX_NAME)]],
    lastName: [null, [Validators.required, Validators.minLength(InputLength.MIN_NAME), Validators.maxLength(InputLength.MAX_NAME)]],
    countryCode: [null, [Validators.required]],
    contactNumber: [null, [Validators.required, ValidationUtil.numberValidation, Validators.maxLength(InputLength.MAX_CONTACT_NUMBER)]],
    emailId: [null, [Validators.required, Validators.email, Validators.maxLength(InputLength.MAX_EMAIL)]],
    startDate: [null, [Validators.required]],
    endDate: [null, []],
    roleId: [null, []],
    franchiseId: [null, []],
    adminUserStatusId: [null, [Validators.required]],
    reason: [null, []]
  });

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService) {
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMasterData();
    await this.loadDataById();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
  }

  onCancel(): void {
    this.navigationService.back();
  }

  bindData(): void {
    if (this.adminUserObj) {
      this.formGroup.patchValue({
        firstName: this.adminUserObj.firstName,
        lastName: this.adminUserObj.lastName,
        countryCode: this.adminUserObj.countryCode,
        contactNumber: this.adminUserObj.contactNumber,
        emailId: this.adminUserObj.emailId,
        startDate: this.adminUserObj.startDate,
        roleId: this.adminUserObj.roleList[0].roleId,
        endDate: this.adminUserObj.endDate,
        franchiseId: this.adminUserObj.franchiseId,
        adminUserStatusId: this.adminUserObj.adminUserStatusId,
        reason: this.adminUserObj.reason
      });
    }
  }

  async loadDataById(): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<IAdminUserList>>(ApiUrlEnum.ADMIN_PROFILE_MANAGE, null, null, true);
    if (res) {
      this.adminUserObj = res.data;
      this.bindData();
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    if (this.formGroup.value.startDate) {
      payload['startDate'] = moment(this.formGroup.value.startDate).toDate();
    }
    if (this.formGroup.value.endDate) {
      payload['endDate'] = moment(this.formGroup.value.endDate).toDate();
    }
    const res = await this.httpService.putRequest(ApiUrlEnum.ADMIN_MANAGE, this.adminUserObj.adminId, payload, true);
    if (res) {
      this.snackBarService.showSuccess('Data updated successfully');
    }
  }

  async loadMasterData(): Promise<void> {
    this.roleList = [];
    this.franchiseList = [];
    this.statusList = [];
    this.countryCodeList = [];
    const res = await this.httpService.getRequest<IResponse<{
      role: IDropdownItem[],
      franchise: IDropdownItem[],
      adminStatus: IDropdownItem[],
      countryCode: IDropdownItem[],
    }>>(ApiUrlEnum.ADMIN_MASTER_DATA, null, null, true);
    if (res) {
      this.roleList = res.data.role;
      this.franchiseList = res.data.franchise;
      this.statusList = res.data.adminStatus;
      this.countryCodeList = res.data.countryCode;
    }
  }
}
