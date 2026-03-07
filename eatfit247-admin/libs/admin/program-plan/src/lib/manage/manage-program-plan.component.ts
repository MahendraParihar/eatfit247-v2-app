import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Editor, NgxEditorComponent, NgxEditorMenuComponent } from 'ngx-editor';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { ProgramPlanApiService } from '../api.service';
import {
  FileTypeEnum,
  IDropdownItem,
  IManageProgramPlan,
  InputLengthEnum,
  IProgramPlan,
  MediaForEnum
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-program-plan',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCardModule,
    MatCheckboxModule,
    MatSnackBarModule,
    FormsModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    InputErrorComponent,
    UploadFormComponent
  ],
  templateUrl: './manage-program-plan.html',
  styleUrl: './manage-program-plan.scss'
})
export class ManageProgramPlan implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ProgramPlanApiService);
  private snackBar = inject(MatSnackBar);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    plan: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)]],
    programPlanTypeId: ['', [Validators.required]],
    details: [''],
    sequenceNumber: [0, [Validators.required, Validators.min(0)]],
    noOfCycle: [1, [Validators.required, Validators.min(1)]],
    noOfDaysInCycle: [1, [Validators.required, Validators.min(1)]],
    isOnline: [true, [Validators.required]],
    isVisibleOnWeb: [false, [Validators.required]],
    active: [true, [Validators.required]],
    url: ['']
  });
  initialData!: IProgramPlan;
  isEditMode = false;
  pageTitle = 'Create Program Plan';
  programPlanTypeOptions: IDropdownItem[] = [];
  currencyOptions: IDropdownItem[] = [];
  mediaFor = MediaForEnum.PROGRAM;
  mediaType = FileTypeEnum.IMAGE;
  editor: Editor | null = null;

  async ngOnInit(): Promise<void> {
    this.initializeEditor();
    await this.loadMasterData();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Program Plan';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Program Plan';
    }
    this.patchFormValues();
  }

  private initializeEditor(): void {
    if (!this.editor) {
      this.editor = new Editor();
    }
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.formGroup.patchValue({
        plan: this.initialData.plan || '',
        programPlanTypeId: this.initialData.programPlanTypeId || '',
        details: this.initialData.details || '',
        sequenceNumber: this.initialData.sequenceNumber || 0,
        noOfCycle: this.initialData.noOfCycle || 1,
        noOfDaysInCycle: this.initialData.noOfDaysInCycle || 1,
        isOnline: this.initialData.isOnline !== undefined ? this.initialData.isOnline : true,
        isVisibleOnWeb: this.initialData.isVisibleOnWeb !== undefined ? this.initialData.isVisibleOnWeb : false,
        active: this.initialData.active !== undefined ? this.initialData.active : true
      });
      // Populate fees form array if editing
      if (this.initialData.programPlanFees && this.initialData.programPlanFees.length > 0) {
        // Clear existing fees first
        while (this.feesFormArray.length !== 0) {
          this.feesFormArray.removeAt(0);
        }
        // Add fees from initial data
        this.initialData.programPlanFees.forEach(fee => {
          this.addFeeFormGroup(fee.currencyCode, fee.fees);
        });
      }
    }
  }

  get feesFormArray(): FormArray {
    return this.formGroup.get('programPlanFees') as FormArray;
  }

  addFeeFormGroup(currencyCode: string = '', fees: number = 0): void {
    const feeGroup = this.fb.group({
      currencyCode: [currencyCode, [Validators.required]],
      fees: [fees, [Validators.required, Validators.min(0)]]
    });
    this.feesFormArray.push(feeGroup);
  }

  removeFeeFormGroup(index: number): void {
    this.feesFormArray.removeAt(index);
  }

  addFee(): void {
    this.addFeeFormGroup();
  }

  async loadMasterData(): Promise<void> {
    try {
      const masterData = await this.apiService.getMasterData();
      this.programPlanTypeOptions = masterData.programPlanType || [];
      this.currencyOptions = masterData.currencies || [];
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      this.snackBar.open('Failed to load program plan. Please try again.', 'Close', {
        duration: 5000,
      });
      this.router.navigate(['/program-plans']);
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageProgramPlan = { ...this.formGroup.value };
      // Extract fees from a form array
      formValue.programPlanFees = this.feesFormArray.value.map((fee: any) => ({
        currencyCode: fee.currencyCode,
        fees: fee.fees
      }));
      // Handle imagePath from upload form - read directly from FormArray control
      const imagePathControl = this.formGroup.get('imagePath');
      if (imagePathControl) {
        const imagePathValue = imagePathControl.value;
        if (Array.isArray(imagePathValue) && imagePathValue.length > 0) {
          formValue.imagePath = imagePathValue;
        } else {
          formValue.imagePath = undefined;
        }
      } else {
        formValue.imagePath = undefined;
      }
      try {
        if (this.isEditMode && this.initialData) {
          formValue.programPlanId = this.initialData.programPlanId;
          await this.apiService.update(this.initialData.programPlanId, formValue);
          this.snackBar.open('Program plan updated successfully', 'Close', {
            duration: 3000,
          });
        } else {
          await this.apiService.create(formValue);
          this.snackBar.open('Program plan created successfully', 'Close', {
            duration: 3000,
          });
        }
        this.router.navigate(['/program-plans']);
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/program-plans']);
  }

  ngOnDestroy(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
      } catch {
        // Ignore destroy errors
      }
      this.editor = null as any;
    }
  }
}
