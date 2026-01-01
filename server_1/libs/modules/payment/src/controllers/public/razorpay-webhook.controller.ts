import { Controller, Post, Req, Headers, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '@server_1/core';
import { RazorpayService } from '@server_1/platform';
import { PaymentService } from '../../services';

@Controller('razorpay')
export class RazorpayWebhookController {
  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post('webhook')
  @Public()
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = (req as any).rawBody;

    const isValid = this.razorpayService.verifyWebhookSignature(
      rawBody,
      signature,
    );

    if (!isValid) {
      throw new ForbiddenException('Invalid signature');
    }

    const payload = JSON.parse(rawBody);

    if (payload.event === 'payment.captured') {
      const orderId = payload.payload.payment.entity.order_id;
      const paymentId = payload.payload.payment.entity.id;

      await this.paymentService.markPaidByGateway(
        orderId,
        paymentId,
        payload,
      );
    }

    return { status: 'ok' };
  }
}

