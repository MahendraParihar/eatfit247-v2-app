import { PaymentRouteEnum, PaymentSourceEnum } from '@eatfit247-shared-lib';
import { customerNumberOptions, MemberPlanService } from './member-plan.service';
import { TxnMemberPayment } from '../models';

/** Configurable tax treatment 9.1 (decision 10, A17 / A28): when the customer's GSTIN / TRN is enforced, and when it locks. */
describe('MemberPlanService customer GSTIN / TRN', () => {
  it('a new number is enforced; an unchanged one is not (a legacy 456789 stays editable); spacing and case don\'t count as a change', () => {
    expect(customerNumberOptions('29AAACE1234F1Z2')).toEqual({ customerRegistrationNumber: '29AAACE1234F1Z2', enforceCustomerRegistration: true });
    expect(customerNumberOptions('456789', '456789')).toEqual({ customerRegistrationNumber: '456789', enforceCustomerRegistration: false });
    expect(customerNumberOptions('29aaace1234f1z2 ', '29AAACE1234F1Z2')).toMatchObject({ enforceCustomerRegistration: false });
    expect(customerNumberOptions('29AAACE1234F1Z2', '456789')).toMatchObject({ enforceCustomerRegistration: true });
    expect(customerNumberOptions('', '456789')).toEqual({ customerRegistrationNumber: null, enforceCustomerRegistration: false });
    expect(customerNumberOptions(undefined)).toEqual({ customerRegistrationNumber: null, enforceCustomerRegistration: false });
  });

  it('on a locked record (issued invoice, gateway payment) a changed customer number is detected and refused (D16)', () => {
    const service = Object.create(MemberPlanService.prototype) as MemberPlanService;
    const stored = {
      programPlanId: 263,
      currency: 'INR',
      discountAmount: 0,
      billingAddressId: 3404,
      paymentSource: PaymentSourceEnum.MANUAL,
      paymentRoute: PaymentRouteEnum.DOMESTIC,
      gstNumber: '27AAACE1234F1Z6',
    } as unknown as TxnMemberPayment;
    const edit = (gstNumber: string | undefined) =>
      service['customerNumberChanged'](stored, { programPlanId: 263, currency: 'INR', discountAmount: 0, billingAddressId: 3404, paymentSource: PaymentSourceEnum.MANUAL, paymentRoute: PaymentRouteEnum.DOMESTIC, gstNumber } as never);
    expect(edit('27AAACE1234F1Z6')).toBe(false);
    expect(edit(' 27aaace1234f1z6')).toBe(false);
    expect(edit('29AAACE1234F1Z2')).toBe(true);
    expect(edit(undefined)).toBe(true);
  });
});
