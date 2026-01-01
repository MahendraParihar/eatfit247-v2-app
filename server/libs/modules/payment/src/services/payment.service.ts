import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMemberPayment } from '@server/modules/member';
import { PaymentStatusEnum } from '@eatfit247-shared-lib';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(TxnMemberPayment)
    private readonly paymentRepository: typeof TxnMemberPayment,
  ) {}

  async markPaidByGateway(
    orderId: string,
    paymentId: string,
    webhookPayload: any,
  ): Promise<void> {
    // Find payment by gateway_order_id
    const payment = await this.paymentRepository.findOne({
      where: {
        gatewayOrderId: orderId,
        active: true,
      },
    });
    if (!payment) {
      throw new NotFoundException(`Payment not found for order ID: ${orderId}`);
    }
    // Update payment with gateway information and mark as paid
    await payment.update({
      gatewayPaymentId: paymentId,
      paymentStatusId: PaymentStatusEnum.PAID,
      paymentGatewayResponse: webhookPayload,
      updatedAt: new Date(),
    });
  }
}

