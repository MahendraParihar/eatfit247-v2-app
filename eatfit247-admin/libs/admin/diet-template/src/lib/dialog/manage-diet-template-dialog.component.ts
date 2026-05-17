import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InputErrorComponent, ValidationUtil } from '@shared';
import { DietTemplateApiService } from '../api.service';
import { IDietTemplate, IDropdownItem, IManageDietTemplate, InputLengthEnum } from '@eatfit247-shared-lib';

export interface ManageDietTemplateDialogData {
  dietTemplate?: IDietTemplate;
}

@Component({
  selector: 'lib-manage-diet-template-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    InputErrorComponent
  ],
  templateUrl: './manage-diet-template-dialog.component.html',
  styleUrl: './manage-diet-template-dialog.component.scss'
})
export class ManageDietTemplateDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<ManageDietTemplateDialogComponent>>(MatDialogRef);
  data = inject<ManageDietTemplateDialogData>(MAT_DIALOG_DATA);
  private apiService = inject(DietTemplateApiService);
  private fb = inject(FormBuilder);

  formGroup!: FormGroup;
  isEditMode = false;
  loading = false;
  programs: IDropdownItem[] = [];
  InputLengthEnum = InputLengthEnum;

  constructor() {
    const data = this.data;

    this.initializeForm();
    this.isEditMode = !!data.dietTemplate;
  }

  async ngOnInit(): Promise<void> {
    await this.loadPrograms();
    if (this.isEditMode && this.data.dietTemplate) {
      await this.loadData();
    }
  }

  private initializeForm(): void {
    this.formGroup = this.fb.group({
      dietTemplate: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_100)]],
      noOfCycle: [null, [Validators.required, Validators.min(1)]],
      noOfDaysInCycle: [null, [Validators.required, Validators.min(1), Validators.max(365)]],
      programId: [null],
    });
  }

  private async loadPrograms(): Promise<void> {
    try {
      this.programs = await this.apiService.getProgramDropdown();
    } catch {
      this.programs = [];
    }
  }

  private async loadData(): Promise<void> {
    if (this.data.dietTemplate) {
      try {
        const template = await this.apiService.getById(this.data.dietTemplate.dietTemplateId);
        this.formGroup.patchValue({
          dietTemplate: template.dietTemplate,
          noOfCycle: template.noOfCycle,
          noOfDaysInCycle: template.noOfDaysInCycle,
          programId: template.programId ?? null
        });
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
      }
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      this.loading = true;
      try {
        const raw = this.formGroup.value;
        const formValue: IManageDietTemplate = {
          ...raw,
          programId: raw.programId ?? undefined,
        };
        if (this.isEditMode && this.data.dietTemplate) {
          formValue.dietTemplateId = this.data.dietTemplate.dietTemplateId;
          await this.apiService.update(this.data.dietTemplate.dietTemplateId, formValue);
        } else {
          await this.apiService.create(formValue);
        }
        this.dialogRef.close(true);
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
      } finally {
        this.loading = false;
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

