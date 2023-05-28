import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InputLength } from '../../../constants/input-length';
import { StatusList } from '../../../constants/status-list';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { FileTypeEnum } from '../../../enum/file-type-enum';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { StringResources } from '../../../enum/string-resources';
import { RecipeCategoryModel } from '../../../models/recipe-category.model';
import { ResponseDataModel } from '../../../models/response-data.model';
import { HttpService } from '../../../service/http.service';
import { NavigationService } from '../../../service/navigation.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { ValidationUtil } from '../../../utilites/validation-util';

@Component({
  selector: 'app-recipe-category-manage',
  templateUrl: './recipe-category-manage.component.html',
  styleUrls: ['./recipe-category-manage.component.scss'],
})
export class RecipeCategoryManageComponent implements OnInit, AfterViewInit, OnDestroy {
  lovModelObj: RecipeCategoryModel;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  statusList = StatusList;
  formGroup: FormGroup = this.fb.group({
    name: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_5), Validators.maxLength(this.inputLength.CHAR_50)]],
    active: [true, [Validators.required]],
    fromTime: [null, [Validators.required]],
    toTime: [null, [Validators.required]],
    sequence: [true, [Validators.required]],
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
        fromTime: this.lovModelObj.fromTime,
        toTime: this.lovModelObj.toTime,
        sequence: this.lovModelObj.sequence,
        active: this.lovModelObj.active,
      });
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.RECIPE_CATEGORY_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.lovModelObj = RecipeCategoryModel.fromJson(res.data);
          console.log(this.lovModelObj);
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
      res = await this.httpService.putRequest(ApiUrlEnum.RECIPE_CATEGORY_MANAGE, this.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.RECIPE_CATEGORY_MANAGE, payload, true);
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
