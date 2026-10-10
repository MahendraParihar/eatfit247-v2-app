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
import {
  IManageMemberPayment,
  InvoiceSeriesEnum,
  PaymentSourceEnum,
  PaymentStatusEnum,
} from '@eatfit247-shared-lib';
import { TxnMember, TxnMemberPayment } from '../models';
import { MemberPlanService } from './member-plan.service';
import { MemberDietPlanService } from './member-diet-plan.service';
import { CheckoutGatewayService } from './checkout-gateway.service';
import { InvoiceIssueService } from './invoice-issue.service';

/** Roadmap 4.7 group 4: issue the number on the first edit to PAID, and the series guard. */
describe('MemberPlanService update: invoice on PAID and series guard', () => {
  let service: MemberPlanService;
  let paymentFindOne: jest.Mock;
  let generateInvoiceNumber: jest.Mock;
  let transaction: { commit: jest.Mock; rollback: jest.Mock; LOCK: { UPDATE: string } };
  let issuedCount: number;

  const US = { countryCode: 'US', country: 'United States' };
  const IN = { countryCode: 'IN', country: 'India' };

  /** A stored manual payment of an EFMUM member. */
  const stored = (overrides: Record<string, unknown> = {}) => ({
    memberPaymentId: 900,
    memberId: 4945,
    franchiseId: 1,
    paymentSource: PaymentSourceEnum.MANUAL,
    paymentStatusId: PaymentStatusEnum.PENDING,
    programPlanId: 3,
    currency: 'INR',
    discountAmount: '0.00',
    billingAddressId: 11,
    taxAmount: '0.00',
    memberAddress: { address: null, billingAddress: US },
    invoiceId: null as string | null,
    invoiceSeries: null as InvoiceSeriesEnum | null,
    invoiceDate: null as string | null,
    paymentDate: '2026-09-30',
    noOfCycle: 4,
    daysInCycle: 7,
    save: jest.fn().mockResolvedValue(undefined),
    reload: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue({}),
    ...overrides,
  });

  const edit = (overrides: Partial<IManageMemberPayment> = {}): IManageMemberPayment =>
    ({
      memberId: 4945,
      programId: 1,
      programPlanId: 3,
      paymentModeId: 1,
      paymentStatusId: PaymentStatusEnum.PAID,
      paymentSource: PaymentSourceEnum.MANUAL,
      paymentDate: new Date('2026-09-30'),
      transactionId: 'txn-1',
      currency: 'INR',
      discountAmount: 0,
      billingAddressId: 11,
      ...overrides,
    }) as IManageMemberPayment;

  /** What the edit prices to: the billing snapshot and tax the series rule reads. */
  const draftWith = (billingAddress: object, taxAmount: number) => {
    jest.spyOn(service as unknown as { buildPaymentDraft: () => Promise<unknown> }, 'buildPaymentDraft').mockResolvedValue({
      member: { franchiseId: 1 },
      memberAddressSnapshot: { address: null, billingAddress },
      paymentObj: { orderAmount: 1000, discountAmount: 0, taxAmount, totalAmount: 1000 + taxAmount, currency: 'INR' },
      noOfCycle: 4,
      noOfDaysInCycle: 7,
    });
  };

  beforeEach(async () => {
    transaction = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };
    paymentFindOne = jest.fn();
    issuedCount = 0;
    generateInvoiceNumber = jest.fn().mockImplementation(async (request: { series: InvoiceSeriesEnum; invoiceDate: string }) => {
      issuedCount += 1;
      const seriesPart = request.series === InvoiceSeriesEnum.EXPORT ? 'EXP/' : '';
      return {
        invoiceId: `EFMUM/${seriesPart}2026-27/S/${String(issuedCount).padStart(6, '0')}`,
        invoiceSeries: request.series,
        invoiceDate: request.invoiceDate,
      };
    });
    const invoiceIssueService = new InvoiceIssueService(
      { generateInvoiceNumber } as unknown as InvoiceSequenceService,
      {
        fetchById: jest.fn().mockResolvedValue({ financialYear: 4, franchiseCode: 'EFMUM', timeZone: 'Asia/Kolkata' }),
      } as unknown as FranchiseService,
      { filterByTableIdAndPk: jest.fn().mockResolvedValue([{ countryId: 101 }]) } as unknown as AddressService,
      { fetchById: jest.fn().mockResolvedValue({ countryCode: 'IN' }) } as unknown as CountryService,
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        MemberPlanService,
        { provide: getModelToken(TxnMember), useValue: {} },
        {
          provide: getModelToken(TxnMemberPayment),
          useValue: {
            findOne: paymentFindOne,
            scope: () => ({ findOne: paymentFindOne }),
          },
        },
        { provide: Sequelize, useValue: { transaction: jest.fn().mockResolvedValue(transaction) } },
        { provide: InvoiceIssueService, useValue: invoiceIssueService },
        {
          provide: MemberDietPlanService,
          useValue: {
            updateLimitsForPayment: jest.fn(),
            getPaymentPlanLimitImpact: jest.fn().mockResolvedValue({ highlights: [], warnings: [] }),
          },
        },
        { provide: AddressService, useValue: {} },
        { provide: ProgramPlanService, useValue: {} },
        { provide: TaxEngineService, useValue: {} },
        { provide: CountryService, useValue: {} },
        { provide: StateService, useValue: {} },
        { provide: FranchiseService, useValue: {} },
        { provide: CheckoutGatewayService, useValue: {} },
        { provide: AppConfigService, useValue: {} },
        { provide: PaymentModeService, useValue: {} },
        { provide: PaymentStatusService, useValue: {} },
        { provide: ProgramService, useValue: {} },
        { provide: FranchisePaymentGatewayService, useValue: {} },
        { provide: PaymentGatewayResolverService, useValue: {} },
        { provide: PaymentGatewayFactory, useValue: {} },
        { provide: PaymentGatewayCredentialService, useValue: {} },
        { provide: InvoicePdfService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(MemberPlanService);
    jest.spyOn(service as unknown as { convertToModel: (x: unknown) => unknown }, 'convertToModel').mockImplementation((x) => x);
    jest
      .spyOn(service as unknown as { buildUpdatePreviewChanges: () => unknown[] }, 'buildUpdatePreviewChanges')
      .mockReturnValue([]);
  });

  it('PENDING → PAID issues a number once; saving again issues nothing', async () => {
    const record = stored();
    paymentFindOne.mockResolvedValue(record);
    draftWith(US, 0);

    await service.update(4945, 900, edit(), '127.0.0.1', 7);
    expect(record).toMatchObject({ invoiceId: 'EFMUM/EXP/2026-27/S/000001', invoiceSeries: InvoiceSeriesEnum.EXPORT });
    // The row is locked and re-read inside the transaction before the number is issued
    expect(record.reload).toHaveBeenCalledWith({ transaction, lock: 'UPDATE' });
    expect(record.reload.mock.invocationCallOrder[0]).toBeLessThan(generateInvoiceNumber.mock.invocationCallOrder[0]);
    expect(record.invoiceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await service.update(4945, 900, edit(), '127.0.0.1', 7);
    expect(generateInvoiceNumber).toHaveBeenCalledTimes(1);
    expect(record.invoiceId).toBe('EFMUM/EXP/2026-27/S/000001');
  });

  it('PAID → PENDING keeps the number, and PAID again keeps the first number', async () => {
    const record = stored({ paymentStatusId: PaymentStatusEnum.PAID });
    paymentFindOne.mockResolvedValue(record);
    draftWith(US, 0);

    await service.update(4945, 900, edit(), '127.0.0.1', 7);
    const first = record.invoiceId;
    await service.update(4945, 900, edit({ paymentStatusId: PaymentStatusEnum.PENDING }), '127.0.0.1', 7);
    expect(record.invoiceId).toBe(first);
    await service.update(4945, 900, edit({ paymentStatusId: PaymentStatusEnum.PAID }), '127.0.0.1', 7);
    expect(record.invoiceId).toBe(first);
    expect(generateInvoiceNumber).toHaveBeenCalledTimes(1);
  });

  it('a PENDING edit issues no number', async () => {
    const record = stored();
    paymentFindOne.mockResolvedValue(record);
    draftWith(IN, 180);

    await service.update(4945, 900, edit({ paymentStatusId: PaymentStatusEnum.PENDING }), '127.0.0.1', 7);
    expect(generateInvoiceNumber).not.toHaveBeenCalled();
    expect(record.invoiceId).toBeNull();
  });

  it('rejects an edit that would move an issued invoice to the other series, and the preview reports it', async () => {
    const record = stored({
      paymentStatusId: PaymentStatusEnum.PAID,
      invoiceId: 'EFMUM/EXP/2026-27/S/000001',
      invoiceSeries: InvoiceSeriesEnum.EXPORT,
    });
    paymentFindOne.mockResolvedValue(record);
    draftWith(IN, 180);

    await expect(service.update(4945, 900, edit(), '127.0.0.1', 7)).rejects.toThrow(
      'This invoice is in the export series. This change would make it domestic. Issue a credit note and record a new payment instead.',
    );
    expect(record.save).not.toHaveBeenCalled();

    const preview = await service.previewUpdate(4945, 900, edit());
    expect(preview.blocked).toBe(true);
    expect(preview.blockReason).toContain('export series');
  });

  it('allows a financial edit that keeps the series', async () => {
    const record = stored({
      paymentStatusId: PaymentStatusEnum.PAID,
      invoiceId: 'EFMUM/2026-27/S/000004',
      invoiceSeries: InvoiceSeriesEnum.DOMESTIC,
      memberAddress: { address: null, billingAddress: IN },
      taxAmount: '180.00',
    });
    paymentFindOne.mockResolvedValue(record);
    draftWith(IN, 360);

    await service.update(4945, 900, edit({ discountAmount: 0 }), '127.0.0.1', 7);
    expect(record.save).toHaveBeenCalled();
    expect(record.invoiceId).toBe('EFMUM/2026-27/S/000004');
    const preview = await service.previewUpdate(4945, 900, edit());
    expect(preview.blocked).toBe(false);
  });

  it('an issued invoice keeps its price and tax on a non-financial edit (no recalculation)', async () => {
    const record = stored({
      paymentStatusId: PaymentStatusEnum.PAID,
      invoiceId: 'EFMUM/2026-27/S/000002',
      taxAmount: '0.00',
      totalAmount: '5085.00',
      taxMode: 'NO_TAX',
    });
    paymentFindOne.mockResolvedValue(record);
    const draftSpy = jest.spyOn(service as unknown as { buildPaymentDraft: (...args: unknown[]) => Promise<unknown> }, 'buildPaymentDraft');
    draftWith(US, 915.3);

    await service.update(4945, 900, edit({ transactionId: 'fixed-typo' }), '127.0.0.1', 7);
    expect(record.save).toHaveBeenCalled();
    expect(record).toMatchObject({ transactionId: 'fixed-typo', taxAmount: '0.00', totalAmount: '5085.00', taxMode: 'NO_TAX' });
    // The draft is built from the stored pricing, never re-priced
    expect(draftSpy.mock.calls[0][2]).toBe(record);
    expect(generateInvoiceNumber).not.toHaveBeenCalled();
  });

  it('an issued invoice refuses a financial or route change (credit note instead), and the preview says so', async () => {
    const record = stored({ paymentStatusId: PaymentStatusEnum.PAID, invoiceId: 'EFMUM/2026-27/S/000002' });
    paymentFindOne.mockResolvedValue(record);
    draftWith(US, 0);

    await expect(service.update(4945, 900, edit({ discountAmount: 100 }), '127.0.0.1', 7)).rejects.toThrow(
      'Invoice EFMUM/2026-27/S/000002 is issued',
    );
    await expect(
      service.update(4945, 900, edit({ paymentRoute: 'NRE_FCNR_ACCOUNT' as never }), '127.0.0.1', 7),
    ).rejects.toThrow('credit note');
    const preview = await service.previewUpdate(4945, 900, edit({ discountAmount: 100 }));
    expect(preview).toMatchObject({ blocked: true });
    expect(record.save).not.toHaveBeenCalled();
  });

  it('a backdated payment date does not backdate the invoice date or change the FY', async () => {
    const record = stored();
    paymentFindOne.mockResolvedValue(record);
    draftWith(IN, 180);

    await service.update(4945, 900, edit({ paymentDate: new Date('2026-03-15') }), '127.0.0.1', 7);
    expect(record.invoiceDate).not.toBe('2026-03-15');
    expect(generateInvoiceNumber.mock.calls[0][0].invoiceDate).toBe(record.invoiceDate);
    expect(generateInvoiceNumber.mock.calls[0][0].invoiceDate >= '2026-04-01').toBe(true);
  });
});
