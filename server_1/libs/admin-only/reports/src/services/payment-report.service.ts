import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Includeable, IncludeOptions, Op, Order, Sequelize, WhereOptions } from 'sequelize';
import { MemberPlanService, TxnMember, TxnMemberPayment } from '@server_1/modules/member';
import {
  BusinessTypeEnum,
  IAuthUser,
  IBasicSearch,
  IDropdownItem,
  IPaymentReportContext,
  IPaymentReportCurrencyTotal,
  IPaymentReportFilter,
  IPaymentReportItem,
  IPaymentReportResult,
  IPaymentReportTotals,
  TaxMode,
  TaxTypeEnum,
} from '@eatfit247-shared-lib';
import { MstFranchise, SearchUtil, TableListSortUtil } from '@server_1/core';
import { CountryService } from '@server_1/platform';
import { FinancialYearService } from './financial-year.service';
import archiver from 'archiver';
import moment from 'moment/moment';
import * as ExcelJS from 'exceljs';

/** Columns on txn_member_payments that can be sorted directly in SQL. */
const SORTABLE_COLUMNS: ReadonlySet<string> = new Set([
  'paymentDate',
  'totalAmount',
  'orderAmount',
  'taxAmount',
  'invoiceId',
  'currency',
  'taxType',
  'taxMode',
]);

/**
 * The member's display name as SQL, matching what the API returns.
 *
 * COALESCE is required because last_name is nullable and `a || NULL` is NULL in SQL,
 * which would drop those members from name searches and sort them to the end.
 * BTRIM matches the trimmed name the UI shows — ~3% of member rows carry stray
 * leading/trailing spaces, which would otherwise sort ahead of every letter.
 */
const MEMBER_FULL_NAME_SQL =
  `BTRIM(COALESCE("member"."first_name", '') || ' ' || COALESCE("member"."last_name", ''))`;

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 500;
/** Each invoice spawns a Puppeteer render, so the ZIP export needs a hard ceiling. */
const MAX_ZIP_EXPORT_ROWS = 500;

@Injectable()
export class PaymentReportService {
  private readonly logger = new Logger(PaymentReportService.name);

  constructor(
    @InjectModel(TxnMemberPayment)
    private readonly memberPaymentRepository: typeof TxnMemberPayment,
    @InjectModel(TxnMember)
    private readonly memberRepository: typeof TxnMember,
    private readonly memberPaymentService: MemberPlanService,
    private readonly financialYearService: FinancialYearService,
    private readonly countryService: CountryService,
  ) {}

  /**
   * Bootstrap for the report filter bar: the FY calendar of the resolved franchise,
   * the franchises this admin may query, and the country list.
   *
   * Deliberately served under the Report ability rather than reusing the annual
   * dashboard's context endpoint, which requires the Dashboard ability.
   */
  async getContext(user: IAuthUser, franchiseId?: number): Promise<IPaymentReportContext> {
    const [fyContext, franchises, countries] = await Promise.all([
      this.financialYearService.getFranchiseContext(user, franchiseId),
      this.financialYearService.getAccessibleFranchises(user),
      this.countryService.getCountryList(),
    ]);

    return {
      franchiseId: fyContext.franchiseId,
      companyName: fyContext.companyName,
      fyStartMonth: fyContext.fyStartMonth,
      availableYears: fyContext.availableYears,
      franchises: franchises.map<IDropdownItem>((f) => ({ id: f.franchiseId, label: f.companyName })),
      countries,
    };
  }

