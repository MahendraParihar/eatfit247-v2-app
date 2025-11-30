import { AfterViewInit, Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { HttpService } from '../../../../service/http.service';
import { ApiUrlEnum } from '../../../../enum/api-url-enum';
import { SnackBarService } from '../../../../service/snack-bar.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputLength } from '../../../../constants/input-length';
import { StringResources } from '../../../../enum/string-resources';
import { filter, find } from 'lodash';
import { IDropdownItem, IAddressMaster, IResponse, IAddress, IAddressBasic } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-address-selector',
  templateUrl: './address-selector.component.html',
  styleUrls: ['./address-selector.component.scss']
})
export class AddressSelectorComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  fb: FormBuilder = inject(FormBuilder);
  @Input()
  addressList: IAddress[];
  @Input()
  addressModel?: IAddressBasic;
  @Input()
  formGroup: FormGroup;
  @Input()
  showLatLong: boolean = false;
  @Input()
  showAddressType: boolean = false;
  stringRes = StringResources;
  inputLength = InputLength;
  addressCountryList: IDropdownItem[] = [];
  masterStateList: IDropdownItem[] = [];
  addressStateList: IDropdownItem[] = [];
  addressTypeList: IDropdownItem[] = [];
  showManageAddressForm = false;
  addressForm: FormGroup = this.fb.group({
    addressId: [null, []],
    addressTypeId: [null, []],
    postalAddress: [null, [Validators.required, Validators.minLength(InputLength.MIN_ADDRESS), Validators.maxLength(InputLength.MAX_ADDRESS)]],
    pinCode: [null, [Validators.required, Validators.minLength(InputLength.PIN_CODE), Validators.maxLength(InputLength.PIN_CODE)]],
    countryId: [null, [Validators.required]],
    stateId: [null, [Validators.required]],
    cityVillage: [null, [Validators.required]],
    latitude: [null, []],
    longitude: [null, []]
  });

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService) {
  }

  get formControl() {
    return this.addressForm.controls;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMasterData();
    if (this.addressModel) {
      this.addressForm.patchValue({
        addressId: this.addressModel.addressId
      });
    }
    this.addAddressFormControl();
    this.showManageAddressForm = !(this.addressList && this.addressList.length > 0);
    this.enableDisableAddressId();
  }

  ngOnChanges(change: SimpleChanges): void {
    if (this.addressModel) {
      this.addressForm.patchValue({
        addressId: this.addressModel.addressId
      });
    }
    this.addAddressFormControl();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
  }

  async loadMasterData(): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<IAddressMaster>>(ApiUrlEnum.ADDRESS_MASTER, null, null, true);
    this.addressCountryList = res.data.country;
    this.masterStateList = res.data.state;
    this.addressTypeList = res.data.addressType;
  }

  addAddressFormControl(): void {
    if (this.showAddressType) {
      this.addressForm.get('addressTypeId').setValidators([Validators.required]);
      this.addressForm.get('addressTypeId').updateValueAndValidity();
    }
    this.addressForm.patchValue({
      addressTypeId: this.addressModel ? this.addressModel.addressTypeId : null,
      postalAddress: this.addressModel ? this.addressModel.postalAddress : null,
      pinCode: this.addressModel ? this.addressModel.pinCode : null,
      countryId: this.addressModel ? this.addressModel.countryId : null,
      stateId: this.addressModel ? this.addressModel.stateId : null,
      cityVillage: this.addressModel ? this.addressModel.cityVillage : null,
      latitude: this.addressModel ? this.addressModel.latitude : null,
      longitude: this.addressModel ? this.addressModel.longitude : null
    });
    this.formGroup.addControl('address', this.addressForm);
    this.onCountryChange();
  }

  onAddressChange() {
    if (this.addressForm.value.addressId && this.addressForm.value.addressId === -1) {
      this.showManageAddressForm = true;
      this.enableDisableAddressId();
    } else {
      const selectedAddress = find(this.addressList, { addressId: this.addressForm.value.addressId });
      if (selectedAddress) {
        this.showManageAddressForm = false;
        this.enableDisableAddressId();
        this.addressForm.patchValue({
          addressTypeId: selectedAddress.addressTypeId,
          postalAddress: selectedAddress.postalAddress,
          pinCode: selectedAddress.pinCode,
          countryId: selectedAddress.countryId,
          stateId: selectedAddress.stateId,
          cityVillage: selectedAddress.cityVillage,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude
        });
        this.addressForm.get('stateId').enable();
      } else {
        this.showManageAddressForm = true;
        this.enableDisableAddressId();
      }
    }
  }

  onCountryChange() {
    if (this.addressForm.value.countryId && this.addressForm.value.countryId > 0) {
      // enable state
      this.addressStateList = filter(this.masterStateList, { parentId: this.addressForm.value.countryId });
      this.addressForm.get('stateId').enable();
    } else {
      // disable state
      this.addressForm.get('stateId').disable();
      this.addressForm.patchValue({
        stateId: null
      });
    }
  }

  enableDisableAddressId() {
    if (this.showManageAddressForm) {
      this.addressForm.get('addressId').setValidators([]);
      this.addressForm.updateValueAndValidity();
    } else {
      this.addressForm.get('addressId').setValidators([Validators.required]);
      this.addressForm.updateValueAndValidity();
    }
  }
}
