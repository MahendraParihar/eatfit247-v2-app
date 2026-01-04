import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { NgxEditorComponent, NgxEditorMenuComponent, Editor, Toolbar } from 'ngx-editor';
import {
  IDropdownItem,
  IDietPlanDetail,
} from '@eatfit247-shared-lib';
import { DietTemplateApiService } from '../api.service';
import { InputErrorComponent } from '@shared';

@Component({
  selector: 'lib-diet-template-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    InputErrorComponent
  ],
  templateUrl: './diet-template-detail.component.html',
  styleUrl: './diet-template-detail.component.scss'
})
export class DietTemplateDetailComponent implements OnInit, OnDestroy {
  dietTemplateId!: number;
  cycleNo!: number;
  dayNo?: number;
  copyFromCycleNo?: number;
  copyFromDayNo?: number;
  dietPlanDetail = signal<{
    dietTemplateId: number;
    cycleNo: number;
    dayNo?: number;
    noOfCycle: number;
    noOfDaysInCycle: number;
    dietPlan: IDietPlanDetail[];
  } | null>(null);
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
    private apiService: DietTemplateApiService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  private initializeForm() {
    this.formGroup = this.fb.group({
      dietTemplateId: [null, [Validators.required]],
      cycleNo: [null, [Validators.required, Validators.min(1), Validators.max(64)]],
      dayNo: [null, []],
      dietPlan: this.fb.array([])
    });
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.dietTemplateId = Number(params['dietTemplateId']);
      this.cycleNo = Number(params['cycleNo']);
      this.dayNo = params['dayNo'] ? Number(params['dayNo']) : undefined;
      this.copyFromCycleNo = params['copyCycleId'] ? Number(params['copyCycleId']) : undefined;
      this.copyFromDayNo = params['copyDayNo'] ? Number(params['copyDayNo']) : undefined;
      if (this.dietTemplateId && this.cycleNo) {
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Destroy all editors
    this.editors.forEach(editor => {
      try {
        editor.destroy();
      } catch (error) {
        console.warn('Error destroying editor:', error);
      }
    });
  }

  detailArray(): FormArray {
    return this.formGroup.get('dietPlan') as FormArray;
  }

  getArrayFormGroup(index: number): FormGroup {
    return this.detailArray().at(index) as FormGroup;
  }

  getEditor(index: number): Editor | null {
    return this.editors[index] || null;
  }

  addDetail(obj?: IDietPlanDetail): void {
    const editor = new Editor({
      history: true,
      keyboardShortcuts: true,
      inputRules: true,
    });
    this.editors.push(editor);

    const detailFormGroup = this.fb.group({
      recipeCategoryId: [obj?.recipeCategoryId || null, [Validators.required]],
      recipeCategory: [obj?.recipeCategory || '', []],
      dietDetail: [obj?.dietDetail || '', []],
      recipeIds: [obj?.recipeIds || [], []],
      sequence: [obj?.sequence || 0, []]
    });

    this.detailArray().push(detailFormGroup);
    this.checkFormHasValue();
  }

  removeDetail(i: number): void {
    if (this.editors[i]) {
      try {
        this.editors[i].destroy();
      } catch (error) {
        console.warn('Error destroying editor:', error);
      }
      this.editors.splice(i, 1);
    }
    this.detailArray().removeAt(i);
    this.checkFormHasValue();
  }

  checkFormHasValue(): void {
    const hasValue = this.detailArray().controls.some((control) => {
      const formGroup = control as FormGroup;
      const dietDetail = formGroup.get('dietDetail')?.value;
      const recipeIds = formGroup.get('recipeIds')?.value;
      return (dietDetail && dietDetail.trim() !== '') || (recipeIds && recipeIds.length > 0);
    });
    this.formHasValue.set(hasValue);
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
      const res = await this.apiService.getDietTemplateDetail(this.dietTemplateId, this.cycleNo, this.dayNo, params);
      this.dietPlanDetail.set(res.diet);
      this.recipeList.set(res.recipes as IDropdownItem[]);
      const diet = res.diet;
      this.formGroup.patchValue({
        dietTemplateId: diet.dietTemplateId,
        cycleNo: diet.cycleNo,
        dayNo: diet.dayNo
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
          console.warn('Error destroying editor:', error);
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
      console.error('Error loading diet template detail:', error);
      this.snackBar.open('Failed to load diet template detail', 'Close', { duration: 3000 });
    }
  }

  onCancel() {
    this.router.navigate(['/diet-template']);
  }

  async onSubmit() {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    try {
      const payload = {
        startDate: null,
        endDate: null,
        cycleNo: this.formGroup.value.cycleNo,
        dietTemplateId: this.formGroup.value.dietTemplateId,
        dietPlan: this.formGroup.value.dietPlan
      };
      if (this.dayNo && this.dayNo > 0) {
        payload.dayNo = this.formGroup.value.dayNo;
      }
      await this.apiService.createDietTemplateDetail(this.dietTemplateId, payload);
      this.snackBar.open('Diet Template Saved Successfully.', 'Close', { duration: 3000 });
      this.router.navigate(['/diet-template']);
    } catch (error) {
      console.error('Error saving diet template:', error);
      this.snackBar.open('Failed to save diet template', 'Close', { duration: 3000 });
    }
  }
}

