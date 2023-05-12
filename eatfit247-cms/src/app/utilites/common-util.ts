import { keysIn } from 'lodash';
import { AddressModel } from '../models/address.model';


export class CommonUtil {

  static removeEmptyPayloadAttributes(payload: any): any {

    const keys = keysIn(payload);
    for (const s of keys) {
      if (!payload[s] && payload[s] !== false) {
        delete payload[s];
      }
    }
    console.log(payload);
    return payload;
  }

  static convertAddressObj(address: AddressModel): string {
    let tempStr = '';
    if (address.postalAddress && address.postalAddress.trim().length > 0) {
      tempStr = `${tempStr} ${address.postalAddress.trim()}`;
    }
    if (address.cityVillage && address.cityVillage.trim().length > 0) {
      tempStr = `, ${tempStr} ${address.cityVillage.trim()}`;
    }
    if (address.state && address.state.trim().length > 0) {
      tempStr = `, ${tempStr} ${address.state.trim()}`;
    }
    if (address.country && address.country.trim().length > 0) {
      tempStr = `, ${tempStr} ${address.country.trim()}`;
    }
    if (address.pinCode && address.pinCode.trim().length > 0) {
      tempStr = `, ${tempStr} - ${address.pinCode.trim()}`;
    }
    if (tempStr) {
      tempStr = `${tempStr}.`;
    }
    return tempStr.trim();
  }
}
