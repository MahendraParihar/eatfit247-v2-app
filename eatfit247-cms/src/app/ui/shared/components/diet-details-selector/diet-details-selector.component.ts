import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StringResources } from 'src/app/enum/string-resources';
import { ValidationUtil } from 'src/app/utilites/validation-util';
import { map } from 'lodash';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { Constants } from 'src/app/constants/Constants';
import { IDietPlanDetail, IDropdownItem } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-diet-details-selector',
  templateUrl: './diet-details-selector.component.html',
  styleUrls: ['./diet-details-selector.component.scss']
})
export class DietDetailsSelectorComponent implements OnInit {
  stringRes = StringResources;
  @Input()
  formGroup: FormGroup;
  @Input()
  formArrayName: string;
  @Input()
  recipeList!: IDropdownItem[];
  dietPlanList!: IDietPlanDetail[];
  formArray!: FormArray;
  editorConfig: AngularEditorConfig = Constants.editorConfigOnlyText;

  constructor(private fb: FormBuilder) {
  }

  @Input()
  set dietPlans(value: IDietPlanDetail[]) {
    this.dietPlanList = value;
    this.setFormArray();
  }

  ngOnInit(): void {
  }

  setFormArray() {
    this.formArray = this.formGroup.get(this.formArrayName) as FormArray;
    for (const item of this.dietPlanList) {
      this.formArray.push(this.newDetail(item));
    }
  }

  newDetail(obj: IDietPlanDetail): FormGroup {
    return this.fb.group({
      recipeCategoryId: [obj.recipeCategoryId, [Validators.required, ValidationUtil.numberValidation]],
      recipeCategory: [obj.recipeCategory, [Validators.required]],
      dietDetail: [obj.dietDetail, []],
      recipeIds: [obj.recipeIds, []]
    });
  }

  onRecipeChange(event: IDropdownItem[], index: number): void {
    if (event && event.length > 0) {
      const s = this.formArray.value;
      s[index].recipeIds = map(event, 'id');
      this.formArray.patchValue(s);
    }
  }
}
