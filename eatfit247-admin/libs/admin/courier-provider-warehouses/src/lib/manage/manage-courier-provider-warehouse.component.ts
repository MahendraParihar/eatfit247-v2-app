import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent, ValidationUtil } from '@shared';
import { CourierProviderWarehousesApiService } from '../api.service';
import {
  ICourierProviderWarehouse,
  IDropdownItem,
  IManageCourierProviderWarehouse,
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-courier-provider-warehouse',
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
    InputErrorComponent,
  ],
  templateUrl: './manage-courier-provider-warehouse.html',
  styleUrl: './manage-courier-provider-warehouse.scss',
})
export class ManageCourierProviderWarehouse implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    warehouseId: [null as number | null, [Validators.required]],
    courierProviderId: [null as number | null, [Validators.required]],
    providerWarehouseId: ['', [Validators.maxLength(100)]],
    providerWarehouseName: ['', [Validators.maxLength(150)]],
    active: [true, [Validators.required]],
  });
  initialData!: ICourierProviderWarehouse;
  isEditMode = false;
  pageTitle = 'Create Provider Warehouse Mapping';
  warehouseOptions: IDropdownItem[] = [];
  providerOptions: IDropdownItem[] = [];
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(CourierProviderWarehousesApiService);
  private snackBar = inject(MatSnackBar);

  async ngOnInit(): Promise<void> {
    this.warehouseOptions = await this.apiService.getWarehouseDropdown();
    this.providerOptions = await this.apiService.getCourierProviderDropdown();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Provider Warehouse Mapping';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Provider Warehouse Mapping';
    }
    this.patchFormValues();
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.formGroup.patchValue({
        warehouseId: this.initialData.warehouseId ?? null,
        courierProviderId: this.initialData.courierProviderId ?? null,
        providerWarehouseId: this.initialData.providerWarehouseId ?? '',
        providerWarehouseName: this.initialData.providerWarehouseName ?? '',
        active:
          this.initialData.active !== undefined
            ? this.initialData.active
            : true,
      });
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
      const formValue: IManageCourierProviderWarehouse = this.formGroup.value;
      if (this.isEditMode && this.initialData) {
        await this.apiService.update(
          this.initialData.courierProviderWarehouseId,
          formValue
        );
        this.snackBar.open(
          'Provider warehouse mapping updated successfully',
          'Close',
          { duration: 3000 }
        );
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open(
          'Provider warehouse mapping created successfully',
          'Close',
          { duration: 3000 }
        );
      }
      this.router.navigate(['/delivery/courier-provider-warehouses']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/delivery/courier-provider-warehouses']);
  }

  ngOnDestroy(): void {
    // Component cleanup
  }
}
