import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { LovMasterApiService } from '../../api.service';
import {
  FileTypeEnum,
  IHealthParameter,
  IManageHealthParameter,
  InputLengthEnum,
  MediaForEnum
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-health-parameter',
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
    InputErrorComponent,
    UploadFormComponent
  ],
  templateUrl: './manage-health-parameter.html',
  styleUrl: './manage-health-parameter.scss'
})
export class ManageHealthParameter implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(LovMasterApiService);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    healthParameter: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    hintText: ['', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
    isLength: [false, [Validators.required]],
    sequence: [0, [Validators.required, Validators.min(0)]],
    fieldType: ['', [Validators.required]],
    requiredField: [false, [Validators.required]],
    active: [true, [Validators.required]]
  });
  initialData!: IHealthParameter;
  mediaFor = MediaForEnum.HEALTH_PARAMETER;
  mediaType = FileTypeEnum.IMAGE;
  isEditMode = false;
  pageTitle = 'Create Health Parameter';
  fieldTypeOptions = ['text', 'number', 'select', 'textarea', 'date'];

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Health Parameter';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Health Parameter';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      healthParameter: [
        this.initialData?.healthParameter || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_50)
        ]
      ],
      hintText: [this.initialData?.hintText || '', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
      isLength: [this.initialData?.isLength !== undefined ? this.initialData.isLength : false, [Validators.required]],
      sequence: [this.initialData?.sequence || 0, [Validators.required, Validators.min(0)]],
      fieldType: [this.initialData?.fieldType || '', [Validators.required]],
      requiredField: [this.initialData?.requiredField !== undefined ? this.initialData.requiredField : false, [Validators.required]],
      active: [this.initialData?.active !== undefined ? this.initialData.active : true]
    });
  }

  async loadData(id: number): Promise<void> {
    this.initialData = await this.apiService.getHealthParameterById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageHealthParameter = { ...this.formGroup.value };
      const uploadFilesControl = this.formGroup.get('imagePath');
      if (uploadFilesControl && uploadFilesControl.value && uploadFilesControl.value.length > 0) {
        formValue.imagePath = uploadFilesControl.value;
      }
      if (this.isEditMode && this.initialData) {
        formValue.healthParameterId = this.initialData.healthParameterId;
        await this.apiService.updateHealthParameter(this.initialData.healthParameterId, formValue);
      } else {
        await this.apiService.createHealthParameter(formValue);
      }
      this.router.navigate(['/lov-master/health-parameter']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/lov-master/health-parameter']);
  }
}
