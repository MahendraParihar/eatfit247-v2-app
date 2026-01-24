import { BadRequestException } from '@nestjs/common';
import { PaymentSourceEnum } from '@eatfit247-shared-lib';

/**
 * Interface for payment data that needs validation
 */
export interface IPaymentValidationData {
  paymentSource: PaymentSourceEnum;
  paymentModeId?: number | null;
  paymentDate?: Date | null;
  paymentStatusId?: number | null;
  transactionId?: string | null;
}

/**
 * Utility class for payment validation
 */
export class PaymentValidationUtil {
  /**
   * Validates mandatory fields for MANUAL payment source
   * @param paymentData - Payment data object to validate
   * @throws BadRequestException if validation fails
   */
  public static validateManualPaymentSource(paymentData: IPaymentValidationData): void {
    if (paymentData.paymentSource === PaymentSourceEnum.MANUAL) {
      if (!paymentData.paymentModeId) {
        throw new BadRequestException('Payment Mode is required for MANUAL payment source');
      }
      if (!paymentData.paymentDate) {
        throw new BadRequestException('Payment Date is required for MANUAL payment source');
      }
      if (!paymentData.paymentStatusId) {
        throw new BadRequestException('Payment Status is required for MANUAL payment source');
      }
      if (!paymentData.transactionId || paymentData.transactionId.trim() === '') {
        throw new BadRequestException('Transaction ID is required for MANUAL payment source');
      }
    }
  }

  /**
   * Validates mandatory fields for MANUAL payment source with fallback values
   * Useful for update operations where values might come from existing payment or update object
   * @param paymentSource - Payment source to validate
   * @param paymentModeId - Payment mode ID (from update object or existing payment)
   * @param paymentDate - Payment date (from update object or existing payment)
   * @param paymentStatusId - Payment status ID (from update object or existing payment)
   * @param transactionId - Transaction ID (from update object or existing payment)
   * @throws BadRequestException if validation fails
   */
  public static validateManualPaymentSourceWithFallback(
    paymentSource: PaymentSourceEnum,
    paymentModeId: number | null | undefined,
    paymentDate: Date | null | undefined,
    paymentStatusId: number | null | undefined,
    transactionId: string | null | undefined,
  ): void {
    if (paymentSource === PaymentSourceEnum.MANUAL) {
      if (!paymentModeId) {
        throw new BadRequestException('Payment Mode is required for MANUAL payment source');
      }
      if (!paymentDate) {
        throw new BadRequestException('Payment Date is required for MANUAL payment source');
      }
      if (!paymentStatusId) {
        throw new BadRequestException('Payment Status is required for MANUAL payment source');
      }
      if (!transactionId || (typeof transactionId === 'string' && transactionId.trim() === '')) {
        throw new BadRequestException('Transaction ID is required for MANUAL payment source');
      }
    }
  }
}

