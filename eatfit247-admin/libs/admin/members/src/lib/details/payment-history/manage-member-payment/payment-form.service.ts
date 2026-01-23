import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  ICalculateTaxRequest,
  ICalculateTaxResponse,
  ICreatePaymentLinkRequest,
  IDropdownItem,
  IManageMemberPayment,
  IMemberPayment,
  IPaymentLinkResponse,
  PaymentSourceEnum
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';

export interface PaymentFormData {
  orderAmount: number;
  discountAmount: number;
  isTaxApplicable: boolean;
  isPlanFeesIncludedTax: boolean;
  currencyCode: string;
  billingAddressId?: number;
  addressId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentFormService {
  constructor(private apiService: MembersApiService) {}

  /**
   * Calculate tax from backend based on form values
   */
  async calculateTax(
    memberId: number,
    formData: PaymentFormData
  ): Promise<ICalculateTaxResponse | null> {
    const { orderAmount, currencyCode } = formData;
    
    if (!orderAmount || !currencyCode) {
      return null;
    }

    const request: ICalculateTaxRequest = {
      orderAmount,
      discountAmount: formData.discountAmount || 0,
      isTaxApplicable: formData.isTaxApplicable ?? false,
      isPlanFeesIncludedTax: formData.isPlanFeesIncludedTax ?? false,
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
   * Transform payment data to form values for editing
   */
  transformPaymentToFormValues(payment: IMemberPayment): any {
    return {
      paymentModeId: payment.paymentModeId,
      programId: payment.programId,
      programPlanId: payment.programPlanId,
      addressId: payment.addressId,
      billingAddressId: payment.billingAddressId,
      transactionId: payment.transactionId || '',
      paymentDate: payment.paymentDate,
      paymentStatusId: payment.paymentStatusId,
      isTaxApplicable: payment.isTaxApplicable,
      isPlanFeesIncludedTax: payment.isTaxIncluded ?? false,
      noOfCycle: payment.noOfCycle || 0,
      noOfDaysInCycle: payment.noOfDaysInCycle || 0,
      currencyCode: payment.currency || 'INR',
      orderAmount: payment.orderAmount || 0,
      discountAmount: payment.discountAmount || 0,
      gstNumber: payment.gstNumber || '',
      paymentSource: payment.paymentSource,
      gatewayProvider: payment.gatewayProvider || '',
      gatewayOrderId: payment.gatewayOrderId || '',
      gatewayPaymentId: payment.gatewayPaymentId || '',
      paymentLink: payment.paymentLink || ''
    };
  }

  /**
   * Transform form values to payment submission payload
   */
  transformFormToPaymentPayload(
    memberId: number,
    formGroup: FormGroup,
    step1FormGroup: FormGroup | null,
    taxCalculationResult: ICalculateTaxResponse | null
  ): IManageMemberPayment {
    const getValue = (key: string) => {
      return step1FormGroup?.get(key)?.value ?? formGroup.get(key)?.value;
    };

    const taxAmount = taxCalculationResult?.taxAmount || 0;
    const taxPercentage = taxCalculationResult?.taxPercentage || 0;
    const totalAmount = taxCalculationResult?.totalAmount || this.calculateTotalAmountFallback(formGroup, step1FormGroup);

    const payload: IManageMemberPayment = {
      memberId,
      paymentModeId: formGroup.value.paymentModeId,
      programPlanId: getValue('programPlanId') || formGroup.value.programPlanId,
      programId: getValue('programId') || formGroup.value.programId,
      addressId: getValue('addressId') || formGroup.value.addressId || null,
      billingAddressId:
        getValue('billingAddressId') || formGroup.value.billingAddressId,
      transactionId: formGroup.value.transactionId?.trim() || undefined,
      paymentStatusId: formGroup.value.paymentStatusId,
      isTaxApplicable:
        getValue('isTaxApplicable') ?? formGroup.value.isTaxApplicable ?? false,
      gstNumber:
        getValue('gstNumber')?.trim() ||
        formGroup.value.gstNumber?.trim() ||
        undefined,
      noOfCycle: Number(
        getValue('noOfCycle') || formGroup.value.noOfCycle || 0,
      ),
      noOfDaysInCycle: Number(
        getValue('noOfDaysInCycle') || formGroup.value.noOfDaysInCycle || 0,
      ),
      taxPercentage: Number(taxPercentage),
      isPlanFeesIncludedTax:
        getValue('isPlanFeesIncludedTax') ??
        formGroup.value.isPlanFeesIncludedTax ??
        false,
      paymentSource: formGroup.value.paymentSource,
      currencyCode:
        getValue('currencyCode') || formGroup.value.currencyCode || 'INR',
      orderAmount: Number(
        getValue('orderAmount') || formGroup.value.orderAmount || 0,
      ),
      taxAmount,
      discountAmount: Number(
        getValue('discountAmount') || formGroup.value.discountAmount || 0,
      ),
      totalAmount,
      promoCode: '',
      paymentDate: formGroup.value.paymentDate || new Date(),
    };

    // Add gateway-specific fields for non-manual payments
    const paymentSource = formGroup.value.paymentSource;
    const isManual = paymentSource === PaymentSourceEnum?.MANUAL || paymentSource === 'MANUAL';
    
    if (!isManual) {
      payload.paymentLink = formGroup.value.paymentLink;
      payload.gatewayProvider = formGroup.value.gatewayProvider;
      payload.gatewayOrderId = formGroup.value.gatewayOrderId;
    }

    return payload;
  }

  /**
   * Create payment link
   */
  async createPaymentLink(
    memberId: number,
    totalAmount: number,
    currencyCode: string,
    franchisePaymentGatewayId: number,
    programId: number,
    programPlanId: number,
    programName: string,
    planName: string
  ): Promise<IPaymentLinkResponse> {
    const request: ICreatePaymentLinkRequest = {
      amount: totalAmount,
      currency: currencyCode,
      franchisePaymentGatewayId,
      description: `Payment for ${programName} - ${planName}`,
      notes: {
        memberId: memberId.toString(),
        programId: programId?.toString(),
        programPlanId: programPlanId?.toString()
      }
    };

    return await this.apiService.createPaymentLink(memberId, request);
  }

  /**
   * Get payment form data from form groups
   */
  getPaymentFormData(
    formGroup: FormGroup,
    step1FormGroup: FormGroup | null
  ): PaymentFormData {
    return {
      orderAmount: Number(step1FormGroup?.get('orderAmount')?.value || formGroup.get('orderAmount')?.value) || 0,
      discountAmount: Number(step1FormGroup?.get('discountAmount')?.value || formGroup.get('discountAmount')?.value) || 0,
      isTaxApplicable: step1FormGroup?.get('isTaxApplicable')?.value || formGroup.get('isTaxApplicable')?.value || false,
      isPlanFeesIncludedTax: step1FormGroup?.get('isPlanFeesIncludedTax')?.value || formGroup.get('isPlanFeesIncludedTax')?.value || false,
      currencyCode: step1FormGroup?.get('currencyCode')?.value || formGroup.get('currencyCode')?.value || 'INR',
      billingAddressId: step1FormGroup?.get('billingAddressId')?.value || formGroup.get('billingAddressId')?.value,
      addressId: step1FormGroup?.get('addressId')?.value || formGroup.get('addressId')?.value
    };
  }

  /**
   * Calculate total amount fallback when backend calculation is not available
   */
  private calculateTotalAmountFallback(
    formGroup: FormGroup,
    step1FormGroup: FormGroup | null
  ): number {
    const orderAmount = Number(step1FormGroup?.get('orderAmount')?.value || formGroup.get('orderAmount')?.value) || 0;
    const discountAmount = Number(step1FormGroup?.get('discountAmount')?.value || formGroup.get('discountAmount')?.value) || 0;
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

  /**
   * Transform program plan fees to currency dropdown items
   */
  transformFeesToCurrencyDropdown(fees: any[]): IDropdownItem[] {
    return fees.map(fee => ({
      id: fee.currencyCode,
      label: fee.currencyCode,
      selected: false
    }));
  }
}