  /**
   * Paged payment report plus totals across the entire filtered set.
   */
  async getPaymentReport(filter: IPaymentReportFilter, user: IAuthUser): Promise<IPaymentReportResult> {
    const { where, include } = this.buildQuery(filter, user);

    const pageNumber = Math.max(0, Math.floor(Number(filter.page) || 0));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(filter.limit) || DEFAULT_PAGE_SIZE)));

    const [rows, totals] = await Promise.all([
      this.memberPaymentRepository.findAll({
        where,
        include,
        order: this.buildOrder(filter),
        limit: pageSize,
        offset: pageNumber * pageSize,
        // Required: with `limit` and includes Sequelize otherwise wraps the base
        // table in a subquery and applies ORDER BY on the outer query, which
        // returns the wrong page whenever sorting by a joined column.
        subQuery: false,
        raw: true,
        nest: true,
      }),
      this.loadTotals(where, include),
    ]);

    return {
      tableData: this.toReportItems(rows),
      count: totals.recordCount,
      totals,
    };
  }

  /**
   * Export the filtered payments as a zip of invoice PDFs.
   */
  async exportPaymentReports(filter: IPaymentReportFilter, user: IAuthUser): Promise<archiver.Archiver> {
    const { where, include } = this.buildQuery(filter, user);

    const payments = await this.memberPaymentRepository.findAll({
      where,
      include,
      order: [
        ['paymentDate', 'DESC'],
        ['memberPaymentId', 'DESC'],
      ],
      // One Puppeteer render per invoice — refuse rather than melt the box.
      limit: MAX_ZIP_EXPORT_ROWS + 1,
      subQuery: false,
      raw: true,
      nest: true,
    });

    if (payments.length > MAX_ZIP_EXPORT_ROWS) {
      throw new BadRequestException(
        `This filter matches more than ${MAX_ZIP_EXPORT_ROWS} invoices. Narrow the date range or filters, or use the Excel export.`,
      );
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    // Generate invoices in small batches to avoid Puppeteer OOM.
    const BATCH_SIZE = 3;
    for (let i = 0; i < payments.length; i += BATCH_SIZE) {
      const batch = payments.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item) => {
          try {
            const payment = this.memberPaymentService.toPaymentModel(item);
            const memberId = payment.memberId;
            const paymentId = payment.memberPaymentId;

            const invoiceFile = await this.memberPaymentService.generateInvoicePDF(memberId, paymentId);
            const pdfBuffer = Buffer.from(invoiceFile.buffer, 'base64');

            const memberName = `${payment.memberName || 'Member'}_${memberId}`.replace(/[^a-zA-Z0-9_]/g, '_');
            archive.append(pdfBuffer, { name: `Invoice_${memberName}_${paymentId}.pdf` });
          } catch (error) {
            this.logger.error(`Failed to generate invoice for payment ${item.memberPaymentId}`, { error });
            // Continue with the remaining invoices.
          }
        }),
      );
    }

    await archive.finalize();
    return archive;
  }

  /**
   * Export the filtered payments as an Excel workbook.
   */
  async exportPaymentReportExcel(filter: IPaymentReportFilter, user: IAuthUser): Promise<Buffer> {
    const { where, include } = this.buildQuery(filter, user);

    const payments = await this.memberPaymentRepository.findAll({
      where,
      include,
      order: [
        ['paymentDate', 'ASC'],
        ['memberPaymentId', 'ASC'],
      ],
      subQuery: false,
      raw: true,
      nest: true,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payment Report');

    sheet.columns = [
      { header: 'Invoice ID', key: 'invoiceId', width: 20 },
      { header: 'Payment Date', key: 'paymentDate', width: 15 },
      { header: 'First Name', key: 'firstName', width: 18 },
      { header: 'Last Name', key: 'lastName', width: 18 },
      { header: 'Company Name', key: 'companyName', width: 25 },
      { header: 'Order Amount', key: 'orderAmount', width: 15 },
      { header: 'Tax Amount', key: 'taxAmount', width: 15 },
      { header: 'Tax %', key: 'taxPercentage', width: 10 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'CGST', key: 'cgst', width: 12 },
      { header: 'SGST', key: 'sgst', width: 12 },
      { header: 'IGST', key: 'igst', width: 12 },
      { header: 'Tax Type', key: 'taxType', width: 14 },
      { header: 'Tax Mode', key: 'taxMode', width: 22 },
      { header: 'Payment Mode', key: 'paymentMode', width: 18 },
      { header: 'State', key: 'state', width: 20 },
      { header: 'Billing Country', key: 'billingCountry', width: 18 },
      { header: 'Member Country', key: 'memberCountry', width: 18 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };

    for (const item of payments) {
      const payment = this.memberPaymentService.toPaymentModel(item);
      const taxObj = payment.taxObj || {};
      const billingAddress = payment.memberAddress?.billingAddress;

      sheet.addRow({
        invoiceId: payment.invoiceId || '',
        paymentDate: payment.paymentDate ? moment(payment.paymentDate).format('YYYY-MM-DD') : '',
        firstName: item.member?.firstName || '',
        lastName: item.member?.lastName || '',
        companyName: item.member?.franchise?.companyName || '',
        orderAmount: payment.orderAmount || 0,
        taxAmount: payment.taxAmount || 0,
        taxPercentage: payment.taxPercentage || 0,
        totalAmount: payment.totalAmount || 0,
        currency: payment.currency || '',
        cgst: taxObj.CGST?.amount != null ? Number(taxObj.CGST.amount) : 0,
        sgst: taxObj.SGST?.amount != null ? Number(taxObj.SGST.amount) : 0,
        igst: taxObj.IGST?.amount != null ? Number(taxObj.IGST.amount) : 0,
        taxType: payment.taxType || '',
        taxMode: payment.taxMode || '',
        paymentMode: payment.paymentMode || '',
        state: billingAddress?.state || '',
        billingCountry: item.billingAddress?.country?.country || billingAddress?.country || '',
        memberCountry: item.member?.country?.country || '',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ---- query construction ----

  /**
   * Single source of truth for the report's WHERE/INCLUDE, shared by the grid and
   * both exports so they can never diverge.
   */
  private buildQuery(
    filter: IPaymentReportFilter,
    user: IAuthUser,
  ): { where: WhereOptions; include: Includeable[] } {
    const start = moment(filter.startDate, 'YYYY-MM-DD', true).startOf('day');
    const end = moment(filter.endDate, 'YYYY-MM-DD', true).endOf('day');
    if (!start.isValid() || !end.isValid()) {
      throw new BadRequestException('Invalid report date range.');
    }
    if (start.isAfter(end)) {
      throw new BadRequestException('Start date must be on or before the end date.');
    }

    const where: Record<string | symbol, unknown> = {
      active: true,
      paymentDate: SearchUtil.filterDateRange(start.toDate(), end.toDate()),
    };

    const amountRange = this.buildAmountRange(filter);
    if (amountRange) {
      where['totalAmount'] = amountRange;
    }

    const and: WhereOptions[] = [];
    this.applyTaxFilters(filter, and);
    if (and.length > 0) {
      where[Op.and] = and;
    }

    const include: Includeable[] = [
      {
        model: TxnMember,
        as: 'member',
        required: true,
        where: this.buildMemberWhere(filter, user),
        attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber', 'franchiseId', 'countryId'],
        include: [
          // Resolves the member's country name so the grid can show what the
          // country filter actually matched on.
          { association: 'country', required: false, attributes: ['countryId', 'country'] },
          {
            model: MstFranchise,
            as: 'franchise',
            required: true,
            attributes: ['franchiseId', 'companyName'],
            where: {
              active: true,
              [Op.and]: [
                // business_type is a Postgres enum array; qualify the column because
                // subQuery:false puts several tables in scope.
                Sequelize.literal(
                  `'${BusinessTypeEnum.SERVICE}'::public.business_type = ANY("member->franchise"."business_type")`,
                ),
              ],
            },
          },
        ],
      },
      // Display-only associations, referenced by alias so this service does not
      // need to import every master model. All are belongsTo (1:1), which is what
      // makes `subQuery: false` + `limit` safe — a hasMany would duplicate rows.
      { association: 'paymentMode', required: false, attributes: ['paymentModeId', 'paymentMode'] },
      { association: 'paymentStatus', required: false, attributes: ['paymentStatusId', 'paymentStatus'] },
      { association: 'programPlan', required: false, attributes: ['programPlanId', 'plan'] },
      { association: 'program', required: false, attributes: ['programId', 'program'] },
      this.buildBillingAddressInclude(filter),
    ];

    return { where: where as WhereOptions, include };
  }

  private buildAmountRange(filter: IPaymentReportFilter): Record<symbol, number> | null {
    const hasMin = filter.minTotalAmount !== undefined && filter.minTotalAmount !== null;
    const hasMax = filter.maxTotalAmount !== undefined && filter.maxTotalAmount !== null;
    if (hasMin && hasMax && filter.minTotalAmount > filter.maxTotalAmount) {
      throw new BadRequestException('Minimum total amount cannot be greater than the maximum.');
    }

    const range: Record<symbol, number> = {};
    if (hasMin) {
      range[Op.gte] = filter.minTotalAmount;
    }
    if (hasMax) {
      range[Op.lte] = filter.maxTotalAmount;
    }
    return Object.getOwnPropertySymbols(range).length > 0 ? range : null;
  }

  /**
   * tax_type and tax_mode are nullable — rows written before the tax engine existed
   * hold NULL rather than NONE/NO_TAX, so a plain IN would silently drop them.
   */
  private applyTaxFilters(filter: IPaymentReportFilter, and: WhereOptions[]): void {
    if (filter.taxTypes && filter.taxTypes.length > 0) {
      const or: WhereOptions[] = [{ taxType: { [Op.in]: filter.taxTypes } }];
      if (filter.taxTypes.includes(TaxTypeEnum.NONE)) {
        or.push({ taxType: { [Op.is]: null } });
      }
      and.push({ [Op.or]: or });
    }

    if (filter.taxModes && filter.taxModes.length > 0) {
      const or: WhereOptions[] = [{ taxMode: { [Op.in]: filter.taxModes } }];
      if (filter.taxModes.includes(TaxMode.NO_TAX)) {
        or.push({ taxMode: { [Op.is]: null } });
      }
      and.push({ [Op.or]: or });
    }

    // is_tax_applicable is NOT NULL, so no null handling needed.
    if (filter.isTaxApplicable !== undefined && filter.isTaxApplicable !== null) {
      and.push({ isTaxApplicable: filter.isTaxApplicable });
    }
  }

  /** Franchise scope, member free-text search, and the member-side country filter. */
  private buildMemberWhere(filter: IPaymentReportFilter, user: IAuthUser): WhereOptions {
    // Throws if a franchise-scoped admin requests a franchise they do not own,
    // so a forged request body cannot widen access.
    const memberWhere: Record<string | symbol, unknown> = {
      ...this.financialYearService.buildFranchiseScopeWhere(filter.franchiseId, user),
    };

    const and: WhereOptions[] = [];

    if (filter.memberSearch) {
      const escaped = filter.memberSearch.replace(/[%_\\]/g, '\\$&');
      const term = `%${escaped}%`;
      const quotedTerm = this.memberPaymentRepository.sequelize.escape(term);
      and.push({
        [Op.or]: [
          { emailId: { [Op.iLike]: term } },
          { contactNumber: { [Op.iLike]: term } },
          // Concatenated so a full "First Last" query matches; per-column iLike would not.
          Sequelize.literal(`${MEMBER_FULL_NAME_SQL} ILIKE ${quotedTerm}`),
        ],
      });
    }

    const source = filter.countrySource ?? 'member';
    if (source === 'member' && filter.countryIds && filter.countryIds.length > 0) {
      if ((filter.countryMode ?? 'in') === 'in') {
        and.push({ countryId: { [Op.in]: filter.countryIds } });
      } else {
        // `country_id NOT IN (...)` evaluates to UNKNOWN for NULL, which would drop
        // members with no country from a "not in India" report.
        and.push({
          [Op.or]: [{ countryId: { [Op.notIn]: filter.countryIds } }, { countryId: { [Op.is]: null } }],
        });
      }
    }

    if (and.length > 0) {
      memberWhere[Op.and] = and;
    }
    return memberWhere as WhereOptions;
  }

  /**
   * Billing address join. Doubles as the country filter when countrySource is 'billing'.
   *
   * Filters on txn_addresses.country_id rather than the jurisdiction JSONB: that column
   * stores a country *display name* and is written as '' by the tax engine's no-tax path,
   * so it is empty for every zero-tax and legacy payment.
   */
  private buildBillingAddressInclude(filter: IPaymentReportFilter): Includeable {
    const base: IncludeOptions = {
      association: 'billingAddress',
      required: false,
      attributes: ['addressId', 'postalAddress', 'cityVillage', 'pinCode', 'countryId'],
      include: [{ association: 'country', required: false, attributes: ['countryId', 'country'] }],
    };

    const source = filter.countrySource ?? 'member';
    if (source !== 'billing' || !filter.countryIds || filter.countryIds.length === 0) {
      return base;
    }

    if ((filter.countryMode ?? 'in') === 'in') {
      // INNER JOIN: payments with no billing address cannot match a country.
      return { ...base, required: true, where: { countryId: { [Op.in]: filter.countryIds } } };
    }

    // A `where` on a required:false include lands in the LEFT JOIN's ON clause, so
    // payments with no billing address are kept — which is what "not in X" should do.
    return {
      ...base,
      required: false,
      where: {
        [Op.or]: [{ countryId: { [Op.notIn]: filter.countryIds } }, { countryId: { [Op.is]: null } }],
      },
    };
  }

  /**
   * DB-level ordering. Association columns need the model-tuple form, which the
   * allowlist helper cannot express, so those two are handled explicitly.
   *
   * Every branch appends a primary-key tiebreaker: payment_date alone is not unique,
   * so without it rows shift between pages.
   */
  private buildOrder(filter: IPaymentReportFilter): Order {
    const sortInput = {
      page: 0,
      limit: 0,
      sortBy: filter.sortBy,
      sortOrder: filter.sortOrder,
    } as IBasicSearch;

    const field = TableListSortUtil.resolveField(sortInput);
    const direction = TableListSortUtil.resolveDirection(sortInput);
    const tiebreaker: Order = [['memberPaymentId', 'DESC']];

    if (field === 'memberName') {
      // Order by the same expression the API returns, so the grid matches the header.
      return [
        [Sequelize.literal(`${MEMBER_FULL_NAME_SQL} ${direction}`)],
        ...(tiebreaker as unknown[]),
      ] as Order;
    }

    if (field === 'franchiseName') {
      return [
        [
          { model: TxnMember, as: 'member' },
          { model: MstFranchise, as: 'franchise' },
          'companyName',
          direction,
        ],
        ...(tiebreaker as unknown[]),
      ] as Order;
    }

    const base = TableListSortUtil.orderFromAllowlist(sortInput, SORTABLE_COLUMNS, [['paymentDate', 'DESC']]);
    return [...(base as unknown[]), ...(tiebreaker as unknown[])] as Order;
  }

  /**
   * Count and per-currency sums over the whole filtered set.
   *
   * A dedicated aggregate rather than findAndCountAll: it returns the count and the
   * sums in one round trip, and reuses the exact same where/include as the page query
   * so the summary can never disagree with the grid.
   *
   * Amounts are grouped by currency because payments are stored in INR/USD/AED and a
   * cross-currency SUM would be meaningless.
   */
  private async loadTotals(where: WhereOptions, include: Includeable[]): Promise<IPaymentReportTotals> {
    // Sequelize aliases the root table by its model name, which in this codebase is
    // the snake_case table name — qualifying with the class name yields
    // "missing FROM-clause entry".
    const root = this.memberPaymentRepository.name;

    const rows = await this.memberPaymentRepository.findAll({
      attributes: [
        'currency',
        [Sequelize.fn('COUNT', Sequelize.col(`${root}.member_payment_id`)), 'recordCount'],
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col(`${root}.order_amount`)), 0), 'orderAmount'],
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col(`${root}.tax_amount`)), 0), 'taxAmount'],
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col(`${root}.total_amount`)), 0), 'totalAmount'],
      ],
      where,
      // Joins are needed for the filters but must not contribute columns.
      include: this.stripIncludeAttributes(include),
      group: [Sequelize.col(`${root}.currency`)],
      raw: true,
      subQuery: false,
    });

    const byCurrency = (
      rows as unknown as Array<{
        currency: string | null;
        recordCount: string | number;
        orderAmount: string | number;
        taxAmount: string | number;
        totalAmount: string | number;
      }>
    ).map<IPaymentReportCurrencyTotal>((r) => ({
      currency: r.currency ?? '',
      recordCount: Number(r.recordCount) || 0,
      // DECIMAL columns come back from node-postgres as strings.
      orderAmount: Number(r.orderAmount) || 0,
      taxAmount: Number(r.taxAmount) || 0,
      totalAmount: Number(r.totalAmount) || 0,
    }));

    return {
      recordCount: byCurrency.reduce((sum, c) => sum + c.recordCount, 0),
      byCurrency,
    };
  }

  /** Recursively blank out `attributes` so filter-only joins select no columns. */
  private stripIncludeAttributes(include: Includeable[]): Includeable[] {
    return include.map((entry) => {
      const options = entry as IncludeOptions;
      return {
        ...options,
        attributes: [],
        ...(options.include ? { include: this.stripIncludeAttributes(options.include) } : {}),
      };
    });
  }

  private toReportItems(rows: TxnMemberPayment[]): IPaymentReportItem[] {
    return rows.map((item) => ({
      ...this.memberPaymentService.toPaymentModel(item),
      franchiseName: item.member?.franchise?.companyName || 'N/A',
      memberCountry: item.member?.country?.country || '',
      // Falls back to the denormalised address snapshot for payments recorded
      // before billing_address_id was populated.
      billingCountry:
        item.billingAddress?.country?.country || item.memberAddress?.billingAddress?.country || '',
    }));
  }
}
