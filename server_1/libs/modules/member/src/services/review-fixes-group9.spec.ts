import { IAddress, IDropdownItem } from '@eatfit247-shared-lib';
import { CheckoutTokenUtil } from '@server_1/core';
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

  describe('checkout invoice downloads are limited to the session that created the order', () => {
    const planServiceWith = (findOne: jest.Mock): MemberPlanService => {
      const service = Object.create(MemberPlanService.prototype) as MemberPlanService;
      Object.assign(service, { memberPaymentRepository: { scope: () => ({ findOne }) } });
      return service;
    };

    it('checkout tokens carry a unique session id (jti)', () => {
      const a = CheckoutTokenUtil.verify(CheckoutTokenUtil.sign(4945));
      const b = CheckoutTokenUtil.verify(CheckoutTokenUtil.sign(4945));
      expect(a?.jti).toBeTruthy();
      expect(a?.jti).not.toBe(b?.jti);
    });

    it('the public plan invoice lookup requires the same checkout session', async () => {
      const findOne = jest.fn().mockResolvedValue(null);

      await expect(planServiceWith(findOne).generateInvoicePDF(4945, 46, 'session-a')).rejects.toThrow('Payment not found');

      expect(findOne.mock.calls[0][0].where).toMatchObject({
        memberPaymentId: 46,
        memberId: 4945,
        active: true,
        checkoutSessionId: 'session-a',
      });
    });

    it('a token without a session id gets nothing (fails closed)', async () => {
      const findOne = jest.fn();

      await expect(planServiceWith(findOne).generateInvoicePDF(4945, 46, null)).rejects.toThrow('Payment not found');
      expect(findOne).not.toHaveBeenCalled();
    });

    it('admin invoice downloads (no session argument) are unchanged', async () => {
      const findOne = jest.fn().mockResolvedValue(null);

      await expect(planServiceWith(findOne).generateInvoicePDF(4945, 46)).rejects.toThrow('Payment not found');

      expect(findOne.mock.calls[0][0].where).not.toHaveProperty('checkoutSessionId');
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
