import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ValidationUtil } from '../../../utilites/validation-util';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { AdminUserModel } from '../../../models/admin-user.model';
import { ActivatedRoute } from '@angular/router';
import { DropdownItem } from '../../../interfaces/dropdown-item';
import { InputLength } from '../../../constants/input-length';
import { StorageService } from '../../../service/storage.service';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { FileTypeEnum } from '../../../enum/file-type-enum';
import * as moment from 'moment';

@Component({
  selector: 'app-admin-user-edit-profile',
  templateUrl: './admin-user-edit-profile.component.html',
  styleUrls: ['./admin-user-edit-profile.component.scss'],
})
export class AdminUserEditProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  adminUserObj: AdminUserModel;
  stringRes = StringResources;
  inputLength = InputLength;
  mediaForEnum = MediaForEnum;
  fileTypeEnum = FileTypeEnum;
  roleList: DropdownItem[] = [];
  franchiseList: DropdownItem[] = [];
  statusList: DropdownItem[] = [];
  countryCodeList: DropdownItem[] = [];
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
    reason: [null, []],
  });

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute,
    private storageService: StorageService,
    private fb: UntypedFormBuilder) {
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
        roleId: this.adminUserObj.roleList ? this.adminUserObj.roleList[0].roleId : null,
        endDate: this.adminUserObj.endDate,
        franchiseId: this.adminUserObj.franchiseId,
        adminUserStatusId: this.adminUserObj.adminUserStatusId,
        reason: this.adminUserObj.deactivationReason,
      });
    }
  }

  async loadDataById(): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.ADMIN_PROFILE_MANAGE, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.adminUserObj = AdminUserModel.fromJson(res.data);
          console.log(this.adminUserObj);
          this.bindData();
          break;
        case ServerResponseEnum.WARNING:
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
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
    const res: ResponseDataModel = await this.httpService.putRequest(ApiUrlEnum.ADMIN_MANAGE, this.adminUserObj.id, payload, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          this.navigationService.back();
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

  async loadMasterData(): Promise<void> {
    this.roleList = [];
    this.franchiseList = [];
    this.statusList = [];
    this.countryCodeList = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.ADMIN_MASTER_DATA, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          for (const s of res.data.role) {
            this.roleList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.franchise) {
            this.franchiseList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.adminStatus) {
            this.statusList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.countryCode) {
            this.countryCodeList.push(DropdownItem.fromJson(s));
          }
          break;
        case ServerResponseEnum.WARNING:
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }
}
