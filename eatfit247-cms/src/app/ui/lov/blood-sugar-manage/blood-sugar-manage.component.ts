import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {StringResources} from "../../../enum/string-resources";
import {InputLength} from "../../../constants/input-length";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute} from "@angular/router";
import {NavigationService} from "../../../service/navigation.service";
import {SnackBarService} from "../../../service/snack-bar.service";
import {HttpService} from "../../../service/http.service";
import {LovModel} from "../../../models/lov.model";
import {ResponseDataModel} from "../../../models/response-data.model";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {ValidationUtil} from "../../../utilites/validation-util";
import {FileTypeEnum} from "../../../enum/file-type-enum";
import {MediaForEnum} from "../../../enum/media-for-enum";
import {StatusList} from "../../../constants/status-list";

@Component({
  selector: 'app-blood-sugar-manage',
  templateUrl: './blood-sugar-manage.component.html',
  styleUrls: ['./blood-sugar-manage.component.scss']
})
export class BloodSugarManageComponent implements OnInit, AfterViewInit, OnDestroy {

  lovModelObj: LovModel;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  statusList = StatusList;

  formGroup: FormGroup = this.fb.group({
    name: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_2), Validators.maxLength(this.inputLength.CHAR_50)]],
    active: [true, [Validators.required]]
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
    if (this.lovModelObj) {
      this.formGroup.patchValue({
        name: this.lovModelObj.name,
        active: this.lovModelObj.active
      });
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.BLOOD_SUGAR_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.lovModelObj = LovModel.fromJson(res.data);
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
      res = await this.httpService.putRequest(ApiUrlEnum.BLOOD_SUGAR_MANAGE, this.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.BLOOD_SUGAR_MANAGE, payload, true);
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
