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
import { IAddressType, IManageAddressType, InputLengthEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-address-type',
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
  templateUrl: './manage-address-type.html',
  styleUrl: './manage-address-type.scss'
})
export class ManageAddressType implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    addressType: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    active: [true, [Validators.required]]
  });
  initialData!: IAddressType;
  isEditMode = false;
  pageTitle = 'Create Address Type';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: LovMasterApiService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Address Type';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Address Type';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      addressType: [
        this.initialData?.addressType || '',
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
    this.initialData = await this.apiService.getAddressTypeById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageAddressType = { ...this.formGroup.value };
      if (this.isEditMode && this.initialData) {
        formValue.addressTypeId = this.initialData.addressTypeId;
        await this.apiService.updateAddressType(this.initialData.addressTypeId, formValue);
      } else {
        await this.apiService.createAddressType(formValue);
      }
      this.router.navigate(['/lov-master/address-type']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/lov-master/address-type']);
  }
}
