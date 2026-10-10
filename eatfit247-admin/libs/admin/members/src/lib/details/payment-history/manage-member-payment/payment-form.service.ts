import { inject, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  CommonUtil,
  ICalculateTaxResponse,
  IDropdownItem,
  IManageMemberPayment,
  IMemberPayment,
  IPlanTaxCalculationRequest,
  PaymentSourceEnum,
  PaymentRouteEnum,
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';

export interface PaymentFormData {
  programPlanId: number;
  orderAmount: number;
  discountAmount: number;
  currencyCode: string;
  billingAddressId?: number;
  addressId?: number;
  /** Manual payments: how the money arrived and when (tax decision, roadmap 4.6) */
  paymentSource?: PaymentSourceEnum;
  paymentRoute?: PaymentRouteEnum | null;
  paymentDate?: string | null;
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
      paymentSource: formData.paymentSource,
      paymentRoute: formData.paymentSource === PaymentSourceEnum.MANUAL ? formData.paymentRoute || null : null,
      paymentDate: formData.paymentSource === PaymentSourceEnum.MANUAL ? formData.paymentDate || null : null,
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
      paymentRoute: payment.paymentRoute || PaymentRouteEnum.DOMESTIC,
      remittanceReference: payment.remittanceReference || '',
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
      // get(): the source control is disabled when editing a gateway payment
      paymentSource: formGroup.get('paymentSource')?.value,
      currency:
        getValue('currencyCode') || formGroup.value.currencyCode || 'INR',
      discountAmount: Number(
        getValue('discountAmount') || formGroup.value.discountAmount || 0
      ),
      promoCode: '',
      paymentDate: formattedPaymentDate || CommonUtil.formatDateForAPI(new Date()) || undefined,
    };
    // Gateway payments: only the gateway choice is sent. The server saves the record first,
    // then creates the link for the stored total (status, date and ids are the gateway's).
    const paymentSource = formGroup.get('paymentSource')?.value;
    const isManual =
      paymentSource === PaymentSourceEnum?.MANUAL || paymentSource === 'MANUAL';
    if (isManual) {
      // The component keeps hidden route fields at the stored values (see showPaymentRouteFields)
      payload.paymentRoute = formGroup.get('paymentRoute')?.value || PaymentRouteEnum.DOMESTIC;
      payload.remittanceReference = formGroup.get('remittanceReference')?.value?.trim() || null;
    } else {
      payload.franchisePaymentGatewayId = formGroup.get('franchisePaymentGatewayId')?.value || undefined;
      delete payload.paymentStatusId;
      delete payload.paymentDate;
      delete payload.transactionId;
    }
    return payload as IManageMemberPayment;
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
      paymentSource: formGroup.get('paymentSource')?.value,
      paymentRoute: formGroup.get('paymentRoute')?.value || null,
      paymentDate: formGroup.get('paymentDate')?.value
        ? CommonUtil.formatDateForAPI(formGroup.get('paymentDate')?.value) || null
        : null,
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
