import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { InputErrorComponent, ValidationUtil } from '@shared';
import { DietTemplateApiService } from '../api.service';
import { IDietTemplate, IManageDietTemplate, InputLengthEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-diet-template',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    InputErrorComponent,
  ],
  templateUrl: './manage-diet-template.html',
  styleUrl: './manage-diet-template.scss',
})
export class ManageDietTemplateComponent implements OnInit, OnDestroy {
  formGroup!: FormGroup;
  initialData: IDietTemplate | null = null;
  isEditMode = false;
  pageTitle = 'Create Diet Template';
  InputLengthEnum = InputLengthEnum;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: DietTemplateApiService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Diet Template';
      this.loadData(+id);
    } else {
      this.pageTitle = 'Create Diet Template';
    }
  }

  ngOnDestroy(): void {}

  private initializeForm(): void {
    this.formGroup = this.fb.group({
      dietTemplate: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_100)]],
      cycleNo: [null, [Validators.required, Validators.min(1)]],
      dayNo: [null, [Validators.required, Validators.min(1)]],
      noOfCycle: [null, [Validators.min(1)]],
      noOfDaysInCycle: [null, [Validators.min(1)]],
      isWeekly: [false, [Validators.required]],
    });
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
      if (this.initialData) {
        this.formGroup.patchValue({
          dietTemplate: this.initialData.dietTemplate || '',
          cycleNo: this.initialData.cycleNo || null,
          dayNo: this.initialData.dayNo || null,
          noOfCycle: this.initialData.noOfCycle || null,
          noOfDaysInCycle: this.initialData.noOfDaysInCycle || null,
          isWeekly: this.initialData.isWeekly !== undefined ? this.initialData.isWeekly : false,
        });
      }
    } catch (error) {
      console.error('Error loading diet template:', error);
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageDietTemplate = {
        ...this.formGroup.value,
      };

      if (this.isEditMode && this.initialData) {
        formValue.dietTemplateId = this.initialData.dietTemplateId;
        await this.apiService.update(this.initialData.dietTemplateId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/diet-template']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/diet-template']);
  }
}
