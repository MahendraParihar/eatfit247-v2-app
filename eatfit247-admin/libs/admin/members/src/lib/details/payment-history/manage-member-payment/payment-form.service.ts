import { inject, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  CommonUtil,
  ICalculateTaxResponse,
  ICreatePaymentLinkRequest,
  IDropdownItem,
  IManageMemberPayment,
  IMemberPayment,
  IPaymentLinkResponse,
  PaymentSourceEnum,
  IPlanTaxCalculationRequest,
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';

export interface PaymentFormData {
  programPlanId: number;
  orderAmount: number;
  discountAmount: number;
  currencyCode: string;
  billingAddressId?: number;
  addressId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentFormService {
  private readonly apiService = inject(MembersApiService);

  /**
   * Calculate tax from backend based on form values
   */
  async calculateTax(
    memberId: number,
    formData: PaymentFormData
  ): Promise<ICalculateTaxResponse | null> {
    const { programPlanId, currencyCode } = formData;
    if (!programPlanId || !currencyCode) {
      return null;
    }
    const request: IPlanTaxCalculationRequest = {
      programPlanId: formData.programPlanId,
      discountAmount: formData.discountAmount || 0,
      currency: formData.currencyCode,
      billingAddressId: formData.billingAddressId,
      addressId: formData.addressId,
    };
    try {
      return await this.apiService.calculateTax(memberId, request);
    } catch (error) {
      // Error is handled by the calling component
      return null;
    }
  }

  /**
   * Transform payment data to form values for editing
   */
  transformPaymentToFormValues(payment: IMemberPayment): any {
    // Convert date string to Date object for Material datepicker
    const paymentDate = payment.paymentDate
      ? (typeof payment.paymentDate === 'string' ? new Date(payment.paymentDate) : payment.paymentDate)
      : null;
    return {
      paymentModeId: payment.paymentModeId,
      programId: payment.programId,
      programPlanId: payment.programPlanId,
      addressId: payment.addressId,
      billingAddressId: payment.billingAddressId,
      transactionId: payment.transactionId || '',
      paymentDate: paymentDate,
      paymentStatusId: payment.paymentStatusId,
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
      paymentLink: payment.paymentLink || '',
    };
  }

  /**
   * Transform form values to payment submission payload
   */
  transformFormToPaymentPayload(
    memberId: number,
    formGroup: FormGroup,
    step1FormGroup: FormGroup | null
  ): IManageMemberPayment {
    const getValue = (key: string) => {
      return step1FormGroup?.get(key)?.value ?? formGroup.get(key)?.value;
    };
    // Format paymentDate to avoid timezone conversion issues
    const paymentDateValue = formGroup.value.paymentDate || new Date();
    const formattedPaymentDate = CommonUtil.formatDateForAPI(paymentDateValue);
    
    const payload: any = {
      memberId,
      paymentModeId: formGroup.value.paymentModeId,
      programPlanId: getValue('programPlanId') || formGroup.value.programPlanId,
      programId: getValue('programId') || formGroup.value.programId,
      addressId: getValue('addressId') || formGroup.value.addressId || null,
      billingAddressId:
        getValue('billingAddressId') || formGroup.value.billingAddressId,
      transactionId: formGroup.value.transactionId?.trim() || undefined,
      paymentStatusId: formGroup.value.paymentStatusId,
      gstNumber:
        getValue('gstNumber')?.trim() ||
        formGroup.value.gstNumber?.trim() ||
        undefined,
      noOfCycle: Number(
        getValue('noOfCycle') || formGroup.value.noOfCycle || 0
      ),
      noOfDaysInCycle: Number(
        getValue('noOfDaysInCycle') || formGroup.value.noOfDaysInCycle || 0
      ),
      paymentSource: formGroup.value.paymentSource,
      currency:
        getValue('currencyCode') || formGroup.value.currencyCode || 'INR',
      discountAmount: Number(
        getValue('discountAmount') || formGroup.value.discountAmount || 0
      ),
      promoCode: '',
      paymentDate: formattedPaymentDate || CommonUtil.formatDateForAPI(new Date()) || undefined,
    };
    // Add gateway-specific fields for non-manual payments
    const paymentSource = formGroup.value.paymentSource;
    const isManual =
      paymentSource === PaymentSourceEnum?.MANUAL || paymentSource === 'MANUAL';
    if (!isManual) {
      payload.paymentLink = formGroup.value.paymentLink;
      payload.gatewayProvider = formGroup.value.gatewayProvider;
      payload.gatewayOrderId = formGroup.value.gatewayOrderId;
    }
    return payload as IManageMemberPayment;
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
        programPlanId: programPlanId?.toString(),
      },
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
      orderAmount:
        Number(
          step1FormGroup?.get('orderAmount')?.value ||
            formGroup.get('orderAmount')?.value
        ) || 0,
      programPlanId:
        Number(
          step1FormGroup?.get('programPlanId')?.value ||
            formGroup.get('programPlanId')?.value
        ) || 0,
      discountAmount:
        Number(
          step1FormGroup?.get('discountAmount')?.value ||
            formGroup.get('discountAmount')?.value
        ) || 0,
      currencyCode:
        step1FormGroup?.get('currencyCode')?.value ||
        formGroup.get('currencyCode')?.value ||
        'INR',
      billingAddressId:
        step1FormGroup?.get('billingAddressId')?.value ||
        formGroup.get('billingAddressId')?.value,
      addressId:
        step1FormGroup?.get('addressId')?.value ||
        formGroup.get('addressId')?.value,
    };
  }

  /**
   * Calculate total amount fallback when backend calculation is not available
   */
  private calculateTotalAmountFallback(
    formGroup: FormGroup,
    step1FormGroup: FormGroup | null
  ): number {
    const orderAmount =
      Number(
        step1FormGroup?.get('orderAmount')?.value ||
          formGroup.get('orderAmount')?.value
      ) || 0;
    const discountAmount =
      Number(
        step1FormGroup?.get('discountAmount')?.value ||
          formGroup.get('discountAmount')?.value
      ) || 0;
    return orderAmount - discountAmount;
  }

  /**
   * Transform the address list to dropdown items
   */
  transformAddressesToDropdown(addresses: any[]): IDropdownItem[] {
    return addresses.map((addr) => ({
      id: addr.addressId,
      label: `${addr.postalAddress}, ${addr.cityVillage}, ${addr.pinCode}`,
      selected: false,
    }));
  }

  /**
   * Transform program plan fees to currency dropdown items
   */
  transformFeesToCurrencyDropdown(fees: any[]): IDropdownItem[] {
    return fees.map((fee) => ({
      id: fee.currencyCode,
      label: fee.currencyCode,
      selected: false,
    }));
  }
}
