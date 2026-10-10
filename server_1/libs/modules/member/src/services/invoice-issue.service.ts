import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { BusinessTypeEnum, IFranchise, InvoiceSeriesEnum, TableEnum } from '@eatfit247-shared-lib';
import {
  AddressService,
  CountryService,
  FranchiseDateUtil,
  IIssuedInvoiceNumber,
  InvoiceSequenceService,
  InvoiceSeriesUtil,
} from '@server_1/platform';
import { FranchiseService } from '@server_1/modules/franchise';
import { ExchangeRateService, IResolvedRate } from '@server_1/modules/tax-engine';
import { Op } from 'sequelize';
import { TxnMemberPayment } from '../models/txn-member-payment.model';
import { TxnMemberProduct } from '../models/txn-member-product.model';
import { TxnMemberProductOrderItem } from '../models/txn-member-product-order-item.model';

export type InvoiceRecordType = 'plan' | 'product';

/** The franchise facts needed to date and number an invoice. */
export interface IInvoiceFranchiseContext {
  franchise: IFranchise;
  countryCode: string | null;
  timeZone: string;
}

/**
 * Issues invoice numbers for plan payments and product orders (roadmap 4.7).
 * Every issuing path (admin create, admin edit to PAID, gateway confirmation) goes through
 * `issue`, so the series rule and the invoice date live in one place.
 */
@Injectable()
export class InvoiceIssueService {
  private readonly logger = new Logger(InvoiceIssueService.name);

