import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  ICalculateTaxRequest,
  ICalculateTaxResponse,
  ICreatePaymentLinkRequest,
  IDropdownItem,
  IPaymentLinkResponse,
  PaymentSourceEnum
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';

export interface ProductOrderFormData {
  orderAmount: number;
  discountAmount: number;
  isTaxApplicable: boolean;
  isPlanFeesIncludedTax: boolean;
  currencyCode: string;
  billingAddressId?: number;
  addressId?: number;
}

export interface SelectedProduct {
  productId: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  totalPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductOrderFormService {
  constructor(private apiService: MembersApiService) {}

  /**
   * Calculate tax from backend based on form values
   */
  async calculateTax(
    memberId: number,
    formData: ProductOrderFormData
  ): Promise<ICalculateTaxResponse | null> {
    const { orderAmount, currencyCode } = formData;
    
    if (!orderAmount || !currencyCode) {
      return null;
    }

    const request: ICalculateTaxRequest = {
      orderAmount,
      discountAmount: formData.discountAmount || 0,
      currencyCode,
      billingAddressId: formData.billingAddressId || undefined,
      addressId: formData.addressId || undefined
    };

    try {
      return await this.apiService.calculateTax(memberId, request);
    } catch (error) {
      console.error('Error calculating tax:', error);
      return null;
    }
  }

  /**
   * Create payment link
   */
  async createPaymentLink(
    memberId: number,
    totalAmount: number,
    currencyCode: string,
    franchisePaymentGatewayId: number,
    productNames: string[]
  ): Promise<IPaymentLinkResponse> {
    const request: ICreatePaymentLinkRequest = {
      amount: totalAmount,
      currency: currencyCode,
      franchisePaymentGatewayId,
      description: `Payment for products: ${productNames.join(', ')}`,
      notes: {
        memberId: memberId.toString(),
        type: 'product'
      }
    };

    return await this.apiService.createPaymentLink(memberId, request);
  }

  /**
   * Get product order form data from form groups
   */
  getProductOrderFormData(
    formGroup: FormGroup,
    step2FormGroup: FormGroup | null
  ): ProductOrderFormData {
    return {
      orderAmount: Number(step2FormGroup?.get('orderAmount')?.value || formGroup.get('orderAmount')?.value) || 0,
      discountAmount: Number(step2FormGroup?.get('discountAmount')?.value || formGroup.get('discountAmount')?.value) || 0,
      isTaxApplicable: step2FormGroup?.get('isTaxApplicable')?.value || formGroup.get('isTaxApplicable')?.value || false,
      isPlanFeesIncludedTax: step2FormGroup?.get('isPlanFeesIncludedTax')?.value || formGroup.get('isPlanFeesIncludedTax')?.value || false,
      currencyCode: step2FormGroup?.get('currencyCode')?.value || formGroup.get('currencyCode')?.value || 'INR',
      billingAddressId: step2FormGroup?.get('billingAddressId')?.value || formGroup.get('billingAddressId')?.value,
      addressId: step2FormGroup?.get('addressId')?.value || formGroup.get('addressId')?.value
    };
  }

  /**
   * Calculate total amount fallback when backend calculation is not available
   */
  calculateTotalAmountFallback(
    formGroup: FormGroup,
    step2FormGroup: FormGroup | null
  ): number {
    const orderAmount = Number(step2FormGroup?.get('orderAmount')?.value || formGroup.get('orderAmount')?.value) || 0;
    const discountAmount = Number(step2FormGroup?.get('discountAmount')?.value || formGroup.get('discountAmount')?.value) || 0;
    return orderAmount - discountAmount;
  }

  /**
   * Transform the address list to dropdown items
   */
  transformAddressesToDropdown(addresses: any[]): IDropdownItem[] {
    return addresses.map((addr) => ({
      id: addr.addressId,
      label: `${addr.postalAddress}, ${addr.cityVillage}, ${addr.pinCode}`,
      selected: false
    }));
  }
}

