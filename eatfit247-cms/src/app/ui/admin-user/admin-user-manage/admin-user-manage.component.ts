import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StringResources } from '../../../enum/string-resources';
import { ValidationUtil } from '../../../utilites/validation-util';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { InputLength } from '../../../constants/input-length';
import { FileTypeEnum, IAdminMasterData, IDropdownItem, IManageAdminUser, IResponse } from 'shared-lib';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { MatSelectChange } from '@angular/material/select';
import { AdminRoleEnum } from '../../../enum/admin-role-enum';
import moment from 'moment';

@Component({
  standalone: false,
  selector: 'app-admin-user-manage',
  templateUrl: './admin-user-manage.component.html',
  styleUrls: ['./admin-user-manage.component.scss']
})
export class AdminUserManageComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  adminUserObj: IManageAdminUser;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  roleList: IDropdownItem[] = [];
  franchiseList: IDropdownItem[] = [];
  statusList: IDropdownItem[] = [];
  countryCodeList: IDropdownItem[] = [];
  showFranchise = false;
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
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute) {
    this.id = Number(this.activatedRoute.snapshot.paramMap.get('id'));
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMasterData();
    if (this.id) {
      await this.loadDataById(this.id);
    }
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
        roleId: this.adminUserObj.roleId ? this.adminUserObj.roleId : null,
        endDate: this.adminUserObj.endDate,
        franchiseId: this.adminUserObj.franchiseId,
        adminUserStatusId: this.adminUserObj.adminUserStatusId,
        reason: this.adminUserObj.reason
      });
      if (this.adminUserObj.roleId) {
        this.setValidationBasedOnRole(this.adminUserObj.roleId);
      }
    }
  }

  onRoleChange(event: MatSelectChange): void {
    if (event.value) {
      this.setValidationBasedOnRole(event.value);
    }
  }

  onStatusChange(event: MatSelectChange): void {
    if (event.value && this.adminUserObj.adminUserStatusId !== event.value) {
      this.formGroup.get('reason').setValidators([Validators.required, Validators.maxLength(this.inputLength.CHAR_1000)]);
      this.formGroup.get('reason').updateValueAndValidity();
    } else {
      this.formGroup.get('reason').setValidators([]);
      this.formGroup.get('reason').updateValueAndValidity();
    }
  }

  setValidationBasedOnRole(roleId: number) {
    switch (roleId) {
      case AdminRoleEnum.SUPER_ADMIN:
      case AdminRoleEnum.BLOG_ADMIN:
        this.formGroup.patchValue({ franchiseId: null });
        this.formGroup.get('franchiseId').setValidators([]);
        this.formGroup.get('franchiseId').updateValueAndValidity();
        this.showFranchise = false;
        break;
      case AdminRoleEnum.FRANCHISE_ADMIN:
      case AdminRoleEnum.NUTRITIONIST:
        this.formGroup.get('franchiseId').setValidators([Validators.required]);
        this.formGroup.get('franchiseId').updateValueAndValidity();
        this.showFranchise = true;
    }
  }

  async loadMasterData(): Promise<void> {
    this.roleList = [];
    this.franchiseList = [];
    this.statusList = [];
    this.countryCodeList = [];
    const res = await this.httpService.getRequest<IResponse<IAdminMasterData>>(ApiUrlEnum.ADMIN_MASTER_DATA, null, null, true);
    if (res) {
      this.roleList = res.data.role;
      this.franchiseList = res.data.franchise;
      this.statusList = res.data.adminStatus;
      this.countryCodeList = res.data.countryCode;
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<any>>(ApiUrlEnum.ADMIN_MANAGE, id, null, true);
    if (res && res.data) {
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
    if (this.id > 0) {
      await this.httpService.putRequest<IResponse<void>>(ApiUrlEnum.ADMIN_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest<IResponse<void>>(ApiUrlEnum.ADMIN_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }
}
