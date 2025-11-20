export interface IAddress {
  addressId: number;
  addressTypeId?: number;
  addressType?: string;
  postalAddress: string;
  cityVillage: string;
  stateId?: number;
  state: string;
  countryId?: number;
  country: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
}
