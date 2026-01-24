import { AddressPipe } from './address.pipe';
import { IMemberAddress } from '@eatfit247-shared-lib';

describe('AddressPipe', () => {
  let pipe: AddressPipe;

  beforeEach(() => {
    pipe = new AddressPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format a complete address', () => {
    const address: IMemberAddress = {
      addressId: 1,
      postalAddress: '123 Main Street',
      cityVillage: 'Mumbai',
      countryId: 1,
      stateId: 1,
      state: 'Maharashtra',
      country: 'India',
      pinCode: '400001',
    };

    const result = pipe.transform(address);
    expect(result).toBe('123 Main Street, Mumbai, Maharashtra, 400001, India');
  });

  it('should format a partial address', () => {
    const address: IMemberAddress = {
      addressId: 1,
      postalAddress: '123 Main Street',
      cityVillage: 'Mumbai',
      countryId: 1,
      stateId: 1,
      state: 'Maharashtra',
      country: 'India',
    };

    const result = pipe.transform(address);
    expect(result).toBe('123 Main Street, Mumbai, Maharashtra, India');
  });

  it('should return N/A for null address', () => {
    const result = pipe.transform(null);
    expect(result).toBe('N/A');
  });

  it('should return N/A for undefined address', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('N/A');
  });

  it('should return N/A for empty address', () => {
    const address: IMemberAddress = {
      addressId: 1,
      postalAddress: '',
      countryId: 1,
      stateId: 1,
      state: '',
      country: '',
    };

    const result = pipe.transform(address);
    expect(result).toBe('N/A');
  });
});

