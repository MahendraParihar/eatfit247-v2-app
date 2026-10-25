import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { PublicPlanOrderDto, PublicProductOrderDto, PublicVerifyPaymentDto } from './public-checkout.dto';

/** Same options as the global pipe in apps/public-api/src/main.ts. */
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  skipMissingProperties: false,
  forbidUnknownValues: true,
});
const body = (metatype: ArgumentMetadata['metatype']): ArgumentMetadata => ({ type: 'body', metatype });

const validPlanOrder = {
  programPlanId: 3,
  currency: 'INR',
  addressId: 10,
  billingAddressId: 10,
  promoCode: 'SAVE10',
};

const validProductOrder = {
  items: [{ productId: 1, productVariantId: 2, quantity: 1 }],
  currency: 'INR',
  addressId: 10,
  billingAddressId: 10,
};

describe('Public checkout DTOs', () => {
  it('accepts a plan order with only customer choices', async () => {
    await expect(pipe.transform(validPlanOrder, body(PublicPlanOrderDto))).resolves.toBeInstanceOf(PublicPlanOrderDto);
  });

  it.each([
    ['paymentStatusId', 1],
    ['paymentSource', 'PAYMENT_GATEWAY'],
    ['paymentDate', '2026-10-10'],
    ['discountAmount', 500],
    ['totalAmount', 1],
    ['orderAmount', 1],
    ['transactionId', 'pay_x'],
    ['gatewayOrderId', 'order_x'],
    ['gatewayPaymentId', 'pay_x'],
    ['paymentGatewayResponse', { status: 'captured' }],
  ])('rejects a plan order that sends %s with 400', async (field, value) => {
    await expect(
      pipe.transform({ ...validPlanOrder, [field]: value }, body(PublicPlanOrderDto)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a product order that sends paymentStatusId or a per-item price', async () => {
    await expect(
      pipe.transform({ ...validProductOrder, paymentStatusId: 1 }, body(PublicProductOrderDto)),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      pipe.transform(
        { ...validProductOrder, items: [{ productId: 1, productVariantId: 2, quantity: 1, price: 1 }] },
        body(PublicProductOrderDto),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a zero or oversized quantity', async () => {
    for (const quantity of [0, 101]) {
      await expect(
        pipe.transform(
          { ...validProductOrder, items: [{ productId: 1, productVariantId: 2, quantity }] },
          body(PublicProductOrderDto),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
  });

  it('requires order id, payment id and signature to verify', async () => {
    await expect(
      pipe.transform({ orderId: 'order_1', paymentId: 'pay_1' }, body(PublicVerifyPaymentDto)),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      pipe.transform({ orderId: 'order_1', paymentId: 'pay_1', signature: 's', gatewayCode: 'RAZORPAY' }, body(PublicVerifyPaymentDto)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
