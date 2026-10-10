import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { PaymentSourceEnum } from '@eatfit247-shared-lib';
import { CreateMemberPaymentDto } from './member-plan.dto';
import { CreateMemberProductDto } from './member-product.dto';

/** Same options as the admin-api global pipe (apps/admin-api/src/main.ts). */
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  skipMissingProperties: false,
  forbidUnknownValues: true,
});
const body = (metatype: ArgumentMetadata['metatype']): ArgumentMetadata => ({ type: 'body', metatype });

const plan = {
  memberId: 4945,
  programId: 1,
  programPlanId: 271,
  noOfCycle: 1,
  noOfDaysInCycle: 10,
  billingAddressId: 3404,
  addressId: 3404,
  currency: 'INR',
  discountAmount: 0,
};

describe('Admin payment DTOs (decision 13–14)', () => {
  it('a gateway plan payment needs no status or date and carries the gateway choice', async () => {
    await expect(
      pipe.transform({ ...plan, paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY, franchisePaymentGatewayId: 1 }, body(CreateMemberPaymentDto)),
    ).resolves.toMatchObject({ franchisePaymentGatewayId: 1 });
  });

  it('a manual plan payment still requires status and date', async () => {
    await expect(
      pipe.transform({ ...plan, paymentSource: PaymentSourceEnum.MANUAL, paymentModeId: 1 }, body(CreateMemberPaymentDto)),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      pipe.transform(
        { ...plan, paymentSource: PaymentSourceEnum.MANUAL, paymentModeId: 1, paymentStatusId: 1, paymentDate: '2026-10-10' },
        body(CreateMemberPaymentDto),
      ),
    ).resolves.toBeInstanceOf(CreateMemberPaymentDto);
  });

  it('a gateway product order needs no status or date and carries the gateway choice', async () => {
    await expect(
      pipe.transform(
        {
          memberId: 4945,
          billingAddressId: 3404,
          currency: 'INR',
          discountAmount: 0,
          paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY,
          franchisePaymentGatewayId: 3,
          orderItems: [{ productId: 1, productVariantId: 2, quantity: 1, currency: 'INR' }],
        },
        body(CreateMemberProductDto),
      ),
    ).resolves.toMatchObject({ franchisePaymentGatewayId: 3 });
  });
});
