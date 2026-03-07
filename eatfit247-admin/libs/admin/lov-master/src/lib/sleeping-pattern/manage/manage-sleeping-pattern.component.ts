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
import { LovMasterApiService } from '../../api.service';
import {
  FileTypeEnum,
  IManageSleepingPattern,
  InputLengthEnum,
  ISleepingPattern,
  MediaForEnum
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-sleeping-pattern',
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
  templateUrl: './manage-sleeping-pattern.html',
  styleUrl: './manage-sleeping-pattern.scss'
})
export class ManageSleepingPattern implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(LovMasterApiService);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    sleepingPattern: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    active: [true, [Validators.required]]
  });
  initialData!: ISleepingPattern;
  mediaFor = MediaForEnum.SLEEPING_PATTERN;
  mediaType = FileTypeEnum.IMAGE;
  isEditMode = false;
  pageTitle = 'Create Sleeping Pattern';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Sleeping Pattern';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Sleeping Pattern';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      sleepingPattern: [
        this.initialData?.sleepingPattern || '',
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
    this.initialData = await this.apiService.getSleepingPatternById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageSleepingPattern = { ...this.formGroup.value };
      const uploadFilesControl = this.formGroup.get('imagePath');
      if (uploadFilesControl && uploadFilesControl.value && uploadFilesControl.value.length > 0) {
        formValue.imagePath = uploadFilesControl.value;
      }
      if (this.isEditMode && this.initialData) {
        formValue.sleepingPatternId = this.initialData.sleepingPatternId;
        await this.apiService.updateSleepingPattern(this.initialData.sleepingPatternId, formValue);
      } else {
        await this.apiService.createSleepingPattern(formValue);
      }
      this.router.navigate(['/lov-master/sleeping-pattern']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/lov-master/sleeping-pattern']);
  }
}
