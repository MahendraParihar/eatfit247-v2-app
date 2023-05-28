import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { Constants } from 'src/app/constants/Constants';
import { ApiUrlEnum } from 'src/app/enum/api-url-enum';
import { ServerResponseEnum } from 'src/app/enum/server-response-enum';
import { StringResources } from 'src/app/enum/string-resources';
import { DropdownItem } from 'src/app/interfaces/dropdown-item';
import { DietPlanTemplateDetail } from 'src/app/models/diet-template-detail.model';
import { ResponseDataModel } from 'src/app/models/response-data.model';
import { HttpService } from 'src/app/service/http.service';
import { NavigationService } from 'src/app/service/navigation.service';
import { SnackBarService } from 'src/app/service/snack-bar.service';
import { ValidationUtil } from 'src/app/utilites/validation-util';

@Component({
  selector: 'app-diet-template-details',
  templateUrl: './diet-template-details.component.html',
  styleUrls: ['./diet-template-details.component.scss'],
})
export class DietTemplateDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  id: number;
  stringRes = StringResources;
  dietTemplateId: number;
  dietPlanDetail: DietPlanTemplateDetail;
  recipeList: DropdownItem[] = [];
  editorConfig: AngularEditorConfig = Constants.editorConfigOnlyText;
  cycleList: number[];
  dayList: number[];
  addOnBlur = false;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  formGroup: FormGroup = this.fb.group({
    dietTemplateId: [null, [Validators.required]],
    cycleNo: [null, [Validators.required, ValidationUtil.numberValidation, Validators.min(1), Validators.max(64)]],
    dayNo: [null, [ValidationUtil.numberValidation, Validators.min(1), Validators.max(365)]],
    dietPlan: this.fb.array([]),
  });

  constructor(private fb: FormBuilder,
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog) {
    this.activatedRoute.params.subscribe((params) => {
      this.dietTemplateId = Number(params['id']);
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

  // region body stats item
  detailArray(): FormArray {
    return this.formGroup.get('dietPlan') as FormArray;
  }

  getArrayFormGroup(index: number): FormGroup {
    return this.detailArray().controls[index] as FormGroup;
  }

  // endregion
  async loadData(): Promise<void> {
    const url = this.getLoadUrl();
    const res: ResponseDataModel = await this.httpService.getRequest(url, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.dietPlanDetail = DietPlanTemplateDetail.fromJson(res.data.diet);
          if (!this.recipeList || this.recipeList.length === 0) {
            this.recipeList = [];
            for (const s of res.data.recipes) {
              this.recipeList.push(DropdownItem.fromJson(s));
            }
          }
          this.formGroup.patchValue({
            dietTemplateId: this.dietTemplateId,
            cycleNo: this.dietPlanDetail.cycleNo,
            dayNo: this.dietPlanDetail.dayNo,
          });
          this.setCycleDayList();
          this.formGroup.updateValueAndValidity();
          break;
        case ServerResponseEnum.WARNING:
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }

  reloadData() {
    this.detailArray().clear();
    this.formGroup.setErrors(null);
    this.loadData();
  }

  setCycleDayList() {
    if (!this.dietPlanDetail) {
      return;
    }
    if (this.cycleList && this.cycleList.length > 0) {
      return;
    }
    this.cycleList = [];
    for (let i = 1; i <= this.dietPlanDetail.noOfCycle; i++) {
      this.cycleList.push(i);
    }
    if (!this.dietPlanDetail.isWeekly && this.dietPlanDetail.noOfDaysInCycle && this.dietPlanDetail.noOfDaysInCycle > 0) {
      this.dayList = [];
      for (let i = 1; i <= this.dietPlanDetail.noOfDaysInCycle; i++) {
        this.dayList.push(i);
        this.formGroup.get('dayNo').setValidators([Validators.required, ValidationUtil.numberValidation, Validators.min(1), Validators.max(365)]);
      }
    } else {
      this.formGroup.get('dayNo').setValidators([]);
    }
  }

  getLoadUrl(): string {
    const frmValue = this.formGroup.value;
    let params = frmValue.cycleNo && frmValue.cycleNo > 0 ? frmValue.cycleNo : 1;
    if (frmValue.dayNo && frmValue.dayNo > 0) {
      params = `${params}/${frmValue.dayNo}`;
    }
    return `${ApiUrlEnum.DIET_TEMPLATE_DETAILS}/${this.dietTemplateId}/${params}`;
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
    const res = await this.httpService.postRequest(ApiUrlEnum.DIET_TEMPLATE_DETAILS_UPDATE, payload, true);
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
