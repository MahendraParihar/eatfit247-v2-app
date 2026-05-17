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
import { CountryApiService } from '../../api.service';
import { ICountry, IManageCountry, InputLengthEnum, TaxTypeEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-country',
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
  templateUrl: './manage-country.html',
  styleUrl: './manage-country.scss'
})
export class ManageCountry implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(CountryApiService);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    country: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.CHAR_2),
        Validators.maxLength(InputLengthEnum.CHAR_50)
      ]
    ],
    countryCode: [
      '',
      [
        Validators.required, Validators.maxLength(
        InputLengthEnum.MAX_COUNTRY_CODE
      )
      ]
    ],
    phoneNumberCode: [
      '',
      [Validators.maxLength(InputLengthEnum.MAX_COUNTRY_CODE)]
    ],
    taxType: [TaxTypeEnum.NONE, [Validators.required]],
    defaultTaxPercentage: [
      0,
      [Validators.required, Validators.min(0), Validators.max(100)]
    ],
    active: [true, [Validators.required]]
  });
  initialData!: ICountry;
  isEditMode = false;
  pageTitle = 'Create Country';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Country';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Country';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      country: [
        this.initialData?.country || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_50)
        ]
      ],
      countryCode: [
        this.initialData?.countryCode || '',
        [Validators.maxLength(InputLengthEnum.MAX_COUNTRY_CODE)]
      ],
      phoneNumberCode: [
        this.initialData?.phoneNumberCode || '',
        [Validators.maxLength(InputLengthEnum.MAX_COUNTRY_CODE)]
      ],
      taxType: [
        this.initialData?.taxType || TaxTypeEnum.NONE,
        [Validators.required]
      ],
      defaultTaxPercentage: [
        this.initialData?.defaultTaxPercentage || 0,
        [Validators.required, Validators.min(0), Validators.max(100)]
      ],
      active: [
        this.initialData?.active !== undefined ? this.initialData.active : true
      ]
    });
  }

  async loadData(id: number): Promise<void> {
    this.initialData = await this.apiService.getById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageCountry = { ...this.formGroup.value };
      if (!formValue.phoneNumberCode) {
        delete formValue.phoneNumberCode;
      }
      if (this.isEditMode && this.initialData) {
        formValue.countryId = this.initialData.countryId;
        await this.apiService.update(
          this.initialData.countryId,
          formValue
        );
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/lov-master/country']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/lov-master/country']);
  }
}
