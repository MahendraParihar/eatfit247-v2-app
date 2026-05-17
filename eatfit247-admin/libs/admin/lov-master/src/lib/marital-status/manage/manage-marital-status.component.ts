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
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { MaritalStatusApiService } from '../../api.service';
import {
  FileTypeEnum,
  IManageMaritalStatus,
  IMaritalStatus,
  InputLengthEnum,
  MediaForEnum
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-marital-status',
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
    InputErrorComponent,
    UploadFormComponent
  ],
  templateUrl: './manage-marital-status.html',
  styleUrl: './manage-marital-status.scss'
})
export class ManageMaritalStatus implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(MaritalStatusApiService);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    maritalStatus: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    active: [true, [Validators.required]]
  });
  initialData!: IMaritalStatus;
  mediaFor = MediaForEnum.MARITAL_STATUS;
  mediaType = FileTypeEnum.IMAGE;
  isEditMode = false;
  pageTitle = 'Create Marital Status';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Marital Status';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Marital Status';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      maritalStatus: [
        this.initialData?.maritalStatus || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_50)
        ]
      ],
      active: [this.initialData?.active !== undefined ? this.initialData.active : true]
    });
  }

  async loadData(id: number): Promise<void> {
    this.initialData = await this.apiService.getById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageMaritalStatus = { ...this.formGroup.value };
      const uploadFilesControl = this.formGroup.get('imagePath');
      if (uploadFilesControl && uploadFilesControl.value && uploadFilesControl.value.length > 0) {
        formValue.imagePath = uploadFilesControl.value;
      }
      if (this.isEditMode && this.initialData) {
        formValue.maritalStatusId = this.initialData.maritalStatusId;
        await this.apiService.update(this.initialData.maritalStatusId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/lov-master/marital-status']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/lov-master/marital-status']);
  }
}
