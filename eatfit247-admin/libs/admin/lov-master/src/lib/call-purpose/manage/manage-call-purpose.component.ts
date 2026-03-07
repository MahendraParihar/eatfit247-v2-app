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
import { FileTypeEnum, ICallPurpose, IManageCallPurpose, InputLengthEnum, MediaForEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-call-purpose',
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
  templateUrl: './manage-call-purpose.html',
  styleUrl: './manage-call-purpose.scss'
})
export class ManageCallPurpose implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(LovMasterApiService);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    callPurpose: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    active: [true, [Validators.required]]
  });
  initialData!: ICallPurpose;
  mediaFor = MediaForEnum.CALL_PURPOSE;
  mediaType = FileTypeEnum.IMAGE;
  isEditMode = false;
  pageTitle = 'Create Call Purpose';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Call Purpose';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Call Purpose';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      callPurpose: [
        this.initialData?.callPurpose || '',
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
    this.initialData = await this.apiService.getCallPurposeById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageCallPurpose = { ...this.formGroup.value };
      const uploadFilesControl = this.formGroup.get('imagePath');
      if (uploadFilesControl && uploadFilesControl.value && uploadFilesControl.value.length > 0) {
        formValue.imagePath = uploadFilesControl.value;
      }
      if (this.isEditMode && this.initialData) {
        formValue.callPurposeId = this.initialData.callPurposeId;
        await this.apiService.updateCallPurpose(this.initialData.callPurposeId, formValue);
      } else {
        await this.apiService.createCallPurpose(formValue);
      }
      this.router.navigate(['/lov-master/call-purpose']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/lov-master/call-purpose']);
  }
}
