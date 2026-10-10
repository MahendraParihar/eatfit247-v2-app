import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AppConfigService } from '@server_1/core';
import {
  AddressService,
  CountryService,
  InvoicePdfService,
  InvoiceSequenceService,
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

describe('MemberPlanService public checkout', () => {
  let service: MemberPlanService;
  let transaction: { commit: jest.Mock; rollback: jest.Mock };
  let createdPayment: Record<string, unknown> & { reload: jest.Mock; update: jest.Mock };
  let paymentCreate: jest.Mock;
  let paymentFindOne: jest.Mock;
  let taxCalculate: jest.Mock;
  let checkout: { applyPromoCode: jest.Mock; createGatewayOrder: jest.Mock; verifyAndConfirm: jest.Mock };
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
    transaction = { commit: jest.fn(), rollback: jest.fn() };
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
    };
    createIfNotExists = jest.fn().mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        MemberPlanService,
        {
          provide: getModelToken(TxnMember),
          useValue: { findOne: jest.fn().mockResolvedValue({ memberId: 4945, franchiseId: 1, firstName: 'Test', emailId: 't@e.st' }) },
        },
        { provide: getModelToken(TxnMemberPayment), useValue: { create: paymentCreate, findOne: paymentFindOne } },
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
        { provide: MemberDietPlanService, useValue: { createIfNotExists } },
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
        { provide: InvoiceSequenceService, useValue: {} },
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
});
