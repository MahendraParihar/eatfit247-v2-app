import { AfterViewInit, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import {
  IDropdownItem,
  IMemberDietDetail,
  IDietPlanDetail,
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';
import { InputErrorComponent } from '@shared';

@Component({
  selector: 'lib-member-diet-plan-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    InputErrorComponent,
  ],
  templateUrl: './member-diet-plan-detail.component.html',
  styleUrl: './member-diet-plan-detail.component.scss'
})
export class MemberDietPlanDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  memberId!: number;
  dietPlanId!: number;
  cycleNo!: number;
  dayNo?: number;
  copyFromCycleNo?: number;
  copyFromDayNo?: number;
  dietPlanDetail = signal<IMemberDietDetail | null>(null);
  recipeList = signal<IDropdownItem[]>([]);
  formGroup!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: MembersApiService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  private initializeForm() {
    this.formGroup = this.fb.group({
      startDate: [null, [Validators.required]],
      endDate: [null, []],
      dietPlanId: [null, [Validators.required]],
      cycleNo: [null, [Validators.required, Validators.min(1), Validators.max(64)]],
      dayNo: [null, []],
      dietPlan: this.fb.array([])
    });
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    this.route.parent?.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.memberId = +params['id'];
    });
    
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.dietPlanId = Number(params['dietId']);
      this.cycleNo = Number(params['cycleId']);
      this.dayNo = params['dayNo'] ? Number(params['dayNo']) : undefined;
      this.copyFromCycleNo = params['copyCycleId'] ? Number(params['copyCycleId']) : undefined;
      this.copyFromDayNo = params['copyDayNo'] ? Number(params['copyDayNo']) : undefined;
      
      if (this.memberId && this.dietPlanId && this.cycleNo) {
        this.loadData();
      }
    });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStartDateChange(type: string, event: MatDatepickerInputEvent<Date>) {
    if (this.dayNo && this.dayNo > 0) {
      this.formGroup.patchValue({ endDate: event.value });
    } else {
      const dietPlan = this.dietPlanDetail();
      if (dietPlan && event.value) {
        const endDate = moment(event.value).add(dietPlan.noOfDaysInCycle - 1, 'day');
        this.formGroup.patchValue({ endDate: endDate.toDate() });
      }
    }
  }

  onRecipeChange(event: IDropdownItem[], index: number): void {
    if (event && event.length > 0) {
      const s = this.detailArray().value;
      s[index].recipeIds = event.map(item => item.id);
      this.detailArray().patchValue(s);
    }
  }

  detailArray(): FormArray {
    return this.formGroup.get('dietPlan') as FormArray;
  }

  getArrayFormGroup(index: number): FormGroup {
    return this.detailArray().controls[index] as FormGroup;
  }

  newDetail(obj: any): FormGroup {
    return this.fb.group({
      recipeCategoryId: [obj.recipeCategoryId, [Validators.required]],
      recipeCategory: [obj.recipeCategory, [Validators.required]],
      dietDetail: [obj.dietDetail, []],
      recipeIds: [obj.recipeIds || [], []]
    });
  }

  addDetail(obj: any): void {
    this.detailArray().push(this.newDetail(obj));
  }

  removeDetail(i: number): void {
    this.detailArray().removeAt(i);
  }

  async loadData(): Promise<void> {
    try {
      let url = `diet-plan/manage/${this.memberId}/${this.dietPlanId}/${this.cycleNo}`;
      if (this.dayNo) {
        url = url + `/${this.dayNo}`;
      }
      const params: any = {};
      if (this.copyFromCycleNo) {
        params.copyFromCycleNo = this.copyFromCycleNo;
      }
      if (this.copyFromDayNo) {
        params.copyFromDayNo = this.copyFromDayNo;
      }
      
      const res = await this.apiService.getDietPlanDetail(url, params);
      this.dietPlanDetail.set(res.diet);
      this.recipeList.set(res.recipes as IDropdownItem[]);
      
      const diet = res.diet;
      this.formGroup.patchValue({
        dietPlanId: (diet as any).dietPlanId || diet.memberDietPlanId,
        cycleNo: diet.cycleNo,
        dayNo: diet.dayNo,
        startDate: diet.startDate ? new Date(diet.startDate) : null,
        endDate: diet.endDate ? new Date(diet.endDate) : null
      });
      
      if (diet.noOfCycle) {
        this.formGroup.get('cycleNo')?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(diet.noOfCycle)
        ]);
      }
      
      if (this.dayNo && this.dayNo > 0) {
        this.formGroup.get('dayNo')?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(diet.noOfDaysInCycle)
        ]);
      } else {
        this.formGroup.get('dayNo')?.clearValidators();
      }
      
      // Clear existing form array
      while (this.detailArray().length !== 0) {
        this.detailArray().removeAt(0);
      }
      
      // Add diet plan details
      for (const s of diet.dietPlan) {
        this.addDetail(s);
      }
      
      this.formGroup.updateValueAndValidity();
    } catch (error) {
      console.error('Error loading diet plan detail:', error);
      this.snackBar.open('Failed to load diet plan details', 'Close', { duration: 3000 });
    }
  }

  onCancel() {
    this.router.navigate(['../'], { relativeTo: this.route.parent });
  }

  async onSubmit() {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    
    try {
      const payload: any = this.formGroup.value;
      await this.apiService.createDietPlanDetail(this.memberId, payload);
      this.snackBar.open('Diet Plan Saved Successfully.', 'Close', { duration: 3000 });
      this.onCancel();
    } catch (error) {
      console.error('Error saving diet plan:', error);
      this.snackBar.open('Failed to save diet plan', 'Close', { duration: 3000 });
    }
  }
}

