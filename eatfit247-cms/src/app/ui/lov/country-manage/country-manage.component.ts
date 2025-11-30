import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { FileTypeEnum, ICountry, IResponse } from 'shared-lib';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { StatusList } from '../../../constants/status-list';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ValidationUtil } from '../../../utilites/validation-util';

@Component({
  standalone: false,
  selector: 'app-country-manage',
  templateUrl: './country-manage.component.html',
  styleUrls: ['./country-manage.component.scss']
})
export class CountryManageComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  countryModelObj: ICountry;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  statusList = StatusList;
  formGroup: FormGroup = this.fb.group({
    name: [null, [Validators.required, Validators.maxLength(this.inputLength.CHAR_100)]],
    countryCode: [null, [Validators.required, Validators.maxLength(this.inputLength.CHAR_5)]],
    phoneNumberCode: [null, [Validators.required, Validators.maxLength(this.inputLength.CHAR_5)]],
    active: [true, [Validators.required]]
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
    if (this.countryModelObj) {
      this.formGroup.patchValue({
        name: this.countryModelObj.name,
        countryCode: this.countryModelObj.countryCode,
        phoneNumberCode: this.countryModelObj.phoneNumberCode,
        active: this.countryModelObj.active
      });
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<ICountry>>(ApiUrlEnum.COUNTRY_MANAGE, id, null, true);
    if (res) {
      this.countryModelObj = res.data;
      this.bindData();
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    if (this.id > 0) {
      await this.httpService.putRequest(ApiUrlEnum.COUNTRY_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest(ApiUrlEnum.COUNTRY_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }
}
