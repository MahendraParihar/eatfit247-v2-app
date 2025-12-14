import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InputErrorComponent } from '../input-error/input-error.component';
import { IDropdownItem, InputLengthEnum } from '@eatfit247-shared-lib';

export interface AddressFormData {
  address?: string;
  pinCode?: string;
  latitude?: string;
  longitude?: string;
  countryId?: number;
  stateId?: number;
}

export interface AddressMasterData {
  countries: IDropdownItem[];
  states: IDropdownItem[];
}

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    InputErrorComponent,
  ],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.scss',
})
export class AddressFormComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() address?: AddressFormData;
  @Input() masterData?: AddressMasterData;

  addressFormGroup: FormGroup = new FormGroup({
    address: new FormControl(null, [Validators.required, Validators.maxLength(500)]),
    pinCode: new FormControl(null, [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_10)]),
    latitude: new FormControl(null, [Validators.maxLength(InputLengthEnum.CHAR_50)]),
    longitude: new FormControl(null, [Validators.maxLength(InputLengthEnum.CHAR_50)]),
    countryId: new FormControl(null, [Validators.required]),
    stateId: new FormControl(null, [Validators.required]),
  });

  filteredStates: IDropdownItem[] = [];

  ngOnInit(): void {
    this.formGroup.addControl('address', this.addressFormGroup);
    this.bindAddress();
    
    // Watch for country changes to filter states
    this.addressFormGroup.get('countryId')?.valueChanges.subscribe((countryId) => {
      this.filterStates(countryId);
    });
  }

  private bindAddress(): void {
    if (!this.address) {
      return;
    }
    this.filterStates(this.address.countryId);
    this.addressFormGroup.patchValue({
      address: this.address.address,
      pinCode: this.address.pinCode,
      latitude: this.address.latitude,
      longitude: this.address.longitude,
      countryId: this.address.countryId,
      stateId: this.address.stateId,
    });
  }

  private filterStates(countryId?: number): void {
    if (!this.masterData || !countryId) {
      this.filteredStates = [];
      return;
    }
    this.filteredStates = this.masterData.states.filter(
      (state) => state.parentId === countryId
    );
    
    // Reset state if current state doesn't belong to selected country
    const currentStateId = this.addressFormGroup.get('stateId')?.value;
    if (currentStateId && !this.filteredStates.find((s) => s.id === currentStateId)) {
      this.addressFormGroup.patchValue({ stateId: null });
    }
  }

  getCountries(): IDropdownItem[] {
    return this.masterData?.countries || [];
  }

  getStates(): IDropdownItem[] {
    return this.filteredStates;
  }
}
