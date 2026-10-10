import { AddressService, CountryService, InvoiceSequenceService } from '@server_1/platform';
import { FranchiseService } from '@server_1/modules/franchise';
import { ExchangeRateService, MstExchangeRate } from '@server_1/modules/tax-engine';
import { InvoiceIssueService } from '../services/invoice-issue.service';
import { TxnMemberPayment } from '../models/txn-member-payment.model';

/** Roadmap 4.6 group 9: FX saved at issue (A16, A17) and the FBIL feed. */
describe('exchange rates', () => {
  describe('InvoiceIssueService.applyFx', () => {
    let findRate: jest.Mock;
    let service: InvoiceIssueService;
    const payment = (overrides: Partial<TxnMemberPayment>): TxnMemberPayment =>
      ({ invoiceId: 'EFMUM/EXP/2026-27/S/000001', currency: 'USD', totalAmount: 100, taxAmount: 18, ...overrides }) as unknown as TxnMemberPayment;

    beforeEach(() => {
      findRate = jest.fn();
      service = new InvoiceIssueService(
        {} as InvoiceSequenceService,
        {} as FranchiseService,
        {} as AddressService,
        {} as CountryService,
        { findRate } as unknown as ExchangeRateService,
      );
    });

    it('A16 a USD invoice of an Indian franchise saves the FBIL rate and INR equivalents', async () => {
      findRate.mockResolvedValue({ rate: 83.1234, rateDate: '2026-10-09', source: 'FBIL' });
      const record = payment({});
      await service.applyFx(record, 'plan', 'IN', '2026-10-12');
      expect(findRate).toHaveBeenCalledWith('USD', 'INR', '2026-10-12', 'SERVICES');
      expect(record).toMatchObject({
        functionalCurrency: 'INR',
        fxRate: 83.1234,
        fxRateDate: '2026-10-09',
        fxSource: 'FBIL',
        functionalTotalAmount: 8312.34,
        functionalTaxAmount: 1496.22,
      });
    });

    it('A16 a USD invoice of the UAE franchise is converted to AED; goods use the customs purpose', async () => {
      findRate.mockResolvedValue({ rate: 3.6725, rateDate: '1997-11-01', source: 'CBUAE_PEG' });
      const record = payment({});
      await service.applyFx(record, 'product', 'AE', '2026-10-12');
      expect(findRate).toHaveBeenCalledWith('USD', 'AED', '2026-10-12', 'GOODS');
      expect(record).toMatchObject({ functionalCurrency: 'AED', functionalTotalAmount: 367.25 });
    });

    it('A17 no rate yet: FX pending (functional currency set, rate empty), never throws', async () => {
      findRate.mockResolvedValue(null);
      const pending = payment({});
      await service.applyFx(pending, 'plan', 'IN', '2026-10-12');
      expect(pending).toMatchObject({ functionalCurrency: 'INR' });
      expect(pending.fxRate).toBeUndefined();

      findRate.mockRejectedValue(new Error('db down'));
      await expect(service.applyFx(payment({}), 'plan', 'IN', '2026-10-12')).resolves.toBeUndefined();
    });

    it('a same-currency invoice needs no FX', async () => {
      const record = payment({ currency: 'INR' });
      await service.applyFx(record, 'plan', 'IN', '2026-10-12');
      expect(findRate).not.toHaveBeenCalled();
      expect(record.functionalCurrency).toBeUndefined();
    });
  });

  describe('ExchangeRateService.fetchFbil', () => {
    const realFetch = global.fetch;
    afterEach(() => {
      global.fetch = realFetch;
    });

    it('saves INR rates per one unit (JPY is quoted per 100) and skips unknown products', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { processRunDate: '2026-10-09 00:00:00', subProdName: 'INR / 1 USD', rate: 83.5 },
          { processRunDate: '2026-10-09 00:00:00', subProdName: 'INR / 100 JPY', rate: 56.2 },
          { processRunDate: '2026-10-09 00:00:00', subProdName: 'MIBOR', rate: 6.5 },
        ],
      }) as unknown as typeof fetch;
      const create = jest.fn().mockResolvedValue({});
      const service = new ExchangeRateService({ findOne: jest.fn().mockResolvedValue(null), create } as unknown as typeof MstExchangeRate);

      const saved = await service.fetchFbil('2026-09-30', '2026-10-10');

      expect(saved).toBe(2);
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ fromCurrency: 'USD', toCurrency: 'INR', rate: 83.5, source: 'FBIL', rateDate: '2026-10-09' }));
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ fromCurrency: 'JPY', rate: 0.562 }));
    });

    it('Finance entries: MANUAL needs a note; customs rates are into INR', async () => {
      const service = new ExchangeRateService({ findOne: jest.fn(), create: jest.fn() } as unknown as typeof MstExchangeRate);
      const user = { adminId: 1 } as never;
      await expect(
        service.create({ rateDate: '2026-10-12', fromCurrency: 'EUR', toCurrency: 'AED', rate: 4.1, source: 'MANUAL' }, user, 'ip'),
      ).rejects.toThrow('note');
      await expect(
        service.create({ rateDate: '2026-10-01', fromCurrency: 'USD', toCurrency: 'AED', rate: 3.67, source: 'CBIC_CUSTOMS' }, user, 'ip'),
      ).rejects.toThrow('into INR');
    });
  });
});
