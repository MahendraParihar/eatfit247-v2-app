import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { FileTypeEnum } from '../../../enum/file-type-enum';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { StatusList } from '../../../constants/status-list';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { ValidationUtil } from '../../../utilites/validation-util';
import { CountryModel } from '../../../models/country.model';

@Component({
  selector: 'app-country-manage',
  templateUrl: './country-manage.component.html',
  styleUrls: ['./country-manage.component.scss'],
})
export class CountryManageComponent implements OnInit, AfterViewInit, OnDestroy {
  countryModelObj: CountryModel;
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
    active: [true, [Validators.required]],
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
        active: this.countryModelObj.active,
      });
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.COUNTRY_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.countryModelObj = CountryModel.fromJson(res.data);
          this.bindData();
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

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    let res: ResponseDataModel;
    if (this.id > 0) {
      res = await this.httpService.putRequest(ApiUrlEnum.COUNTRY_MANAGE, this.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.COUNTRY_MANAGE, payload, true);
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
