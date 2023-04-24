export class AddressModel {
  addressId?: number;
  postalAddress?: string;
  country?: string;
  countryId?: number;
  state?: string;
  stateId?: number;
  cityVillage?: string;
  addressType?: string;
  addressTypeId?: number;
  latitude?: string;
  longitude?: string;
  pinCode?: string;
  tableId?: number;
  pkOfTable?: number;

  static fromJson(data: any): AddressModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: AddressModel = new AddressModel();
    authUserObj.addressId = data.addressId;
    authUserObj.postalAddress = data.postalAddress;
    authUserObj.cityVillage = data.cityVillage;
    authUserObj.stateId = data.stateId;
    authUserObj.state = data.state;
    authUserObj.countryId = data.countryId;
    authUserObj.country = data.country;
    authUserObj.addressType = data.addressType;
    authUserObj.addressTypeId = data.addressTypeId;
    authUserObj.latitude = data.latitude;
    authUserObj.longitude = data.longitude;
    authUserObj.pinCode = data.pinCode;
    authUserObj.tableId = data.tableId;
    authUserObj.pkOfTable = data.pkOfTable;
    return authUserObj;
  }
}
