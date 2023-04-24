import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ApiUrlEnum} from 'src/app/enum/api-url-enum';
import {FieldTypeEnum} from 'src/app/enum/field-type-enum';
import {ServerResponseEnum} from 'src/app/enum/server-response-enum';
import {StringResources} from 'src/app/enum/string-resources';
import {ConfigParameterModel} from 'src/app/models/config-parameter.model';
import {ResponseDataModel} from 'src/app/models/response-data.model';
import {HttpService} from 'src/app/service/http.service';
import {SnackBarService} from 'src/app/service/snack-bar.service';
import {ValidationUtil} from 'src/app/utilites/validation-util';
import {NavigationService} from "../../../service/navigation.service";

@Component({
  selector: 'app-config-parameter-manage',
  templateUrl: './config-parameter-manage.component.html',
  styleUrls: ['./config-parameter-manage.component.scss']
})
export class ConfigParameterManageComponent implements OnInit {

  configParamList: ConfigParameterModel[];
  configParamControls: any;
  fieldTypeEnum = FieldTypeEnum;
  stringRes = StringResources;
  formGroup: FormGroup = this.fb.group({
    configParams: this.fb.array([])
  });

  constructor(private httpService: HttpService,
              private snackBarService: SnackBarService,
              private navigationService: NavigationService,
              private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.loadConfigParameters();
  }

  async loadConfigParameters(): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.CONFIG_PARAMETER_LIST, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          if (res.data) {
            this.configParamList = [];
            for (const obj of res.data) {
              this.configParamList.push(ConfigParameterModel.fromJson(obj));
            }
          }
          this.setConfigParamFormControls();
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

  setConfigParamFormControls() {
    const configFormArray = this.formGroup.get("configParams") as FormArray;
    if (this.configParamList) {
      for (const item of this.configParamList) {
        configFormArray.push(this.createConfigParamControl(item));
      }
      this.configParamControls = configFormArray.controls;
      this.formGroup.updateValueAndValidity();
    }
  }

  createConfigParamControl(obj: ConfigParameterModel): FormGroup {
    let value: any = obj.configParamValue;
    if (obj.fieldType === FieldTypeEnum.RADIO) {
      value = obj.configParamValue === '1';
    }
    return this.fb.group({
      configParamId: [obj.configParamId],
      configParamValue: [value, [Validators.required]]
    });
  }

  onCancel(): void {
    this.navigationService.back();
  }

  async onSubmit() {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }

    console.log('FORM VALUE', this.formGroup.value);

    const configs = [];
    for (const item of this.formGroup.value.configParams) {
      const mFieldType = this.configParamList.find(x => x.configParamId === item.configParamId).fieldType;
      let value = item.configParamValue;
      if (mFieldType === FieldTypeEnum.RADIO) {
        value = item.configParamValue === true ? '1' : '0';
      }
      configs.push({configParamId: item.configParamId, configParamValue: value});
    }

    const payload = configs;
    console.log('PAYLOAD', payload);

    const res = await this.httpService.postRequest(ApiUrlEnum.CONFIG_PARAMETER_UPDATE, payload, true)

    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
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
