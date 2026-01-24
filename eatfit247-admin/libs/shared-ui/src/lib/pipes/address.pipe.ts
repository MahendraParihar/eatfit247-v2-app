import { Pipe, PipeTransform } from '@angular/core';
import { IMemberAddress } from '@eatfit247-shared-lib';

/**
 * Formats an IMemberAddress object into a readable string
 * @example
 * {{ address | address }}
 * Output: "123 Main St, Springfield, 12345"
 */
@Pipe({
  name: 'address',
  standalone: true,
})
export class AddressPipe implements PipeTransform {
  transform(address: IMemberAddress | null | undefined): string {
    if (!address) {
      return 'N/A';
    }

    const parts: string[] = [];

    if (address.postalAddress) {
      parts.push(address.postalAddress);
    }

    if (address.cityVillage) {
      parts.push(address.cityVillage);
    }

    if (address.state) {
      parts.push(address.state);
    }

    if (address.pinCode) {
      parts.push(address.pinCode);
    }

    if (address.country) {
      parts.push(address.country);
    }

    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }
}

