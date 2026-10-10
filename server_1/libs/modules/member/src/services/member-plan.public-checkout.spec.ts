import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AppConfigService } from '@server_1/core';
import {
  AddressService,
  CountryService,
  InvoicePdfService,
  PaymentModeService,
  PaymentStatusService,
  StateService,
} from '@server_1/platform';
import { ProgramPlanService, ProgramService } from '@server_1/modules/program-plan';
import { TaxEngineService } from '@server_1/modules/tax-engine';
import { FranchisePaymentGatewayService, FranchiseService } from '@server_1/modules/franchise';
import {
  PaymentGatewayCredentialService,
  PaymentGatewayFactory,
  PaymentGatewayResolverService,
} from '@server_1/modules/payment';
import { PaymentSourceEnum, PaymentStatusEnum, TableEnum } from '@eatfit247-shared-lib';
import { TxnMember, TxnMemberPayment } from '../models';
import { MemberPlanService } from './member-plan.service';
import { MemberDietPlanService } from './member-diet-plan.service';
import { CheckoutGatewayService } from './checkout-gateway.service';
import { InvoiceIssueService } from './invoice-issue.service';

describe('MemberPlanService public checkout', () => {
  let service: MemberPlanService;
  let transaction: { commit: jest.Mock; rollback: jest.Mock; LOCK: { UPDATE: string } };
  let createdPayment: Record<string, unknown> & { reload: jest.Mock; update: jest.Mock };
  let paymentCreate: jest.Mock;
  let paymentFindOne: jest.Mock;
  let taxCalculate: jest.Mock;
  let checkout: {
    applyPromoCode: jest.Mock;
    createGatewayOrder: jest.Mock;
    verifyAndConfirm: jest.Mock;
    createGatewayPaymentLink: jest.Mock;
    cancelGatewayPaymentLink: jest.Mock;
    requirePaymentLinkId: jest.Mock;
    assertGatewayAvailable: jest.Mock;
    isPaymentLink: jest.Mock;
    prepareGateway: jest.Mock;
    createLinkWith: jest.Mock;
    cancelLinkWith: jest.Mock;
    setAdminLockTimeout: jest.Mock;
    mapLockTimeout: jest.Mock;
  };
  let detailsFindOne: jest.Mock;
  let createIfNotExists: jest.Mock;
  let fetchPlan: jest.Mock;

  const order = {
    programPlanId: 3,
    currency: 'INR',
    addressId: 10,
    billingAddressId: 11,
    promoCode: 'SAVE10',
  };

  beforeEach(async () => {
    transaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      LOCK: { UPDATE: 'UPDATE' },
    } as typeof transaction;
    createdPayment = {
      memberPaymentId: 900,
      promoCode: 'SAVE10',
      reload: jest.fn().mockImplementation(async () => {
        // DECIMAL(10,2) columns come back rounded and as strings
        createdPayment.totalAmount = '1062.00';
        createdPayment.orderAmount = '1000.00';
        createdPayment.discountAmount = '100.00';
        createdPayment.taxAmount = '162.00';
        createdPayment.taxPercentage = 18;
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    paymentCreate = jest.fn().mockImplementation(async (data: Record<string, unknown>) => Object.assign(createdPayment, data));
    paymentFindOne = jest.fn();
    taxCalculate = jest.fn().mockImplementation(async (input: { baseAmount: number; discountAmount: number }) => {
      const taxable = input.baseAmount - input.discountAmount;
      return {
        baseAmount: input.baseAmount,
        discount: input.discountAmount,
        taxAmount: taxable * 0.18,
        totalAmount: taxable * 1.18 + 0.0049,
        taxPercentage: 18,
        taxType: 'GST',
        taxMode: 'DOMESTIC_GST',
        taxObj: {},
      };
    });
    checkout = {
      applyPromoCode: jest.fn().mockResolvedValue({ promoCode: 'SAVE10', discountAmount: 100, message: 'ok' }),
      createGatewayOrder: jest.fn().mockResolvedValue({
        gatewayCode: 'RAZORPAY',
        gatewayOrderId: 'order_new',
        keyId: 'rzp_key',
        amount: 1062,
        amountMinor: 106200,
        currency: 'INR',
        customer: {},
        notes: {},
        franchisePaymentGatewayId: 7,
      }),
      verifyAndConfirm: jest.fn(),
      createGatewayPaymentLink: jest.fn().mockResolvedValue({
        gatewayCode: 'RAZORPAY',
        paymentLinkId: 'plink_new',
        shortUrl: 'https://rzp.io/l/new',
        franchisePaymentGatewayId: 1,
      }),
      cancelGatewayPaymentLink: jest.fn().mockResolvedValue({ cancelled: true, status: 'cancelled' }),
      requirePaymentLinkId: jest.fn().mockImplementation((id: string) => id),
      assertGatewayAvailable: jest.fn().mockResolvedValue(undefined),
      isPaymentLink: jest.fn().mockImplementation((id: string | null) => !!id && id.startsWith('plink_')),
      prepareGateway: jest.fn().mockResolvedValue({ franchisePaymentGatewayId: 1, gatewayCode: 'RAZORPAY', credentials: { keyId: 'k', keySecret: 's' } }),
      createLinkWith: jest.fn().mockResolvedValue({
        gatewayCode: 'RAZORPAY',
        paymentLinkId: 'plink_new',
        shortUrl: 'https://rzp.io/l/new',
        franchisePaymentGatewayId: 1,
      }),
      cancelLinkWith: jest.fn().mockResolvedValue({ cancelled: true, status: 'cancelled' }),
      setAdminLockTimeout: jest.fn().mockResolvedValue(undefined),
      mapLockTimeout: jest.fn().mockImplementation((error: unknown) => error),
    };
    detailsFindOne = jest.fn().mockResolvedValue({ memberPaymentId: 900, memberId: 4945 });
    createIfNotExists = jest.fn().mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        MemberPlanService,
        {
          provide: getModelToken(TxnMember),
          useValue: (() => {
            const member = { memberId: 4945, franchiseId: 1, firstName: 'Test', emailId: 't@e.st' };
            const findOne = jest.fn().mockResolvedValue(member);
            return { findOne, scope: () => ({ findOne }) };
          })(),
        },
        {
          provide: getModelToken(TxnMemberPayment),
          useValue: { create: paymentCreate, findOne: paymentFindOne, scope: () => ({ findOne: detailsFindOne }) },
        },
        { provide: Sequelize, useValue: { transaction: jest.fn().mockResolvedValue(transaction) } },
        {
          provide: AddressService,
          useValue: {
            filterByTableIdAndPk: jest.fn().mockImplementation(async (table: TableEnum) =>
              table === TableEnum.MST_FRANCHISES
                ? [{ addressId: 1, pkOfTable: 1, countryId: 1, stateId: 1 }]
                : [
                    { addressId: 10, countryId: 1, stateId: 1 },
                    { addressId: 11, countryId: 1, stateId: 1 },
                  ],
            ),
          },
        },
        {
          provide: ProgramPlanService,
          useValue: {
            fetchById: fetchPlan = jest.fn().mockResolvedValue({
              programPlanId: 3,
              plan: 'Gold',
              active: true,
              isVisibleOnWeb: true,
              noOfCycle: 4,
              noOfDaysInCycle: 7,
              programPlanFees: [{ fees: 1000, currencyCode: 'INR' }],
            }),
          },
        },
        { provide: TaxEngineService, useValue: { calculate: taxCalculate } },
        { provide: CountryService, useValue: { fetchById: jest.fn().mockResolvedValue({ countryCode: 'IN' }) } },
        { provide: StateService, useValue: { fetchById: jest.fn().mockResolvedValue({ code: 'MH' }) } },
        { provide: FranchiseService, useValue: { franchiseByBusinessType: jest.fn().mockResolvedValue([{ id: 1 }]) } },
        { provide: MemberDietPlanService, useValue: { createIfNotExists, updateLimitsForPayment: jest.fn() } },
        { provide: CheckoutGatewayService, useValue: checkout },
        { provide: AppConfigService, useValue: {} },
        { provide: PaymentModeService, useValue: {} },
        { provide: PaymentStatusService, useValue: {} },
        { provide: ProgramService, useValue: {} },
        { provide: FranchisePaymentGatewayService, useValue: {} },
        { provide: PaymentGatewayResolverService, useValue: {} },
        { provide: PaymentGatewayFactory, useValue: {} },
        { provide: PaymentGatewayCredentialService, useValue: {} },
        { provide: InvoicePdfService, useValue: {} },
        { provide: InvoiceIssueService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(MemberPlanService);
  });

  it('prices from the plan fee, promo and tax — not the client — and creates a PENDING record with no payment date', async () => {
    await service.createPublicCheckoutOrder(4945, order, '127.0.0.1');

    expect(checkout.applyPromoCode).toHaveBeenCalledWith('SAVE10', 1000, 'INR');
    expect(taxCalculate).toHaveBeenCalledWith(expect.objectContaining({ baseAmount: 1000, discountAmount: 100 }));
    expect(paymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 4945,
        paymentStatusId: PaymentStatusEnum.PENDING,
        paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY,
        paymentDate: null,
        transactionId: null,
        orderAmount: 1000,
        discountAmount: 100,
        promoCode: 'SAVE10',
      }),
      { transaction },
    );
    expect(createIfNotExists).toHaveBeenCalledWith(4945, 900, 4, 7, '127.0.0.1', null, transaction);
    expect(taxCalculate).toHaveBeenCalledWith(expect.objectContaining({ franchiseId: 1, supplierCountryCode: 'IN' }));
  });

  it('stores the checkout session (token jti) on the record', async () => {
    await service.createPublicCheckoutOrder(4945, order, '127.0.0.1', 'session-123');

    expect(paymentCreate).toHaveBeenCalledWith(expect.objectContaining({ checkoutSessionId: 'session-123' }), { transaction });
  });

  it('creates the gateway order for the stored (rounded) total and stores the gateway on the record', async () => {
    const res = await service.createPublicCheckoutOrder(4945, order, '127.0.0.1');

    expect(checkout.createGatewayOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1062, currency: 'INR', receipt: 'plan_900' }),
    );
    expect(createdPayment.update).toHaveBeenCalledWith(
      { gatewayOrderId: 'order_new', gatewayProvider: 'RAZORPAY', franchisePaymentGatewayId: 7 },
      { transaction },
    );
    expect(transaction.commit).toHaveBeenCalled();
    expect(res).toMatchObject({
      recordId: 900,
      paymentStatusId: PaymentStatusEnum.PENDING,
      breakdown: { orderAmount: 1000, discountAmount: 100, totalAmount: 1062, promoCode: 'SAVE10' },
      gateway: { gatewayOrderId: 'order_new', amountMinor: 106200 },
    });
    expect(res.gateway).not.toHaveProperty('franchisePaymentGatewayId');
  });

  it('rolls the record back when the gateway call fails', async () => {
    checkout.createGatewayOrder.mockRejectedValue(new BadRequestException('gateway down'));

    await expect(service.createPublicCheckoutOrder(4945, order, '127.0.0.1')).rejects.toThrow('gateway down');
    expect(transaction.rollback).toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  it('an invalid promo stops the order before anything is created', async () => {
    checkout.applyPromoCode.mockRejectedValue(new BadRequestException('Invalid promo code'));

    await expect(service.createPublicCheckoutOrder(4945, order, '127.0.0.1')).rejects.toBeInstanceOf(BadRequestException);
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it('rejects an address that does not belong to the member, or a currency the plan is not sold in', async () => {
    await expect(
      service.createPublicCheckoutOrder(4945, { ...order, billingAddressId: 999 }, '127.0.0.1'),
    ).rejects.toThrow('Address does not belong to this member');
    await expect(service.createPublicCheckoutOrder(4945, { ...order, currency: 'USD' }, '127.0.0.1')).rejects.toThrow(
      'This plan is not available in USD',
    );
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it('a plan that is not offered on the website cannot be bought by id', async () => {
    fetchPlan.mockResolvedValue({
      programPlanId: 9,
      plan: 'Hidden',
      active: true,
      isVisibleOnWeb: false,
      noOfCycle: 1,
      noOfDaysInCycle: 7,
      programPlanFees: [{ fees: 100, currencyCode: 'INR' }],
    });

    await expect(service.createPublicCheckoutOrder(4945, order, '127.0.0.1')).rejects.toThrow('This plan is not available');
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it('verify with a forged signature leaves the record PENDING and not verified', async () => {
    const record = {
      memberPaymentId: 900,
      gatewayOrderId: 'order_new',
      gatewayProvider: 'RAZORPAY',
      franchisePaymentGatewayId: 7,
      paymentStatusId: PaymentStatusEnum.PENDING,
      invoiceId: null,
      reload: jest.fn(),
    };
    paymentFindOne.mockResolvedValue(record);
    checkout.verifyAndConfirm.mockResolvedValue({ captured: false, message: 'Payment signature is not valid' });

    const res = await service.verifyPublicPayment(
      4945,
      { orderId: 'order_new', paymentId: 'pay_1', signature: 'forged' },
      '127.0.0.1',
    );

    expect(paymentFindOne).toHaveBeenCalledWith({ where: { gatewayOrderId: 'order_new', memberId: 4945, active: true } });
    expect(res).toMatchObject({ verified: false, paymentStatusId: PaymentStatusEnum.PENDING, invoiceId: null });
  });

  it('verify cannot reach another member\'s order', async () => {
    paymentFindOne.mockResolvedValue(null);

    await expect(
      service.verifyPublicPayment(1, { orderId: 'order_new', paymentId: 'pay_1', signature: 's' }, '127.0.0.1'),
    ).rejects.toThrow('Order not found');
    expect(checkout.verifyAndConfirm).not.toHaveBeenCalled();
  });

  describe('admin gateway payments (decisions 13–14)', () => {
    const adminGatewayPayment = {
      memberId: 4945,
      programId: 1,
      programPlanId: 3,
      currency: 'INR',
      addressId: 10,
      billingAddressId: 11,
      discountAmount: 100,
      paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY,
      // A client trying to set money state on a gateway record
      paymentStatusId: PaymentStatusEnum.PAID,
      paymentDate: new Date('2026-10-10'),
      transactionId: 'cash-123',
      gatewayOrderId: 'plink_from_browser',
      paymentLink: 'https://evil.example',
      franchisePaymentGatewayId: 1,
    } as unknown as Parameters<MemberPlanService['create']>[1];

    it('create saves a PENDING record (ignoring client status, date and ids), then a link for the stored total', async () => {
      await service.create(4945, adminGatewayPayment, '127.0.0.1', 7);

      expect(paymentCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatusId: PaymentStatusEnum.PENDING,
          paymentDate: null,
          transactionId: null,
          createdBy: 7,
        }),
        { transaction },
      );
      expect(paymentCreate.mock.calls[0][0]).not.toHaveProperty('gatewayOrderId');
      expect(checkout.createGatewayPaymentLink).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 1062, currency: 'INR', requestedGatewayId: 1, franchiseId: 1 }),
      );
      expect(createdPayment.update).toHaveBeenCalledWith(
        { paymentLink: 'https://rzp.io/l/new', gatewayOrderId: 'plink_new', gatewayProvider: 'RAZORPAY', franchisePaymentGatewayId: 1 },
        { transaction },
      );
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('create rolls the record back when the link cannot be created', async () => {
      checkout.createGatewayPaymentLink.mockRejectedValue(new BadRequestException('gateway down'));

      await expect(service.create(4945, adminGatewayPayment, '127.0.0.1', 7)).rejects.toThrow('gateway down');
      expect(transaction.rollback).toHaveBeenCalled();
      expect(transaction.commit).not.toHaveBeenCalled();
    });

    describe('update of a gateway record', () => {
      const storedGateway = () => ({
        memberPaymentId: 900,
        memberId: 4945,
        paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY,
        paymentStatusId: PaymentStatusEnum.PENDING,
        programPlanId: 3,
        currency: 'INR',
        discountAmount: '100.00',
        billingAddressId: 11,
        totalAmount: '1062.00',
        paymentDate: null,
        transactionId: null,
        gatewayOrderId: 'plink_1',
        noOfCycle: 4,
        daysInCycle: 7,
        save: jest.fn(),
        reload: jest.fn(),
      });

      it('cannot switch a gateway payment to manual', async () => {
        paymentFindOne.mockResolvedValue(storedGateway());

        await expect(
          service.update(4945, 900, { ...adminGatewayPayment, paymentSource: PaymentSourceEnum.MANUAL }, '127.0.0.1', 7),
        ).rejects.toThrow('cannot be changed to manual');
      });

      it('cannot change the amount while the link is open', async () => {
        paymentFindOne.mockResolvedValue(storedGateway());

        await expect(
          service.update(4945, 900, { ...adminGatewayPayment, discountAmount: 500 }, '127.0.0.1', 7),
        ).rejects.toThrow('open payment link');
      });

      it('keeps status, date, transaction, gateway ids and stored amounts; only non-money fields change', async () => {
        const record = storedGateway();
        paymentFindOne.mockResolvedValue(record);
        jest
          .spyOn(service as unknown as { buildPaymentDraft: () => Promise<unknown> }, 'buildPaymentDraft')
          .mockResolvedValue({ memberAddressSnapshot: { address: null, billingAddress: null }, paymentObj: { totalAmount: 1 }, noOfCycle: 4, noOfDaysInCycle: 7 });

        await service.update(4945, 900, { ...adminGatewayPayment, gstNumber: '27AAAAA0000A1Z5' }, '127.0.0.1', 7);

        expect(record).toMatchObject({
          paymentStatusId: PaymentStatusEnum.PENDING,
          paymentDate: null,
          transactionId: null,
          gatewayOrderId: 'plink_1',
          totalAmount: '1062.00',
          gstNumber: '27AAAAA0000A1Z5',
        });
        expect(record.save).toHaveBeenCalled();
      });

      it('the amount of a PAID gateway payment cannot be changed either', async () => {
        paymentFindOne.mockResolvedValue({ ...storedGateway(), paymentStatusId: PaymentStatusEnum.PAID });

        await expect(
          service.update(4945, 900, { ...adminGatewayPayment, discountAmount: 500 }, '127.0.0.1', 7),
        ).rejects.toThrow('paid gateway payment cannot be changed');
      });

      it('a manual payment cannot be turned into a gateway payment by editing', async () => {
        paymentFindOne.mockResolvedValue({ ...storedGateway(), paymentSource: PaymentSourceEnum.MANUAL });

        await expect(service.update(4945, 900, adminGatewayPayment, '127.0.0.1', 7)).rejects.toThrow('create a new payment');
      });
    });

    const pendingGatewayRecord = (overrides: Record<string, unknown> = {}) => ({
      memberPaymentId: 900,
      paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY,
      paymentStatusId: PaymentStatusEnum.PENDING,
      gatewayOrderId: 'plink_old',
      gatewayProvider: 'RAZORPAY',
      franchisePaymentGatewayId: 1,
      currency: 'INR',
      totalAmount: '1062.00',
      paymentGatewayResponse: { id: 'pay_failed_1', status: 'failed' },
      update: jest.fn(),
      ...overrides,
    });
    const stubFindById = () =>
      jest.spyOn(service, 'findById').mockResolvedValue({} as Awaited<ReturnType<MemberPlanService['findById']>>);

    it('cancel: gateway prepared before the lock; under a short lock timeout the link is cancelled and the payment FAILED', async () => {
      const record = pendingGatewayRecord();
      paymentFindOne.mockResolvedValue(record);
      stubFindById();

      await service.cancelPaymentLink(4945, 900, '127.0.0.1', 7, 'plink_old');

      expect(checkout.prepareGateway).toHaveBeenCalledWith(expect.objectContaining({ franchisePaymentGatewayId: 1, franchiseId: 1 }));
      expect(checkout.prepareGateway.mock.invocationCallOrder[0]).toBeLessThan(checkout.setAdminLockTimeout.mock.invocationCallOrder[0]);
      expect(paymentFindOne).toHaveBeenCalledWith(expect.objectContaining({ transaction, lock: 'UPDATE' }));
      expect(checkout.cancelLinkWith).toHaveBeenCalledWith(expect.objectContaining({ franchisePaymentGatewayId: 1 }), 'plink_old');
      expect(record.update).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatusId: PaymentStatusEnum.FAILED,
          modifiedBy: 7,
          // earlier gateway evidence is kept
          paymentGatewayResponse: expect.objectContaining({ id: 'pay_failed_1', adminCancellation: expect.objectContaining({ adminId: 7 }) }),
        }),
        { transaction },
      );
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('cancel refuses a link that was already paid and leaves the payment PENDING', async () => {
      const record = pendingGatewayRecord();
      paymentFindOne.mockResolvedValue(record);
      checkout.cancelLinkWith.mockResolvedValue({ cancelled: false, status: 'paid' });

      await expect(service.cancelPaymentLink(4945, 900, '127.0.0.1', 7)).rejects.toThrow('already been paid');
      expect(record.update).not.toHaveBeenCalled();
      expect(transaction.rollback).toHaveBeenCalled();
    });

    it('cancel and regenerate refuse when the link changed since the admin saw it (409)', async () => {
      paymentFindOne.mockResolvedValue(pendingGatewayRecord({ gatewayOrderId: 'plink_newer' }));

      await expect(service.cancelPaymentLink(4945, 900, '127.0.0.1', 7, 'plink_old')).rejects.toThrow('changed by another request');
      await expect(service.regeneratePaymentLink(4945, 900, 'plink_old')).rejects.toThrow('changed by another request');
      expect(checkout.cancelLinkWith).not.toHaveBeenCalled();
      expect(checkout.createLinkWith).not.toHaveBeenCalled();
    });

    it('a website-checkout payment (gateway order, no link) is marked FAILED without a gateway call', async () => {
      const record = pendingGatewayRecord({ gatewayOrderId: 'order_web1' });
      paymentFindOne.mockResolvedValue(record);
      stubFindById();

      await service.cancelPaymentLink(4945, 900, '127.0.0.1', 7);

      expect(checkout.cancelLinkWith).not.toHaveBeenCalled();
      expect(record.update).toHaveBeenCalledWith(expect.objectContaining({ paymentStatusId: PaymentStatusEnum.FAILED }), { transaction });
      await expect(service.regeneratePaymentLink(4945, 900)).rejects.toThrow('no payment link to regenerate');
    });

    it('a payment that is no longer PENDING is refused before any gateway work', async () => {
      paymentFindOne.mockResolvedValue(pendingGatewayRecord({ paymentStatusId: PaymentStatusEnum.FAILED }));

      await expect(service.cancelPaymentLink(4945, 900, '127.0.0.1', 7)).rejects.toThrow('Only a pending payment-gateway payment');
      await expect(service.regeneratePaymentLink(4945, 900)).rejects.toThrow('Only a pending payment-gateway payment');
      expect(checkout.prepareGateway).not.toHaveBeenCalled();
    });

    it('regenerate: both gateways prepared before the lock, then cancel old → create new → save', async () => {
      const record = pendingGatewayRecord();
      paymentFindOne.mockResolvedValue(record);
      stubFindById();

      await service.regeneratePaymentLink(4945, 900, 'plink_old');

      expect(checkout.prepareGateway).toHaveBeenCalledTimes(2);
      expect(checkout.prepareGateway.mock.invocationCallOrder[1]).toBeLessThan(checkout.setAdminLockTimeout.mock.invocationCallOrder[0]);
      expect(checkout.cancelLinkWith.mock.invocationCallOrder[0]).toBeLessThan(checkout.createLinkWith.mock.invocationCallOrder[0]);
      expect(checkout.createLinkWith).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ amount: 1062 }));
      expect(record.update).toHaveBeenCalledWith(expect.objectContaining({ gatewayOrderId: 'plink_new' }), { transaction });
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('regenerate does nothing at the gateway when no new link can be prepared', async () => {
      paymentFindOne.mockResolvedValue(pendingGatewayRecord());
      checkout.prepareGateway
        .mockResolvedValueOnce({ franchisePaymentGatewayId: 1, gatewayCode: 'RAZORPAY', credentials: { keyId: 'k', keySecret: 's' } })
        .mockRejectedValueOnce(new BadRequestException('No payment gateway configured'));

      await expect(service.regeneratePaymentLink(4945, 900)).rejects.toThrow('No payment gateway configured');
      expect(checkout.cancelLinkWith).not.toHaveBeenCalled();
    });

    it('regenerate works for a legacy record that never had a link', async () => {
      const record = pendingGatewayRecord({ gatewayOrderId: null, franchisePaymentGatewayId: null });
      paymentFindOne.mockResolvedValue(record);
      stubFindById();

      await service.regeneratePaymentLink(4945, 900);

      expect(checkout.cancelLinkWith).not.toHaveBeenCalled();
      expect(record.update).toHaveBeenCalledWith(expect.objectContaining({ gatewayOrderId: 'plink_new' }), { transaction });
    });

    it('regenerate cancels the new link again when saving it fails', async () => {
      const record = pendingGatewayRecord();
      record.update.mockRejectedValue(new Error('db write failed'));
      paymentFindOne.mockResolvedValue(record);

      await expect(service.regeneratePaymentLink(4945, 900)).rejects.toThrow('db write failed');
      expect(transaction.rollback).toHaveBeenCalled();
      expect(checkout.cancelGatewayPaymentLink).toHaveBeenCalledWith(expect.objectContaining({ paymentLinkId: 'plink_new' }));
    });

    it('a busy row (lock timeout) is reported through mapLockTimeout', async () => {
      paymentFindOne.mockResolvedValue(pendingGatewayRecord());
      const lockError = Object.assign(new Error('canceling statement due to lock timeout'), { original: { code: '55P03' } });
      paymentFindOne.mockResolvedValueOnce(pendingGatewayRecord()).mockRejectedValueOnce(lockError);
      checkout.mapLockTimeout.mockReturnValue(new ConflictException('busy'));

      await expect(service.cancelPaymentLink(4945, 900, '127.0.0.1', 7)).rejects.toThrow('busy');
      expect(checkout.mapLockTimeout).toHaveBeenCalledWith(lockError);
    });

    it('a failed save after the link was created cancels that link (no record has it)', async () => {
      createdPayment.update.mockRejectedValueOnce(new Error('db write failed'));
      paymentFindOne.mockResolvedValue(null);

      await expect(service.create(4945, adminGatewayPayment, '127.0.0.1', 7)).rejects.toThrow('db write failed');
      expect(transaction.rollback).toHaveBeenCalled();
      expect(checkout.cancelGatewayPaymentLink).toHaveBeenCalledWith(expect.objectContaining({ paymentLinkId: 'plink_new' }));
    });

    it('a failed COMMIT that was actually applied does not cancel the recorded link', async () => {
      transaction.commit.mockRejectedValueOnce(new Error('connection lost during commit'));
      paymentFindOne.mockResolvedValue({ memberPaymentId: 900 });

      await expect(service.create(4945, adminGatewayPayment, '127.0.0.1', 7)).rejects.toThrow('connection lost during commit');
      expect(checkout.cancelGatewayPaymentLink).not.toHaveBeenCalled();
    });
  });
});
