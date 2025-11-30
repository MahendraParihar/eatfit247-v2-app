import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { Constants } from '../../../constants/Constants';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { map } from 'lodash';
import { ValidationUtil } from '../../../utilites/validation-util';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import moment from 'moment';
import { IDropdownItem, IResponse } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-member-diet-plan-detail',
  templateUrl: './member-diet-plan-detail.component.html',
  styleUrls: ['./member-diet-plan-detail.component.scss']
})
export class MemberDietPlanDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  id: number;
  stringRes = StringResources;
  dietPlanId: number;
  cycleNo: number;
  dayNo?: number;
  copyFromCycleNo?: number;
  copyFromDayNo?: number;
  dietPlanDetail: any;
  recipeList: IDropdownItem[] = [];
  editorConfig: AngularEditorConfig = Constants.editorConfigOnlyText;
  addOnBlur = false;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  formGroup: FormGroup = this.fb.group({
    startDate: [null, [Validators.required]],
    endDate: [null, []],
    dietPlanId: [null, [Validators.required]],
    cycleNo: [null, [Validators.required, ValidationUtil.numberValidation, Validators.min(1), Validators.max(64)]],
    dayNo: [null, [Validators.required, ValidationUtil.numberValidation, Validators.min(1), Validators.max(365)]],
    dietPlan: this.fb.array([])
  });

  constructor(
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog) {
    this.activatedRoute.parent.params.subscribe(params => {
      this.id = Number(params['id']);
    });
    this.activatedRoute.params.subscribe((params) => {
      this.dietPlanId = Number(params['dietId']);
      this.cycleNo = Number(params['cycleId']);
      this.dayNo = params['dayNo'] ? Number(params['dayNo']) : null;
      this.copyFromCycleNo = params['copyCycleId'] ? Number(params['copyCycleId']) : null;
      this.copyFromDayNo = params['copyDayNo'] ? Number(params['copyDayNo']) : null;
    });
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy(): void {
  }

  onStartDateChange(type: string, event: MatDatepickerInputEvent<Date>) {
    if (this.dayNo && this.dayNo > 0) {
      this.formGroup.patchValue({ endDate: event.value });
    } else {
      const endDate = moment(event.value).add(this.dietPlanDetail.noOfDaysInCycle - 1, 'day');
      this.formGroup.patchValue({ endDate: endDate });
    }
  }

  onRecipeChange(event: IDropdownItem[], index: number): void {
    if (event && event.length > 0) {
      const s = this.detailArray().value;
      s[index].recipeIds = map(event, 'id');
      this.detailArray().patchValue(s);
    }
  }

  // region body stats item
  detailArray(): FormArray {
    return this.formGroup.get('dietPlan') as FormArray;
  }

  getArrayFormGroup(index: number): FormGroup {
    return this.detailArray().controls[index] as FormGroup;
  }

  newDetail(obj: any): FormGroup {
    return this.fb.group({
      recipeCategoryId: [obj.recipeCategoryId, [Validators.required, ValidationUtil.numberValidation]],
      recipeCategory: [obj.recipeCategory, [Validators.required]],
      dietDetail: [obj.dietDetail, []],
      recipeIds: [obj.recipeIds, []]
    });
  }

  addDetail(obj: any): void {
    this.detailArray().push(this.newDetail(obj));
  }

  removeDetail(i: number): void {
    this.detailArray().removeAt(i);
  }

  // endregion
  async loadData(): Promise<void> {
    let url = `${ApiUrlEnum.MEMBER_DIET_PLAN_MANAGE}/${this.id}/${this.dietPlanId}/${this.cycleNo}`;
    if (this.dayNo) {
      url = url + `/${this.dayNo}`;
    }
    if (this.copyFromCycleNo) {
      url = url + `?copyFromCycleNo=${this.copyFromCycleNo}`;
    }
    if (this.copyFromDayNo) {
      url = url + `&copyFromDayNo=${this.copyFromDayNo}`;
    }
    const res = await this.httpService.getRequest<IResponse<any>>(url, null, null, true);
    if (res) {
      this.dietPlanDetail = res.data.diet;
      this.recipeList = res.data.recipes;
      this.formGroup.patchValue({
        dietPlanId: this.dietPlanDetail.dietPlanId,
        cycleNo: this.dietPlanDetail.cycleNo,
        dayNo: this.dietPlanDetail.dayNo,
        startDate: this.dietPlanDetail.startDate,
        endDate: this.dietPlanDetail.endDate
      });
      this.formGroup.get('cycleNo').setValidators([Validators.required, Validators.min(1), Validators.max(this.dietPlanDetail.noOfCycle)]);
      if (this.dayNo && this.dayNo > 0) {
        this.formGroup.get('dayNo').setValidators([Validators.required, Validators.min(1), Validators.max(this.dietPlanDetail.noOfDaysInCycle)]);
      } else {
        this.formGroup.get('dayNo').setValidators([]);
      }
      for (const s of this.dietPlanDetail.dietPlan) {
        this.addDetail(s);
      }
      this.formGroup.updateValueAndValidity();
    }
  }

  onCancel() {
    this.navigationService.back();
  }

  async onSubmit() {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    const res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_DIET_PLAN_MANAGE + '/' + this.id, payload, true);
    if (res) {
      this.snackBarService.showSuccess('Diet Plan Saved Successfully.');
      this.onCancel();
    }
  }
}
