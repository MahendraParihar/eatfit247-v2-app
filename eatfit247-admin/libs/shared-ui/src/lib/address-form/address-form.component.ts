import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { InputErrorComponent } from '../input-error/input-error.component';
import { IDropdownItem, InputLengthEnum, IAddressMaster, IManageAddress, IResponse } from '@eatfit247-shared-lib';
import { HttpService } from '@core';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    InputErrorComponent
  ],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.scss'
})
export class AddressFormComponent implements OnInit {
  httpService: HttpService = inject(HttpService);
  masterAddress!: IAddressMaster;
  @Input() formGroup!: FormGroup;

  @Input() set address(data: IManageAddress | undefined) {
    this._address = data;
    this.bindAddress();
  }

  _address?: IManageAddress;
  addressFormGroup: FormGroup = new FormGroup({
    addressId: new FormControl(null, []),
    postalAddress: new FormControl(null, [
      Validators.required,
      Validators.maxLength(InputLengthEnum.CHAR_100)
    ]),
    cityVillage: new FormControl(null, [
      Validators.required,
      Validators.maxLength(InputLengthEnum.CHAR_100)
    ]),
    stateId: new FormControl(null, [Validators.required]),
    countryId: new FormControl(null, [Validators.required]),
    pinCode: new FormControl(null, [
      Validators.required,
      Validators.maxLength(InputLengthEnum.PIN_CODE)
    ]),
    latitude: new FormControl(null),
    longitude: new FormControl(null),
    addressName: new FormControl(null, [
      Validators.maxLength(InputLengthEnum.CHAR_100)
    ]),
    addressTypeId: new FormControl(null, [Validators.required]),
    tableId: new FormControl(null),
    pkOfTable: new FormControl(null)
  });
  filteredStates: IDropdownItem[] = [];

  async ngOnInit(): Promise<void> {
    const res = await this.httpService.get<IResponse<IAddressMaster>>(
      'address/address-master'
    );
    this.masterAddress = res.data as IAddressMaster;
    this.formGroup.addControl('address', this.addressFormGroup);
    this.bindAddress();
    // Watch for country changes to filter states
    this.addressFormGroup.get('countryId')?.valueChanges.subscribe(() => {
      this.filterStates();
    });
  }

  private bindAddress(): void {
    if (!this._address) {
      return;
    }
    this.filterStates();
    this.addressFormGroup.patchValue({
      addressId: this._address.addressId || null,
      addressTypeId: this._address.addressTypeId || null,
      postalAddress: this._address.postalAddress || null,
      cityVillage: this._address.cityVillage || null,
      pinCode: this._address.pinCode || null,
      latitude: this._address.latitude || null,
      longitude: this._address.longitude || null,
      countryId: this._address.countryId || null,
      stateId: this._address.stateId || null,
      addressName: this._address.addressName || null,
    });
  }

  private filterStates(): void {
    const countryId = this.addressFormGroup.get('countryId')?.value;
    if (!this.masterAddress || !countryId) {
      this.filteredStates = [];
      return;
    }
    this.filteredStates = this.masterAddress.state.filter(
      (state) => state.parentId === countryId
    );
    // Reset state if the current state doesn't belong to the selected country
    const currentStateId = this.addressFormGroup.get('stateId')?.value;
    if (
      currentStateId &&
      !this.filteredStates.find((s) => s.id === currentStateId)
    ) {
      this.addressFormGroup.patchValue({ stateId: null });
    }
  }

  getAddressType(): IDropdownItem[] {
    return this.masterAddress.addressType || [];
  }

  getCountries(): IDropdownItem[] {
    return this.masterAddress.country || [];
  }

  getStates(): IDropdownItem[] {
    return this.filteredStates;
  }

  getMaxLength(controlName: string): number | null {
    const maxLengthMap: { [key: string]: number } = {
      postalAddress: InputLengthEnum.CHAR_100,
      cityVillage: InputLengthEnum.CHAR_100,
      pinCode: InputLengthEnum.PIN_CODE,
      addressName: InputLengthEnum.CHAR_100
    };
    return maxLengthMap[controlName] || null;
  }

  getCurrentLength(controlName: string): number {
    const control = this.addressFormGroup.get(controlName);
    return control?.value?.length || 0;
  }
}
