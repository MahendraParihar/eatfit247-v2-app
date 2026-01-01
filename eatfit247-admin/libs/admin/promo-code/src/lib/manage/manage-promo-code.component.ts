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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InputErrorComponent } from '@shared';
import { PromoCodeApiService } from '../api.service';
import { IPromoCode } from '@eatfit247-shared-lib';
import { DiscountTypeEnum, InputLengthEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-promo-code',
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
    MatDatepickerModule,
    MatNativeDateModule,
    InputErrorComponent
  ],
  templateUrl: './manage-promo-code.html',
  styleUrl: './manage-promo-code.scss'
})
export class ManagePromoCode implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    discountType: ['', [Validators.required]],
    discountValue: ['', [Validators.required, Validators.min(0)]],
    maxDiscount: ['', [Validators.min(0)]],
    minOrderAmount: ['', [Validators.min(0)]],
    usageLimit: ['', [Validators.min(1)]],
    active: [true, [Validators.required]],
    expiresAt: ['']
  });
  initialData!: IPromoCode;
  isEditMode = false;
  pageTitle = 'Create Promo Code';
  discountTypeOptions = [
    { value: DiscountTypeEnum.FLAT, label: 'Flat' },
    { value: DiscountTypeEnum.PERCENT, label: 'Percent' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: PromoCodeApiService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Promo Code';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Promo Code';
    }
    this.patchFormValues();
  }

  private patchFormValues(): void {
    if (this.initialData) {
      const expiresAt = this.initialData.expiresAt
        ? (typeof this.initialData.expiresAt === 'string' ? new Date(this.initialData.expiresAt) : this.initialData.expiresAt)
        : null;
      this.formGroup.patchValue({
        code: this.initialData.code || '',
        discountType: this.initialData.discountType || '',
        discountValue: this.initialData.discountValue || '',
        maxDiscount: this.initialData.maxDiscount || '',
        minOrderAmount: this.initialData.minOrderAmount || '',
        usageLimit: this.initialData.usageLimit || '',
        active: this.initialData.active !== undefined ? this.initialData.active : true,
        expiresAt: expiresAt
      });
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
      this.patchFormValues();
    } catch (error) {
      console.error('Error loading promo code:', error);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.formGroup.value;
      const data = {
        code: formValue.code,
        discountType: formValue.discountType,
        discountValue: parseFloat(formValue.discountValue),
        maxDiscount: formValue.maxDiscount ? parseFloat(formValue.maxDiscount) : null,
        minOrderAmount: formValue.minOrderAmount ? parseFloat(formValue.minOrderAmount) : null,
        usageLimit: formValue.usageLimit ? parseInt(formValue.usageLimit, 10) : null,
        active: formValue.active,
        expiresAt: formValue.expiresAt ? new Date(formValue.expiresAt) : null
      };

      if (this.isEditMode && this.initialData) {
        await this.apiService.update(this.initialData.promoCodeId, data);
      } else {
        await this.apiService.create(data);
      }

      this.router.navigate(['../'], { relativeTo: this.route });
    } catch (error) {
      console.error('Error saving promo code:', error);
    }
  }

  onCancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}

