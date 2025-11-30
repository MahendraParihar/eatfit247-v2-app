import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { IDropdownItem, FileTypeEnum, IRecipe, IResponse } from 'shared-lib';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { StatusList } from '../../../constants/status-list';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { Constants } from '../../../constants/Constants';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { MatChipInputEvent } from '@angular/material/chips';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ValidationUtil } from '../../../utilites/validation-util';
import { map } from 'lodash';

@Component({
  standalone: false,
  selector: 'app-recipe-manage',
  templateUrl: './recipe-manage.component.html',
  styleUrls: ['./recipe-manage.component.scss']
})
export class RecipeManageComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  recipeCategoryList: IDropdownItem[] = [];
  recipeCuisineList: IDropdownItem[] = [];
  recipeTypeList: IDropdownItem[] = [];
  lovModelObj: IRecipe;
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
    private cdr: ChangeDetectorRef) {
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
        recipeCategoryIds: map(this.lovModelObj.recipeCategoryList, 'recipeCategoryId'),
        recipeCuisineIds: map(this.lovModelObj.recipeCuisineList, 'recipeCuisineId'),
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
    this.formGroup.patchValue({ tags: this.tagsList.join(',') });
  }

  remove(tag: string): void {
    const index = this.tagsList.indexOf(tag);
    if (index >= 0) {
      this.tagsList.splice(index, 1);
    }
    this.formGroup.patchValue({ tags: this.tagsList.join(',') });
  }

  async loadDataById(id: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<IRecipe>>(ApiUrlEnum.RECIPE_MANAGE, id, null, true);
    if (res) {
      this.lovModelObj = res.data;
      this.bindData();
      this.cdr.detectChanges();
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    if (this.id > 0) {
      await this.httpService.putRequest<IResponse<void>>(ApiUrlEnum.RECIPE_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest<IResponse<void>>(ApiUrlEnum.RECIPE_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }

  async loadMetaData(): Promise<void> {
    this.recipeCategoryList = [];
    this.recipeCuisineList = [];
    this.recipeTypeList = [];
    const res = await this.httpService.getRequest<IResponse<{
      recipeCategory: IDropdownItem[],
      recipeCuisine: IDropdownItem[],
      recipeType: IDropdownItem[],
    }>>(ApiUrlEnum.RECIPE_MASTER_DATA, null, null, true);
    if (res) {
      this.recipeCategoryList = res.data.recipeCategory;
      this.recipeCuisineList = res.data.recipeCuisine;
      this.recipeTypeList = res.data.recipeType;
    }
  }
}
