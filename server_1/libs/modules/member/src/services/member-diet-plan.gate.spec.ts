import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentStatusEnum } from '@eatfit247-shared-lib';
import { MemberDietPlanService } from './member-diet-plan.service';

/**
 * Decision 11: the diet-plan container exists from checkout (PENDING), but diet work
 * and delivery need a PAID payment.
 */
describe('MemberDietPlanService payment gate', () => {
  const build = (paymentStatusId: PaymentStatusEnum | null) => {
    const memberDietPlanRepository = {
      findOne: jest.fn().mockResolvedValue(
        paymentStatusId === null ? null : { memberDietPlanId: 5, memberPayment: { paymentStatusId } },
      ),
    };
    const sequelize = { transaction: jest.fn() };
    const service = Object.create(MemberDietPlanService.prototype) as MemberDietPlanService;
    Object.assign(service, { memberDietPlanRepository, sequelize });
    return { service, sequelize };
  };

  const dietDetailBody = { dietPlanId: 5, cycleNo: 1, dayNo: 0, dietPlan: [], startDate: new Date() };

  it.each([PaymentStatusEnum.PENDING, PaymentStatusEnum.FAILED, PaymentStatusEnum.REFUND])(
    'blocks diet detail work when the payment is %s',
    async (status) => {
      const { service, sequelize } = build(status);

      await expect(
        service.createDietPlanDetail(4945, dietDetailBody as never, '127.0.0.1', 1),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(sequelize.transaction).not.toHaveBeenCalled();
    },
  );

  it('blocks applying a template and sending the plan when unpaid', async () => {
    const { service } = build(PaymentStatusEnum.PENDING);

    await expect(
      service.applyDietTemplate(4945, { dietTemplateId: 1, memberDietPlanId: 5 }, '127.0.0.1', 1),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.sendDietPlan(4945, 5, 1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets diet work through once the payment is PAID', async () => {
    const { service, sequelize } = build(PaymentStatusEnum.PAID);
    sequelize.transaction.mockRejectedValue(new Error('reached the transaction'));

    await expect(
      service.createDietPlanDetail(4945, dietDetailBody as never, '127.0.0.1', 1),
    ).rejects.toThrow('reached the transaction');
  });

  it('404s for a diet plan of another member', async () => {
    const { service } = build(null);

    await expect(service.sendDietPlan(1, 5, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
