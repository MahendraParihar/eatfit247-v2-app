import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {StringResources} from "../../../enum/string-resources";
import {InputLength} from "../../../constants/input-length";
import {FileTypeEnum} from "../../../enum/file-type-enum";
import {MediaForEnum} from "../../../enum/media-for-enum";
import {StatusList} from "../../../constants/status-list";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpService} from "../../../service/http.service";
import {SnackBarService} from "../../../service/snack-bar.service";
import {NavigationService} from "../../../service/navigation.service";
import {ActivatedRoute} from "@angular/router";
import {ResponseDataModel} from "../../../models/response-data.model";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {ValidationUtil} from "../../../utilites/validation-util";
import {PocketGuideModel} from "../../../models/pocket-guide.model";

@Component({
  selector: 'app-pocket-guide-manage',
  templateUrl: './pocket-guide-manage.component.html',
  styleUrls: ['./pocket-guide-manage.component.scss']
})
export class PocketGuideManageComponent implements OnInit, AfterViewInit, OnDestroy {

  lovModelObj: PocketGuideModel;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  statusList = StatusList;

  formGroup: FormGroup = this.fb.group({
    name: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_2), Validators.maxLength(this.inputLength.CHAR_50)]],
    description: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_2), Validators.maxLength(this.inputLength.CHAR_1000)]],
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
        description: this.lovModelObj.description,
        active: this.lovModelObj.active
      });
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.POCKET_GUIDE_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.lovModelObj = PocketGuideModel.fromJson(res.data);
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
      res = await this.httpService.putRequest(ApiUrlEnum.POCKET_GUIDE_MANAGE, this.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.POCKET_GUIDE_MANAGE, payload, true);
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
