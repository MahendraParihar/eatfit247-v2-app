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
import { InputErrorComponent, ValidationUtil } from '@shared';
import { LovMasterApiService } from '../../api.service';
import { IFaqCategory, IManageFaqCategory, InputLengthEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-faq-category',
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
    InputErrorComponent
  ],
  templateUrl: './manage-faq-category.html',
  styleUrl: './manage-faq-category.scss'
})
export class ManageFaqCategory implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(LovMasterApiService);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    faqCategory: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    url: ['', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
    active: [true, [Validators.required]]
  });
  initialData!: IFaqCategory;
  isEditMode = false;
  pageTitle = 'Create FAQ Category';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit FAQ Category';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create FAQ Category';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      faqCategory: [
        this.initialData?.faqCategory || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_50)
        ]
      ],
      url: [this.initialData?.url || '', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
      active: [this.initialData?.active !== undefined ? this.initialData.active : true]
    });
  }

  async loadData(id: number): Promise<void> {
    this.initialData = await this.apiService.getFaqCategoryById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageFaqCategory = { ...this.formGroup.value };
      if (!formValue.url) {
        delete formValue.url;
      }
      if (this.isEditMode && this.initialData) {
        formValue.faqCategoryId = this.initialData.faqCategoryId;
        await this.apiService.updateFaqCategory(this.initialData.faqCategoryId, formValue);
      } else {
        await this.apiService.createFaqCategory(formValue);
      }
      this.router.navigate(['/lov-master/faq-category']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/lov-master/faq-category']);
  }
}
