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
import { TxnMemberPayment } from '../models/txn-member-payment.model';
import { TxnMemberProduct } from '../models/txn-member-product.model';

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
  ) {}

  /** Franchise, its country (from its address) and timezone. */
  public async franchiseContext(franchiseId: number): Promise<IInvoiceFranchiseContext> {
    const franchise = await this.franchiseService.fetchById(franchiseId);
    const addresses = await this.addressService.filterByTableIdAndPk(TableEnum.MST_FRANCHISES, franchiseId);
    const countryId = addresses?.[0]?.countryId;
    const countryCode = countryId ? await this.countryCodeById(countryId) : null;
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
    const series = await this.resolveSeries(record, franchiseContext.countryCode);
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
    return issued;
  }

  /** Series for a record from its stored billing snapshot and the tax it was charged. */
  public async resolveSeries(
    record: Pick<TxnMemberPayment | TxnMemberProduct, 'memberAddress' | 'taxAmount'>,
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
    });
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
