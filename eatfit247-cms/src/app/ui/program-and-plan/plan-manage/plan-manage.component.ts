import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { StatusList } from '../../../constants/status-list';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { Constants } from '../../../constants/Constants';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidationUtil } from '../../../utilites/validation-util';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { MatChipInputEvent } from '@angular/material/chips';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { IDropdownItem, IProgramPlan, IResponse } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-plan-manage',
  templateUrl: './plan-manage.component.html',
  styleUrls: ['./plan-manage.component.scss']
})
export class PlanManageComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  lovModelObj: IProgramPlan;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  statusList = StatusList;
  tagsList: string[] = [];
  idealForList: string[] = [];
  programPlanTypeList: IDropdownItem[] = [];
  editorConfig: AngularEditorConfig = Constants.editorConfig;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  formGroup: FormGroup = this.fb.group({
    title: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_2), Validators.maxLength(this.inputLength.CHAR_100)]],
    details: [null, [Validators.required]],
    inrAmount: [null, [Validators.required, ValidationUtil.numberValidation]],
    noOfCycle: [null, [Validators.required]],
    programPlanTypeId: [null, [Validators.required]],
    isVisibleOnWeb: [null, [Validators.required]],
    isOnline: [null, [Validators.required]],
    noOfDaysInCycle: [null, [Validators.required, ValidationUtil.numberValidation]],
    sequenceNumber: [null, [Validators.required, ValidationUtil.numberValidation]],
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
        inrAmount: this.lovModelObj.inrAmount,
        noOfCycle: this.lovModelObj.noOfCycle,
        noOfDaysInCycle: this.lovModelObj.noOfDaysInCycle,
        programPlanTypeId: this.lovModelObj.programPlanTypeId,
        isVisibleOnWeb: this.lovModelObj.isVisibleOnWeb,
        isOnline: this.lovModelObj.isOnline,
        sequenceNumber: this.lovModelObj.sequenceNumber,
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
    const res = await this.httpService.getRequest<IResponse<IProgramPlan>>(ApiUrlEnum.PROGRAM_PLAN_MANAGE, id, null, true);
    if (res && res.data) {
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
      await this.httpService.putRequest<IResponse<void>>(ApiUrlEnum.PROGRAM_PLAN_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest<IResponse<void>>(ApiUrlEnum.PROGRAM_PLAN_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }

  async loadMetaData(): Promise<void> {
    this.programPlanTypeList = [];
    const res = await this.httpService.getRequest<IResponse<{ programPlanType: IDropdownItem[] }>>(ApiUrlEnum.PROGRAM_PLAN_MASTER_DATA, null, null, true);
    if (res && res.data) {
      this.programPlanTypeList = res.data.programPlanType;
    }
  }
}
