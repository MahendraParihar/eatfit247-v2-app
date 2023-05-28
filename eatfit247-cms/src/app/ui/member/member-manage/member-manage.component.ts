import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { FileTypeEnum } from '../../../enum/file-type-enum';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { DropdownItem } from '../../../interfaces/dropdown-item';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidationUtil } from '../../../utilites/validation-util';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { MemberListModel } from '../../../models/member.model';

@Component({
  selector: 'app-member-manage',
  templateUrl: './member-manage.component.html',
  styleUrls: ['./member-manage.component.scss'],
})
export class MemberManageComponent implements OnInit, AfterViewInit, OnDestroy {
  adminUserObj: MemberListModel;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  nutritionistList: DropdownItem[] = [];
  referrerList: DropdownItem[] = [];
  franchiseList: DropdownItem[] = [];
  statusList: DropdownItem[] = [];
  countryCodeList: DropdownItem[] = [];
  countryList: DropdownItem[] = [];
  showFranchise = false;
  formGroup: FormGroup = this.fb.group({
    firstName: [null, [Validators.required, Validators.minLength(InputLength.MIN_NAME), Validators.maxLength(InputLength.MAX_NAME)]],
    lastName: [null, [Validators.required, Validators.minLength(InputLength.MIN_NAME), Validators.maxLength(InputLength.MAX_NAME)]],
    countryCode: [null, [Validators.required]],
    contactNumber: [null, [Validators.required, ValidationUtil.numberValidation, Validators.maxLength(InputLength.MAX_CONTACT_NUMBER)]],
    emailId: [null, [Validators.required, Validators.email, Validators.maxLength(InputLength.MAX_EMAIL)]],
    franchiseId: [null, [Validators.required]],
    nutritionistId: [null, [Validators.required]],
    countryId: [null, [Validators.required]],
    referrerId: [null, []],
    userStatusId: [null, [Validators.required]],
    reason: [null, []],
  });

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder) {
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

  async bindData(): Promise<void> {
    if (this.adminUserObj) {
      await Promise.all([
        this.loadReferrer(this.adminUserObj.franchiseId),
        this.loadNutritionist(this.adminUserObj.franchiseId),
      ]);
      this.formGroup.patchValue({
        firstName: this.adminUserObj.firstName,
        lastName: this.adminUserObj.lastName,
        countryCode: this.adminUserObj.countryCode,
        contactNumber: this.adminUserObj.contactNumber,
        emailId: this.adminUserObj.emailId,
        franchiseId: this.adminUserObj.franchiseId,
        nutritionistId: this.adminUserObj.nutritionistId,
        countryId: this.adminUserObj.countryId,
        referrerId: this.adminUserObj.referrerId,
        userStatusId: this.adminUserObj.userStatusId,
        reason: this.adminUserObj.deactivationReason,
      });
    }
  }

  async onFranchiseChange(event: MatSelectChange): Promise<void> {
    this.referrerList = [];
    this.nutritionistList = [];
    if (event.value) {
      await Promise.all([
        this.loadReferrer(event.value),
        this.loadNutritionist(event.value),
      ]);
    }
  }

  async loadReferrer(franchiseId: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.REFERRER_BY_FRANCHISE, franchiseId, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          for (const s of res.data.referrer) {
            this.referrerList.push(DropdownItem.fromJson(s));
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

  async loadNutritionist(franchiseId: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.ADMIN_NUTRITIONIST_BY_FRANCHISE, franchiseId, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          for (const s of res.data.nutritionist) {
            this.nutritionistList.push(DropdownItem.fromJson(s));
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

  onStatusChange(event: MatSelectChange): void {
    if (event.value && this.adminUserObj.userStatusId !== event.value) {
      this.formGroup.get('reason').setValidators([Validators.required, Validators.maxLength(this.inputLength.CHAR_1000)]);
      this.formGroup.get('reason').updateValueAndValidity();
    } else {
      this.formGroup.get('reason').setValidators([]);
      this.formGroup.get('reason').updateValueAndValidity();
    }
  }

  async loadMasterData(): Promise<void> {
    this.franchiseList = [];
    this.statusList = [];
    this.countryCodeList = [];
    this.countryList = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_MASTER_DATA, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          for (const s of res.data.franchise) {
            this.franchiseList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.memberStatus) {
            this.statusList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.countryCode) {
            this.countryCodeList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.country) {
            this.countryList.push(DropdownItem.fromJson(s));
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

  async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.adminUserObj = MemberListModel.fromJson(res.data);
          await this.bindData();
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
    let res: ResponseDataModel;
    if (this.id > 0) {
      res = await this.httpService.putRequest(ApiUrlEnum.MEMBER_MANAGE, this.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_MANAGE, payload, true);
    }
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
}