  constructor(
    private readonly invoiceSequenceService: InvoiceSequenceService,
    private readonly franchiseService: FranchiseService,
    private readonly addressService: AddressService,
    private readonly countryService: CountryService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  /** Franchise, its country (from its address) and timezone. */
  public async franchiseContext(franchiseId: number): Promise<IInvoiceFranchiseContext> {
    const franchise = await this.franchiseService.fetchById(franchiseId);
    const addresses = await this.addressService.filterByTableIdAndPk(TableEnum.MST_FRANCHISES, franchiseId);
    const countryId = addresses?.[0]?.countryId;
    const countryCode = countryId ? await this.countryCodeById(countryId) : null;
    if (!countryCode) {
      // Without the franchise's country every invoice falls back to the domestic series
      this.logger.warn(`Country unknown for franchise ${franchiseId}; invoices use the domestic series`);
    }
    return {
      franchise,
      countryCode,
      timeZone: franchise.timeZone || FranchiseDateUtil.DEFAULT_TIME_ZONE,
    };
  }

  /**
   * Issues the record's invoice number if it has none, inside the caller's transaction, and sets
   * `invoiceId`, `invoiceSeries` and `invoiceDate` on the record (the caller saves it).
   * An issued number is never changed: returns null when the record already has one.
   */
  public async issue(
    record: TxnMemberPayment | TxnMemberProduct,
    recordType: InvoiceRecordType,
    franchiseId: number,
    transaction: Transaction,
    issuedAt: Date = new Date(),
    context?: IInvoiceFranchiseContext,
  ): Promise<IIssuedInvoiceNumber | null> {
    if (record.invoiceId) {
      return null;
    }
    const franchiseContext = context ?? (await this.franchiseContext(franchiseId));
    const taxModes =
      recordType === 'product'
        ? await this.productLineModes((record as TxnMemberProduct).memberProductId, transaction)
        : [(record as TxnMemberPayment).taxMode];
    const series = await this.resolveSeries({ memberAddress: record.memberAddress, taxAmount: record.taxAmount, taxModes }, franchiseContext.countryCode);
    const issued = await this.invoiceSequenceService.generateInvoiceNumber(
      {
        franchiseId,
        franchiseCode: franchiseContext.franchise.franchiseCode,
        fyStartMonth: Number(franchiseContext.franchise.financialYear),
        invoiceType: recordType === 'product' ? BusinessTypeEnum.PRODUCT : BusinessTypeEnum.SERVICE,
        series,
        invoiceDate: FranchiseDateUtil.localDate(issuedAt, franchiseContext.timeZone),
      },
      transaction,
    );
    record.invoiceId = issued.invoiceId;
    record.invoiceSeries = issued.invoiceSeries;
    record.invoiceDate = issued.invoiceDate;
    await this.applyFx(record, recordType, franchiseContext.countryCode, issued.invoiceDate);
    return issued;
  }

  /**
   * Saves the invoice's value in the franchise's functional currency (INR for Indian franchises,
   * AED for the UAE) at the official rate for the invoice date (decision 14). A same-currency
   * invoice needs none; without a rate yet the invoice is "FX pending" (functional currency set,
   * rate empty) and the daily job fills it in. Never blocks issuing.
   */
  public async applyFx(
    record: TxnMemberPayment | TxnMemberProduct,
    recordType: InvoiceRecordType,
    franchiseCountryCode: string | null,
    invoiceDate: string,
  ): Promise<void> {
    const functional = franchiseCountryCode === 'IN' ? 'INR' : franchiseCountryCode === 'AE' ? 'AED' : null;
    const currency = (record.currency || '').toUpperCase();
    if (!functional || !currency || currency === functional) {
      return;
    }
    record.functionalCurrency = functional;
    try {
      const rate = await this.exchangeRateService.findRate(currency, functional, invoiceDate, recordType === 'product' ? 'GOODS' : 'SERVICES');
      if (rate) {
        this.setFx(record, rate);
      } else {
        this.logger.warn(`No ${currency}→${functional} rate for ${invoiceDate}; invoice ${record.invoiceId} is FX pending`);
      }
    } catch (error) {
      this.logger.error(`Exchange rate lookup failed for invoice ${record.invoiceId}; FX pending`, error as Error);
    }
  }

  /** Fills the FX of invoices issued while no rate was available. Returns how many were filled. */
  public async backfillPendingFx(limit = 200): Promise<number> {
    const pending = { invoiceId: { [Op.ne]: null }, functionalCurrency: { [Op.ne]: null }, fxRate: null };
    let filled = 0;
    // Newest first, so invoices whose pair is never published can't starve recent ones
    const plans = await TxnMemberPayment.findAll({ where: pending, limit, order: [['memberPaymentId', 'DESC']] });
    const products = await TxnMemberProduct.findAll({ where: pending, limit, order: [['memberProductId', 'DESC']] });
    const rows: Array<[TxnMemberPayment | TxnMemberProduct, InvoiceRecordType]> = [
      ...plans.map((row): [TxnMemberPayment, InvoiceRecordType] => [row, 'plan']),
      ...products.map((row): [TxnMemberProduct, InvoiceRecordType] => [row, 'product']),
    ];
    for (const [row, recordType] of rows) {
      const onDate = row.invoiceDate || FranchiseDateUtil.localDate(new Date(row.paymentDate || new Date()));
      const rate = await this.exchangeRateService.findRate(
        (row.currency || '').toUpperCase(),
        row.functionalCurrency as string,
        onDate,
        recordType === 'product' ? 'GOODS' : 'SERVICES',
      );
      if (rate) {
        this.setFx(row, rate);
        await row.save({ fields: ['fxRate', 'fxRateDate', 'fxSource', 'functionalTotalAmount', 'functionalTaxAmount'] });
        filled += 1;
      }
    }
    return filled;
  }

  private setFx(record: TxnMemberPayment | TxnMemberProduct, rate: IResolvedRate): void {
    const round2 = (n: number): number => Math.round(n * 100) / 100;
    record.fxRate = rate.rate;
    record.fxRateDate = rate.rateDate;
    record.fxSource = rate.source;
    record.functionalTotalAmount = round2(Number(record.totalAmount || 0) * rate.rate);
    record.functionalTaxAmount = round2(Number(record.taxAmount || 0) * rate.rate);
  }

  /** Series for a record from its stored billing snapshot and the tax it was charged. */
  public async resolveSeries(
    record: Pick<TxnMemberPayment | TxnMemberProduct, 'memberAddress' | 'taxAmount'> & { taxModes?: Array<string | null | undefined> },
    franchiseCountryCode: string | null,
  ): Promise<InvoiceSeriesEnum> {
    const billingCountryCode = await this.billingCountryCode(record.memberAddress);
    if (!billingCountryCode) {
      this.logger.warn('Billing country unknown on invoiced record; using the domestic series');
    }
    return InvoiceSeriesUtil.resolve({
      franchiseCountryCode,
      billingCountryCode,
      taxAmount: record.taxAmount,
      taxModes: record.taxModes,
    });
  }

  /** Tax modes of a product order's lines, read in the issuing transaction. */
  private async productLineModes(memberProductId: number, transaction: Transaction): Promise<string[]> {
    if (!memberProductId) {
      return [];
    }
    const lines = await TxnMemberProductOrderItem.findAll({
      attributes: ['taxMode'],
      where: { memberProductId },
      transaction,
    });
    return lines.map((line) => line.taxMode);
  }

  /** Code from the snapshot, else its country id, else its country name (decision 13). */
  public async billingCountryCode(
    snapshot: Parameters<typeof InvoiceSeriesUtil.snapshotCountry>[0],
  ): Promise<string | null> {
    const found = InvoiceSeriesUtil.snapshotCountry(snapshot);
    if (found.countryCode) {
      return found.countryCode;
    }
    if (found.countryId) {
      const byId = await this.countryCodeById(found.countryId);
      if (byId) {
        return byId;
      }
    }
    if (found.country) {
      const name = found.country.toLowerCase();
      const countries = await this.countryService.findAll({ page: 0, limit: 1000 });
      const match = countries.tableData.find((c) => (c.country || '').trim().toLowerCase() === name);
      return InvoiceSeriesUtil.normalize(match?.countryCode);
    }
    return null;
  }

  private async countryCodeById(countryId: number): Promise<string | null> {
    try {
      const country = await this.countryService.fetchById(countryId);
      return InvoiceSeriesUtil.normalize(country?.countryCode);
    } catch {
      return null;
    }
  }
}
