import { Pipe, PipeTransform } from '@angular/core';
import { IAddress } from "shared-lib";

@Pipe({
  name: 'address',
  standalone: false
})
export class AddressPipe implements PipeTransform {
  transform(address: IAddress): string {
    if (!address) {
      return '';
    }
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
