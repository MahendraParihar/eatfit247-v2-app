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
import { FaqApiService } from '../api.service';
import { IFaq, IManageFaq, InputLengthEnum, IDropdownItem } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-faq',
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
  templateUrl: './manage-faq.html',
  styleUrl: './manage-faq.scss'
})
export class ManageFaq implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    faq: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_500)]],
    faqCategoryId: ['', [Validators.required]],
    answer: ['', [Validators.required]],
    active: [true, [Validators.required]]
  });
  initialData!: IFaq;
  isEditMode = false;
  pageTitle = 'Create FAQ';
  faqCategoryOptions: IDropdownItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: FaqApiService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    await this.loadMasterData();
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit FAQ';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create FAQ';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      faq: [
        this.initialData?.faq || '',
        [
          Validators.required,
          Validators.maxLength(InputLengthEnum.CHAR_500)
        ]
      ],
      faqCategoryId: [
        this.initialData?.faqCategoryId || '',
        [Validators.required]
      ],
      answer: [
        this.initialData?.answer || '',
        [Validators.required]
      ],
      active: [this.initialData?.active !== undefined ? this.initialData.active : true, [Validators.required]]
    });
  }

  async loadMasterData(): Promise<void> {
    try {
      const masterData = await this.apiService.getMasterData();
      this.faqCategoryOptions = masterData.faqCategory || [];
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      console.error('Error loading FAQ:', error);
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageFaq = { ...this.formGroup.value };
      if (this.isEditMode && this.initialData) {
        formValue.faqId = this.initialData.faqId;
        await this.apiService.update(this.initialData.faqId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/faq']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/faq']);
  }
}
