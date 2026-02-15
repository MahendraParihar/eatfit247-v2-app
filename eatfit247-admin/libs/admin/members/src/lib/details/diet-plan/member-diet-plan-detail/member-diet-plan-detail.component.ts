import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { Editor, NgxEditorComponent, NgxEditorMenuComponent, Toolbar } from 'ngx-editor';
import { IDropdownItem, IMemberDietDetail, IMemberDietPlanDetail } from '@eatfit247-shared-lib';
import { MembersApiService } from 'members';
import { InputErrorComponent } from '@shared';
import { RecipeMultiSelectComponent } from 'recipes';

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
    NgxEditorComponent,
    NgxEditorMenuComponent,
    InputErrorComponent,
    RecipeMultiSelectComponent
  ],
  templateUrl: './member-diet-plan-detail.component.html',
  styleUrl: './member-diet-plan-detail.component.scss'
})
export class MemberDietPlanDetailComponent implements OnInit, OnDestroy {
  memberId!: number;
  dietPlanId!: number;
  cycleNo!: number;
  dayNo?: number;
  copyFromCycleNo?: number;
  copyFromDayNo?: number;
  dietPlanDetail = signal<IMemberDietDetail | null>(null);
  recipeList = signal<IDropdownItem[]>([]);
  formGroup!: FormGroup;
  editors: Editor[] = [];
  // Toolbar configuration with only text-related controls
  toolbar: Toolbar = [
    ['bold', 'italic', 'underline'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['bullet_list', 'ordered_list'],
    ['align_left', 'align_center', 'align_right']
  ];
  private destroy$ = new Subject<void>();
  formHasValue = signal<boolean>(false);

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
    // Subscribe to form value changes to check if any field has a value
    this.formGroup.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkFormHasValue();
    });
    // Subscribe to FormArray value changes
    this.detailArray().valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkFormHasValue();
    });
    // Subscribe to individual form controls
    this.formGroup.get('startDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkFormHasValue();
    });
    this.formGroup.get('endDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkFormHasValue();
    });
    // Initial check
    this.checkFormHasValue();
  }

  ngOnDestroy(): void {
    // Destroy all editors
    this.editors.forEach(editor => {
      try {
        editor.destroy();
      } catch (error) {
        // Ignore destroy errors
      }
    });
    this.editors = [];
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
    // Trigger validation check after date change
    setTimeout(() => this.checkFormHasValue(), 0);
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
    const newFormGroup = this.newDetail(obj);
    this.detailArray().push(newFormGroup);
    // Create a new editor instance for this row
    const editor = new Editor({
      inputRules: false
    });
    this.editors.push(editor);
    // Subscribe to this form group's value changes
    newFormGroup.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkFormHasValue();
    });
    // Subscribe to individual control changes
    newFormGroup.get('dietDetail')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkFormHasValue();
    });
    newFormGroup.get('recipeIds')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkFormHasValue();
    });
  }

  getEditor(index: number): Editor | null {
    return this.editors[index] || null;
  }

  async loadData(): Promise<void> {
    try {
      const params: any = {};
      if (this.copyFromCycleNo) {
        params.copyFromCycleNo = this.copyFromCycleNo;
      }
      if (this.copyFromDayNo) {
        params.copyFromDayNo = this.copyFromDayNo;
      }
      const res = await this.apiService.getDietPlanDetail(this.memberId, this.dietPlanId, this.cycleNo, this.dayNo, params);
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
      // Clear existing form array and editors
      while (this.detailArray().length !== 0) {
        this.detailArray().removeAt(0);
      }
      // Destroy all existing editors
      this.editors.forEach(editor => {
        try {
          editor.destroy();
        } catch (error) {
          // Ignore destroy errors
        }
      });
      this.editors = [];
      // Add diet plan details
      for (const s of diet.dietPlan) {
        this.addDetail(s);
      }
      this.formGroup.updateValueAndValidity();
      // Wait a bit for form to settle, then check
      setTimeout(() => {
        this.checkFormHasValue();
      }, 100);
    } catch (error) {
      this.snackBar.open('Failed to load diet plan details', 'Close', { duration: 3000 });
    }
  }

  checkFormHasValue(): boolean {
    // Rule 1: Both startDate and endDate must be present (required)
    const startDate = this.formGroup.get('startDate')?.value;
    const endDate = this.formGroup.get('endDate')?.value;
    if (!startDate || !endDate) {
      this.formHasValue.set(false);
      return false;
    }
    // Rule 2: At least one diet detail field must have data
    let hasDietDetailData = false;
    const dietPlanArray = this.detailArray();
    if (dietPlanArray && dietPlanArray.length > 0) {
      for (let i = 0; i < dietPlanArray.length; i++) {
        const formGroup = dietPlanArray.at(i) as FormGroup;
        // Check if dietDetail has HTML content (ngx-editor stores HTML data)
        const dietDetail = formGroup.get('dietDetail')?.value;
        if (dietDetail && String(dietDetail).trim().length > 0) {
          hasDietDetailData = true;
          break;
        }
        // Check if recipeIds has selected values
        const recipeIds = formGroup.get('recipeIds')?.value;
        if (recipeIds && Array.isArray(recipeIds) && recipeIds.length > 0) {
          hasDietDetailData = true;
          break;
        }
      }
    }
    // Button enabled only if both conditions are met:
    // 1. Both dates are present AND 2. At least one diet detail has data
    const isValid = hasDietDetailData;
    this.formHasValue.set(isValid);
    return isValid;
  }

  onCancel() {
    // Navigate back to diet-plan list
    // Find the route that has the :id parameter (details/:id)
    let parentRoute = this.route.parent;
    while (parentRoute && !parentRoute.snapshot.params['id']) {
      parentRoute = parentRoute.parent;
    }
    if (parentRoute) {
      this.router.navigate(['diet-plan'], { relativeTo: parentRoute });
    } else if (this.memberId) {
      // Fallback: navigate using absolute path
      this.router.navigate(['/members', 'details', this.memberId, 'diet-plan']);
    }
  }

  async onSubmit() {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    try {
      const payload: IMemberDietPlanDetail = {
        startDate: this.formGroup.value.startDate,
        endDate: this.formGroup.value.endDate,
        cycleNo: this.formGroup.value.cycleNo,
        dietPlanId: this.formGroup.value.dietPlanId,
        dietPlan: this.formGroup.value.dietPlan
      };
      if (this.dayNo && this.dayNo > 0) {
        payload.dayNo = this.formGroup.value.dayNo;
      }
      await this.apiService.createDietPlanDetail(this.memberId, payload);
      this.snackBar.open('Diet Plan Saved Successfully.', 'Close', { duration: 3000 });
      // Navigate to diet plan list page
      // Find the route that has the :id parameter (details/:id)
      let parentRoute = this.route.parent;
      while (parentRoute && !parentRoute.snapshot.params['id']) {
        parentRoute = parentRoute.parent;
      }
      if (parentRoute) {
        this.router.navigate(['diet-plan'], { relativeTo: parentRoute });
      } else if (this.memberId) {
        // Fallback: navigate using absolute path
        this.router.navigate(['/members', 'details', this.memberId, 'diet-plan']);
      }
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }
}

