import { Op } from 'sequelize';
import { IAddress, IDropdownItem } from '@eatfit247-shared-lib';
import { checkoutSessionStart } from '@server_1/core';
import { MemberService } from './member.service';
import { MemberPlanService } from './member-plan.service';
import { MemberProductService } from './member-product.service';

/** Group 9: remaining deep-review findings. */
describe('Group 9 review fixes', () => {
  describe('POST member/create for an existing member', () => {
    it('returns a token but never changes the existing profile', async () => {
      const update = jest.fn();
      const service = Object.create(MemberService.prototype) as MemberService;
      Object.assign(service, {
        memberRepository: {
          findOne: jest.fn().mockResolvedValue({ memberId: 4945, active: true, hasAnyPlan: true }),
          update,
        },
      });

      const res = await service.createOrUpdate(
        {
          firstName: 'Someone',
          lastName: 'Else',
          emailId: 'victim@example.com',
          countryCode: '+91',
          contactNumber: '9',
          franchiseId: 1,
          active: true,
          hasAnyPlan: false,
        } as Parameters<MemberService['createOrUpdate']>[0],
        '127.0.0.1',
      );

      expect(res).toMatchObject({ memberId: 4945, isNew: false });
      expect(typeof res.checkoutToken).toBe('string');
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('checkout invoice downloads are limited to the token session', () => {
    it('session start is the token issue time minus 5 minutes of clock skew', () => {
      const iat = 1_760_000_000;
      expect(checkoutSessionStart(iat).getTime()).toBe(iat * 1000 - 5 * 60 * 1000);
    });

    it('the plan invoice lookup filters on createdAt when a session start is given', async () => {
      const findOne = jest.fn().mockResolvedValue(null);
      const service = Object.create(MemberPlanService.prototype) as MemberPlanService;
      Object.assign(service, { memberPaymentRepository: { scope: () => ({ findOne }) } });
      const since = new Date('2026-10-10T05:00:00Z');

      await expect(service.generateInvoicePDF(4945, 46, since)).rejects.toThrow('Payment not found');

      const where = findOne.mock.calls[0][0].where;
      expect(where).toMatchObject({ memberPaymentId: 46, memberId: 4945, active: true });
      expect(where.createdAt[Op.gte]).toEqual(since);
    });

    it('admin invoice downloads (no session start) are unchanged', async () => {
      const findOne = jest.fn().mockResolvedValue(null);
      const service = Object.create(MemberPlanService.prototype) as MemberPlanService;
      Object.assign(service, { memberPaymentRepository: { scope: () => ({ findOne }) } });

      await expect(service.generateInvoicePDF(4945, 46)).rejects.toThrow('Payment not found');

      expect(findOne.mock.calls[0][0].where).not.toHaveProperty('createdAt');
    });
  });

  describe('product tax', () => {
    it('passes the billing address as billing and the franchise address as supplier', async () => {
      const service = Object.create(MemberProductService.prototype) as MemberProductService;
      const calculateTax = jest.fn().mockResolvedValue({
        orderAmount: 100, taxAmount: 12, totalAmount: 112, taxPercentage: 12, taxObj: {}, taxType: 'GST', taxMode: 'DOMESTIC_GST',
      });
      Object.assign(service, { calculateTax });
      const billing = { addressId: 10 } as IAddress;
      const franchiseAddress = { addressId: 1 } as IAddress;

      await service['calculateOrderItemsTax'](
        [{ productId: 1, productVariantId: 2, productName: 'P', quantity: 1, quantityLabel: '', quantityValue: 1, quantityUnit: 'g', baseAmount: 100, discountAmount: 0, currencyCode: 'INR' }],
        { id: 3 } as IDropdownItem,
        franchiseAddress,
        billing,
      );

      // calculateTax(productId, franchise, payload, billingAddress, franchiseAddress)
      expect(calculateTax.mock.calls[0][3]).toBe(billing);
      expect(calculateTax.mock.calls[0][4]).toBe(franchiseAddress);
    });
  });
});
