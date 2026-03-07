import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent, ValidationUtil } from '@shared';
import { WarehousesApiService } from '../api.service';
import { IWarehouse, IManageWarehouse, IDropdownItem, InputLengthEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-warehouse',
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
    MatSnackBarModule,
    InputErrorComponent
  ],
  templateUrl: './manage-warehouse.html',
  styleUrl: './manage-warehouse.scss'
})
export class ManageWarehouse implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.CHAR_2),
        Validators.maxLength(150)
      ]
    ],
    contactName: ['', [Validators.maxLength(150)]],
    email: ['', [Validators.maxLength(150), Validators.email]],
    phone: ['', [Validators.maxLength(20)]],
    addressLine1: ['', [Validators.required]],
    addressLine2: [''],
    city: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.CHAR_2),
        Validators.maxLength(100)
      ]
    ],
    stateId: [null as number | null, [Validators.required]],
    countryId: [null as number | null, [Validators.required]],
    pinCode: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.CHAR_2),
        Validators.maxLength(10)
      ]
    ],
    latitude: [null as number | null],
    longitude: [null as number | null],
    active: [true, [Validators.required]]
  });
  initialData!: IWarehouse;
  isEditMode = false;
  pageTitle = 'Create Warehouse';
  countryOptions: IDropdownItem[] = [];
  stateOptions: IDropdownItem[] = [];
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(WarehousesApiService);
  private snackBar = inject(MatSnackBar);

  async ngOnInit(): Promise<void> {
    this.countryOptions = await this.apiService.getCountryDropdown();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Warehouse';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Warehouse';
    }
    this.patchFormValues();
  }

  async onCountryChange(): Promise<void> {
    const countryId = this.formGroup.get('countryId')?.value;
    this.stateOptions = countryId ? await this.apiService.getStateDropdown(countryId) : [];
    this.formGroup.patchValue({ stateId: null });
  }

  private async patchFormValues(): Promise<void> {
    if (this.initialData) {
      this.formGroup.patchValue({
        name: this.initialData.name ?? '',
        contactName: this.initialData.contactName ?? '',
        email: this.initialData.email ?? '',
        phone: this.initialData.phone ?? '',
        addressLine1: this.initialData.addressLine1 ?? '',
        addressLine2: this.initialData.addressLine2 ?? '',
        city: this.initialData.city ?? '',
        stateId: this.initialData.stateId ?? null,
        countryId: this.initialData.countryId ?? null,
        pinCode: this.initialData.pinCode ?? '',
        latitude: this.initialData.latitude ?? null,
        longitude: this.initialData.longitude ?? null,
        active: this.initialData.active !== undefined ? this.initialData.active : true
      });
      if (this.initialData.countryId) {
        this.stateOptions = await this.apiService.getStateDropdown(this.initialData.countryId);
      }
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageWarehouse = this.formGroup.value;
      if (this.isEditMode && this.initialData) {
        await this.apiService.update(this.initialData.warehouseId, formValue);
        this.snackBar.open('Warehouse updated successfully', 'Close', { duration: 3000 });
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open('Warehouse created successfully', 'Close', { duration: 3000 });
      }
      this.router.navigate(['/delivery/warehouses']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/delivery/warehouses']);
  }

  ngOnDestroy(): void {
    // Component cleanup
  }
}
