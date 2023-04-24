import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {DropdownItem} from "../../../interfaces/dropdown-item";
import {StringResources} from "../../../enum/string-resources";
import {InputLength} from "../../../constants/input-length";
import {FileTypeEnum} from "../../../enum/file-type-enum";
import {MediaForEnum} from "../../../enum/media-for-enum";
import {StatusList} from "../../../constants/status-list";
import {AngularEditorConfig} from "@kolkov/angular-editor";
import {Constants} from "../../../constants/Constants";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpService} from "../../../service/http.service";
import {SnackBarService} from "../../../service/snack-bar.service";
import {NavigationService} from "../../../service/navigation.service";
import {ActivatedRoute} from "@angular/router";
import {MatChipInputEvent} from "@angular/material/chips";
import {ResponseDataModel} from "../../../models/response-data.model";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {ValidationUtil} from "../../../utilites/validation-util";
import {RecipeModel} from "../../../models/recipe.model";

declare var _: any;

@Component({
  selector: 'app-recipe-manage',
  templateUrl: './recipe-manage.component.html',
  styleUrls: ['./recipe-manage.component.scss']
})
export class RecipeManageComponent implements OnInit, AfterViewInit, OnDestroy {

  recipeCategoryList: DropdownItem[] = [];
  recipeCuisineList: DropdownItem[] = [];
  recipeTypeList: DropdownItem[] = [];
  lovModelObj: RecipeModel;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  statusList = StatusList;
  tagsList: string[] = [];

  editorConfig: AngularEditorConfig = Constants.editorConfig;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  formGroup: FormGroup = this.fb.group({
    title: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_2), Validators.maxLength(this.inputLength.CHAR_100)]],
    details: [null, [Validators.required]],
    preparationMethod: [null, [Validators.required]],
    benefits: [null, [Validators.required]],
    ingredients: [null, [Validators.required]],
    servingCount: [null, [Validators.required]],
    recipeCategoryIds: [null, [Validators.required]],
    recipeCuisineIds: [null, [Validators.required]],
    recipeTypeId: [null, [Validators.required]],
    isVisibleToAll: [null, [Validators.required]],
    tags: [null, [Validators.required]],
    active: [true, [Validators.required]]
  });

  constructor(private httpService: HttpService,
              private snackBarService: SnackBarService,
              private navigationService: NavigationService,
              private activatedRoute: ActivatedRoute,
              private cdr: ChangeDetectorRef,
              private fb: FormBuilder) {
    this.id = Number(this.activatedRoute.snapshot.paramMap.get('id'));
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMetaData();
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
      this.tagsList = this.lovModelObj.tags ? this.lovModelObj.tags.toString().split(',') : [];
      this.formGroup.patchValue({
        title: this.lovModelObj.title,
        details: this.lovModelObj.details,
        benefits: this.lovModelObj.benefits,
        servingCount: this.lovModelObj.servingCount,
        preparationMethod: this.lovModelObj.preparationMethod,
        ingredients: this.lovModelObj.ingredients,
        recipeCategoryIds: _.map(this.lovModelObj.recipeCategoryList, 'recipeCategoryId'),
        recipeCuisineIds: _.map(this.lovModelObj.recipeCuisineList, 'recipeCuisineId'),
        isVisibleToAll: this.lovModelObj.isVisibleToAll,
        recipeTypeId: this.lovModelObj.recipeTypeId,
        tags: this.tagsList.join(','),
        active: this.lovModelObj.active
      });
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our data
    if (value) {

      const index = this.tagsList.indexOf(value);
      if (index >= 0) {
        // Clear the input value
        event.chipInput!.clear();
        return;
      }

      this.tagsList.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();
    this.formGroup.patchValue({tags: this.tagsList.join(',')})
  }

  remove(tag: string): void {
    const index = this.tagsList.indexOf(tag);

    if (index >= 0) {
      this.tagsList.splice(index, 1);
    }
    this.formGroup.patchValue({tags: this.tagsList.join(',')})
  }

  async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.RECIPE_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.lovModelObj = RecipeModel.fromJson(res.data);
          this.bindData();
          this.cdr.detectChanges();
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
      res = await this.httpService.putRequest(ApiUrlEnum.RECIPE_MANAGE, this.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.RECIPE_MANAGE, payload, true);
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

  async loadMetaData(): Promise<void> {
    this.recipeCategoryList = [];
    this.recipeCuisineList = [];
    this.recipeTypeList = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.RECIPE_MASTER_DATA, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          for (const s of res.data.recipeCategory) {
            this.recipeCategoryList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.recipeCuisine) {
            this.recipeCuisineList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.recipeType) {
            this.recipeTypeList.push(DropdownItem.fromJson(s));
          }
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
