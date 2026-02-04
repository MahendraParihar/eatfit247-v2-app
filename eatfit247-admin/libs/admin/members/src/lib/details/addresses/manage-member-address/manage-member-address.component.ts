import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent } from '@shared';
import { IAddress, IAddressMaster, IDropdownItem, IManageAddress } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';

export interface ManageMemberAddressData {
  memberId: number;
  address?: IAddress;
}

@Component({
  selector: 'lib-manage-member-address',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    InputErrorComponent,
  ],
  templateUrl: './manage-member-address.component.html',
  styleUrl: './manage-member-address.component.scss',
})
export class ManageMemberAddressComponent implements OnInit {
  formGroup!: FormGroup;
  masterData = signal<IAddressMaster | null>(null);
  loading = signal(false);
  submitting = signal(false);
  isEditMode = false;
  filteredStates: IDropdownItem[] = [];

  constructor(
    public dialogRef: MatDialogRef<ManageMemberAddressComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ManageMemberAddressData,
    private apiService: MembersApiService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
    this.isEditMode = !!data.address;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMasterData();
    if (this.isEditMode && this.data.address) {
      this.populateForm(this.data.address);
    }
  }

  private initializeForm(): void {
    this.formGroup = this.fb.group({
      addressName: [''],
      postalAddress: ['', [Validators.required]],
      cityVillage: [''],
      countryId: [null, [Validators.required]],
      stateId: [null, [Validators.required]],
      pinCode: [''],
      latitude: [null],
      longitude: [null],
    });

    // Filter states when country changes
    this.formGroup.get('countryId')?.valueChanges.subscribe((countryId) => {
      this.filterStatesByCountry(countryId);
      // Reset state when country changes
      this.formGroup.patchValue({ stateId: null });
    });
  }

  private async loadMasterData(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.apiService.getAddressMasterData();
      this.masterData.set(data);
      if (this.isEditMode && this.data.address) {
        this.filterStatesByCountry(this.data.address.countryId);
      }
    } catch (error) {
      this.snackBar.open('Failed to load address data', 'Close', {
        duration: 3000,
      });
    } finally {
      this.loading.set(false);
    }
  }

  private filterStatesByCountry(countryId: number | null): void {
    if (!countryId || !this.masterData()) {
      this.filteredStates = [];
      return;
    }
    this.filteredStates = (this.masterData()?.state || []).filter(
      (state) => state.parentId === countryId
    );
  }

  private populateForm(address: IAddress): void {
    this.formGroup.patchValue({
      addressName: address.addressName || '',
      postalAddress: address.postalAddress,
      cityVillage: address.cityVillage || '',
      countryId: address.countryId,
      stateId: address.stateId,
      pinCode: address.pinCode || '',
      latitude: address.latitude ? Number(address.latitude) : null,
      longitude: address.longitude ? Number(address.longitude) : null,
    });
    this.filterStatesByCountry(address.countryId);
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      const formValue = this.formGroup.value;
      const addressData: IManageAddress = {
        addressName: formValue.addressName || undefined,
        postalAddress: formValue.postalAddress,
        cityVillage: formValue.cityVillage || undefined,
        countryId: formValue.countryId,
        stateId: formValue.stateId,
        pinCode: formValue.pinCode || undefined,
        latitude: formValue.latitude || undefined,
        longitude: formValue.longitude || undefined,
        tableId: 2, // TableEnum.TXN_MEMBER
        pkOfTable: this.data.memberId,
      };

      if (this.isEditMode && this.data.address) {
        addressData.addressId = this.data.address.addressId;
        await this.apiService.updateAddress(
          this.data.memberId,
          this.data.address.addressId,
          addressData
        );
        this.snackBar.open('Address updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        await this.apiService.createAddress(this.data.memberId, addressData);
        this.snackBar.open('Address created successfully', 'Close', {
          duration: 3000,
        });
      }

      this.dialogRef.close(true);
    } catch (error) {
      this.snackBar.open(
        `Failed to ${this.isEditMode ? 'update' : 'create'} address`,
        'Close',
        { duration: 3000 }
      );
    } finally {
      this.submitting.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

