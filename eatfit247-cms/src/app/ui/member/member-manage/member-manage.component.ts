import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { FileTypeEnum, IMemberList, IResponse, IDropdownItem } from 'shared-lib';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidationUtil } from '../../../utilites/validation-util';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { ApiUrlEnum } from '../../../enum/api-url-enum';

@Component({
  standalone: false,
  selector: 'app-member-manage',
  templateUrl: './member-manage.component.html',
  styleUrls: ['./member-manage.component.scss']
})
export class MemberManageComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  adminUserObj: IMemberList;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  nutritionistList: IDropdownItem[] = [];
  referrerList: IDropdownItem[] = [];
  franchiseList: IDropdownItem[] = [];
  statusList: IDropdownItem[] = [];
  countryCodeList: IDropdownItem[] = [];
  countryList: IDropdownItem[] = [];
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

  async bindData(): Promise<void> {
    if (this.adminUserObj) {
      await Promise.all([
        this.loadReferrer(this.adminUserObj.franchiseId),
        this.loadNutritionist(this.adminUserObj.franchiseId)
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
        reason: this.adminUserObj.deactivationReason
      });
    }
  }

  async onFranchiseChange(event: MatSelectChange): Promise<void> {
    this.referrerList = [];
    this.nutritionistList = [];
    if (event.value) {
      await Promise.all([
        this.loadReferrer(event.value),
        this.loadNutritionist(event.value)
      ]);
    }
  }

  async loadReferrer(franchiseId: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<{ referrer: IDropdownItem[] }>>(ApiUrlEnum.REFERRER_BY_FRANCHISE, franchiseId, null, true);
    if (res && res.data) {
      this.referrerList = res.data.referrer;
    }
  }

  async loadNutritionist(franchiseId: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<{ nutritionist: IDropdownItem[] }>>(ApiUrlEnum.ADMIN_NUTRITIONIST_BY_FRANCHISE, franchiseId, null, true);
    if (res && res.data) {
      this.nutritionistList = res.data.nutritionist;
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
    const res = await this.httpService.getRequest<IResponse<{
      franchise: IDropdownItem[];
      memberStatus: IDropdownItem[];
      countryCode: IDropdownItem[];
      country: IDropdownItem[];
    }>>(ApiUrlEnum.MEMBER_MASTER_DATA, null, null, true);
    if (res && res.data) {
      this.franchiseList = res.data.franchise;
      this.statusList = res.data.memberStatus;
      this.countryCodeList = res.data.countryCode;
      this.countryList = res.data.country;
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<IMemberList>>(ApiUrlEnum.MEMBER_MANAGE, id, null, true);
    if (res && res.data) {
      this.adminUserObj = res.data;
      await this.bindData();
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    if (this.id > 0) {
      await this.httpService.putRequest<IResponse<void>>(ApiUrlEnum.MEMBER_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest<IResponse<void>>(ApiUrlEnum.MEMBER_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }
}
