import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MongoAbility, subject } from '@casl/ability';
import { Op, QueryTypes, Transaction, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  BusinessTypeEnum,
  ConfigParam,
  IAuthUser,
  ICalculateTaxResponse,
  IFranchise,
  IManageWorkshopInvoice,
  ITableList,
  IWorkshopInvoice,
  IWorkshopInvoiceAddress,
  IWorkshopInvoiceMasterData,
  IWorkshopInvoiceSearch,
  IWorkshopInvoiceTaxRequest,
  mapWorkshopInvoiceToInvoiceDocument,
  PaymentSourceEnum,
  PaymentStatusEnum,
  TableEnum,
  TaxMode,
  TaxTypeEnum,
  TransactionType,
  WORKSHOP_INVOICE_LOCKED_FIELDS,
  WorkshopInvoiceLockedField,
} from '@eatfit247-shared-lib';
import {
  AppConfigService,
  CaslAbilityFactory,
  CommonFunctionsUtil,
  PaymentValidationUtil,
} from '@server_1/core';
import {
  AddressService,
  CountryService,
  CurrencyService,
  IFileModel,
  InvoicePdfService,
  InvoiceSequenceService,
  PaymentModeService,
  PaymentStatusService,
  StateService,
} from '@server_1/platform';
import { TaxEngineService, TaxResult } from '@server_1/modules/tax-engine';
import { FranchiseService } from '@server_1/modules/franchise';
import { TxnWorkshopInvoice } from '../models';

const INDIA_COUNTRY_CODE = 'IN';
const DEFAULT_BUSINESS_TIMEZONE = 'Asia/Kolkata';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const LOCKED_FIELD_LABELS: Record<WorkshopInvoiceLockedField, string> = {
  franchiseId: 'franchise',
  quantity: 'quantity',
  unitRate: 'unit rate',
  description: 'description',
  currency: 'currency',
  billToCountryId: 'bill-to country',
  billToStateId: 'bill-to State',
  placeOfSupplyStateId: 'place of supply',
  invoiceDate: 'invoice date',
  supplyDate: 'date of supply',
};

/** Rounds to 2 decimals (paise/cents), away from binary-float artefacts. */
const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

interface IWorkshopInvoiceDraft {
  tax: ICalculateTaxResponse;
  placeOfSupplyStateId: number;
  billToAddress: IWorkshopInvoiceAddress;
}

@Injectable()
export class WorkshopInvoiceService {
  constructor(
    @InjectModel(TxnWorkshopInvoice)
    private readonly workshopInvoiceRepository: typeof TxnWorkshopInvoice,
    private readonly sequelize: Sequelize,
    private readonly appConfigService: AppConfigService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly taxEngineService: TaxEngineService,
    private readonly invoiceSequenceService: InvoiceSequenceService,
    private readonly addressService: AddressService,
    private readonly countryService: CountryService,
    private readonly stateService: StateService,
    private readonly currencyService: CurrencyService,
    private readonly paymentModeService: PaymentModeService,
    private readonly paymentStatusService: PaymentStatusService,
    private readonly franchiseService: FranchiseService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  /**
   * Dropdowns for the workshop invoice form. Franchises are limited to the admin's own.
   */
  public async loadMasterData(user: IAuthUser): Promise<IWorkshopInvoiceMasterData> {
    const [franchises, paymentStatus, paymentMode, country, currencies] = await Promise.all([
      this.franchiseService.getFranchiseList(),
      this.paymentStatusService.getDropdownList(),
      this.paymentModeService.getDropdownList(),
      this.countryService.getCountryList(),
      this.currencyService.getAllCurrencies(),
    ]);
    return {
      franchise: franchises.filter((f) => this.isFranchiseVisible(user, Number(f.id))),
      paymentStatus,
      paymentMode,
      country,
      currency: currencies.map((c) => ({ id: c.currencyCode, label: c.currencyCode })),
    };
  }

  /**
   * Live tax preview: quantity × rate through the tax engine, nothing stored.
   */
  public async calculateTax(
    payload: IWorkshopInvoiceTaxRequest,
    user: IAuthUser,
  ): Promise<ICalculateTaxResponse> {
    this.assertFranchiseAccess(user, AdminActionEnum.Read, payload.franchiseId);
    const draft = await this.buildTaxDraft(payload);
    return draft.tax;
  }

  public async findAll(
    search: IWorkshopInvoiceSearch,
    user: IAuthUser,
  ): Promise<ITableList<IWorkshopInvoice>> {
    const where: Record<string | symbol, unknown> = {};
    const franchiseIds = this.scopedFranchiseIds(user, search.franchiseId);
    if (franchiseIds) {
      where['franchiseId'] = { [Op.in]: franchiseIds };
    }
    if (search.paymentStatusId) {
      where['paymentStatusId'] = search.paymentStatusId;
    }
    if (search.includeCancelled === false) {
      where['active'] = true;
    }
    if (search.invoiceDateFrom || search.invoiceDateTo) {
      const range: Record<symbol, string> = {};
      if (search.invoiceDateFrom) range[Op.gte] = search.invoiceDateFrom;
      if (search.invoiceDateTo) range[Op.lte] = search.invoiceDateTo;
      where['invoiceDate'] = range;
    }
    const term = search.search?.trim();
    if (term) {
      const like = `%${term}%`;
      where[Op.or] = [
        { billToName: { [Op.iLike]: like } },
        { invoiceId: { [Op.iLike]: like } },
        { description: { [Op.iLike]: like } },
      ];
    }
    const { rows, count } = await this.workshopInvoiceRepository.scope('list').findAndCountAll({
      where: where as WhereOptions<TxnWorkshopInvoice>,
      limit: search.limit,
      offset: search.page * search.limit,
      order: [
        ['invoiceDate', 'DESC'],
        ['workshopInvoiceId', 'DESC'],
      ],
      distinct: true,
    });
    return {
      tableData: rows.map((row) => this.convertToModel(row)),
      count,
    } as ITableList<IWorkshopInvoice>;
  }

  /**
   * One workshop invoice, cancelled ones included (they stay viewable with their number).
   */
  public async findById(id: number, user: IAuthUser): Promise<IWorkshopInvoice> {
    const row = await this.workshopInvoiceRepository.scope('details').findByPk(id);
    if (!row) {
      throw new NotFoundException('Workshop invoice not found');
    }
    this.assertFranchiseAccess(user, AdminActionEnum.Read, row.franchiseId);
    return this.convertToModel(row);
  }

  public async create(
    obj: IManageWorkshopInvoice,
    user: IAuthUser,
    requestedIp: string,
  ): Promise<IWorkshopInvoice> {
    this.assertFranchiseAccess(user, AdminActionEnum.Create, obj.franchiseId);
    const franchise = await this.franchiseService.fetchById(obj.franchiseId);
    this.validateInvoiceDate(obj.invoiceDate, franchise.financialYear);
    this.validatePayment(obj);
    const draft = await this.buildDraft(obj);
    const willIssue = obj.paymentStatusId === PaymentStatusEnum.PAID;
    if (willIssue) {
      await this.confirmBackdate(obj, franchise);
    }

    const t = await this.sequelize.transaction();
    try {
      const row = await this.workshopInvoiceRepository.create(
        {
          ...this.toRowValues(obj, draft),
          active: true,
          createdBy: user.adminId,
          modifiedBy: user.adminId,
          createdIp: requestedIp,
          modifiedIp: requestedIp,
        } as TxnWorkshopInvoice,
        { transaction: t },
      );
      if (willIssue) {
        await this.issueInvoiceNumber(row, franchise, t);
      }
      await t.commit();
      return this.findById(row.workshopInvoiceId, user);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  public async update(
    id: number,
    obj: IManageWorkshopInvoice,
    user: IAuthUser,
    requestedIp: string,
  ): Promise<IWorkshopInvoice> {
    const existing = await this.findActiveRow(id, user, AdminActionEnum.Update);
    this.validatePayment(obj);
    const issued = !!existing.invoiceId;
    let draft: IWorkshopInvoiceDraft | null = null;
    let franchise: IFranchise | null = null;

    if (issued) {
      const changed = this.lockedFieldChanges(existing, obj);
      if (changed.length > 0) {
        throw new BadRequestException(
          `Invoice ${existing.invoiceId} is issued, so these can't change: ${changed
            .map((f) => LOCKED_FIELD_LABELS[f])
            .join(', ')}`,
        );
      }
    } else {
      if (obj.franchiseId !== existing.franchiseId) {
        this.assertFranchiseAccess(user, AdminActionEnum.Update, obj.franchiseId);
      }
      franchise = await this.franchiseService.fetchById(obj.franchiseId);
      this.validateInvoiceDate(obj.invoiceDate, franchise.financialYear);
      draft = await this.buildDraft(obj);
    }
    const willIssue = !issued && obj.paymentStatusId === PaymentStatusEnum.PAID;
    if (willIssue && franchise) {
      await this.confirmBackdate(obj, franchise);
    }

    const t = await this.sequelize.transaction();
    try {
      // Re-read under a row lock: two saves can't both issue a number for one invoice.
      const row = await this.workshopInvoiceRepository.findOne({
        where: { workshopInvoiceId: id, active: true },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!row || (row.invoiceId ?? null) !== (existing.invoiceId ?? null)) {
        throw new ConflictException('This invoice changed while you were editing it. Reload and try again.');
      }
      if (draft) {
        row.set(this.toRowValues(obj, draft));
      } else {
        row.set(this.editableAfterIssueValues(row, obj));
      }
      row.modifiedBy = user.adminId;
      row.modifiedIp = requestedIp;
      await row.save({ transaction: t });
      if (willIssue && franchise) {
        await this.issueInvoiceNumber(row, franchise, t);
      }
      await t.commit();
      return this.findById(id, user);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Cancel = soft delete. The invoice number (if any) stays issued (decision 8).
   */
  public async cancel(
    id: number,
    cancelReason: string,
    user: IAuthUser,
    requestedIp: string,
  ): Promise<IWorkshopInvoice> {
    const row = await this.findActiveRow(id, user, AdminActionEnum.Delete);
    const reason = cancelReason?.trim();
    if (!reason) {
      throw new BadRequestException('A cancel reason is required');
    }
    row.active = false;
    row.cancelReason = reason;
    row.modifiedBy = user.adminId;
    row.modifiedIp = requestedIp;
    await row.save();
    return this.findById(id, user);
  }

  /**
   * The invoice PDF, rendered from stored values on each request and returned as base64.
   * Nothing is written to disk (decision 11). Only an issued invoice has a PDF (decision 7).
   */
  public async generateInvoicePdf(id: number, user: IAuthUser): Promise<IFileModel> {
    const invoice = await this.findById(id, user);
    if (!invoice.invoiceId) {
      throw new BadRequestException('No invoice number yet: the PDF is available once the invoice is marked Paid');
    }
    const [franchise, franchiseAddress] = await Promise.all([
      this.franchiseService.fetchById(invoice.franchiseId),
      this.addressService.findByTableIdAndPk(TableEnum.MST_FRANCHISES, invoice.franchiseId),
    ]);
    if (!franchiseAddress) {
      throw new BadRequestException('The franchise has no address');
    }
    const invoiceDoc = mapWorkshopInvoiceToInvoiceDocument(invoice, franchise, franchiseAddress, [
      'Diet consulting services are advisory in nature and not medical treatment.',
      'All payments are non-refundable and non-transferable under any circumstances.',
      `Payment confirms acceptance of ${franchise.companyName} terms and service validity conditions.`,
    ]);
    const pdfBuffer = await this.invoicePdfService.generateInvoicePdf(invoiceDoc);
    const fileName = `Invoice-${CommonFunctionsUtil.removeSpecialChar(invoice.invoiceId, '-', false)}-${
      CommonFunctionsUtil.removeSpecialChar(invoice.billToName, '-', false) || 'Workshop'
    }.pdf`;
    return {
      filePath: '',
      fileName,
      buffer: pdfBuffer.toString('base64'),
    };
  }

  // ---------------------------------------------------------------------------
  // Access
  // ---------------------------------------------------------------------------

  /** Empty franchiseIds = unscoped (Super Admin), as everywhere else in admin-api. */
  private isFranchiseVisible(user: IAuthUser, franchiseId: number): boolean {
    return user.franchiseIds.length === 0 || user.franchiseIds.includes(franchiseId);
  }

  /** The franchise filter for a list: null = no filter. */
  private scopedFranchiseIds(user: IAuthUser, requested?: number | null): number[] | null {
    if (user.franchiseIds.length === 0) {
      return requested ? [requested] : null;
    }
    return requested ? user.franchiseIds.filter((f) => f === requested) : user.franchiseIds;
  }

  /**
   * Service-level franchise scoping (another franchise's row is "not found") plus the CASL
   * check with the row's franchiseId (decision 10).
   */
  private assertFranchiseAccess(user: IAuthUser, action: AdminActionEnum, franchiseId: number): void {
    if (!this.isFranchiseVisible(user, franchiseId)) {
      throw new NotFoundException('Workshop invoice not found');
    }
    // AppAbility is typed for string subjects; the franchise condition needs a subject object.
    const ability = this.caslAbilityFactory.createForUser(user) as unknown as MongoAbility;
    if (!ability.can(action, subject(AdminSubjectEnum.WorkshopInvoice, { franchiseId }))) {
      throw new ForbiddenException();
    }
  }

  private async findActiveRow(id: number, user: IAuthUser, action: AdminActionEnum): Promise<TxnWorkshopInvoice> {
    const row = await this.workshopInvoiceRepository.findByPk(id);
    if (!row) {
      throw new NotFoundException('Workshop invoice not found');
    }
    this.assertFranchiseAccess(user, action, row.franchiseId);
    if (!row.active) {
      throw new BadRequestException('This invoice is cancelled and can no longer be changed');
    }
    return row;
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  /** Today as YYYY-MM-DD in the business timezone (CALENDAR_TIMEZONE, default Asia/Kolkata). */
  private today(): string {
    const timeZone =
      this.appConfigService.getString(ConfigParam.CALENDAR_TIMEZONE, false, DEFAULT_BUSINESS_TIMEZONE) ||
      DEFAULT_BUSINESS_TIMEZONE;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  /**
   * Decision 4: no future date, and no date in an earlier FY than today's (those FYs are closed).
   */
  private validateInvoiceDate(invoiceDate: string, fyStartMonth: number): void {
    const today = this.today();
    if (invoiceDate > today) {
      throw new BadRequestException(`Invoice date ${this.formatDate(invoiceDate)} is in the future`);
    }
    const invoiceFy = this.invoiceSequenceService.financialYearFor(invoiceDate, fyStartMonth);
    const currentFy = this.invoiceSequenceService.financialYearFor(today, fyStartMonth);
    if (invoiceFy !== currentFy) {
      throw new BadRequestException(
        `Invoice date ${this.formatDate(invoiceDate)} is in FY ${invoiceFy}. Only dates in the current FY (${currentFy}) are allowed.`,
      );
    }
  }

  /** Same rules as manual member payments (decision 7). */
  private validatePayment(obj: IManageWorkshopInvoice): void {
    PaymentValidationUtil.validateManualPaymentSource({
      paymentSource: PaymentSourceEnum.MANUAL,
      paymentModeId: obj.paymentModeId,
      paymentDate: obj.paymentDate ? new Date(obj.paymentDate) : null,
      paymentStatusId: obj.paymentStatusId,
      transactionId: obj.transactionId,
    });
  }

  /**
   * Decision 4: an invoice date earlier than the latest already issued in the franchise's
   * S series for that FY needs an explicit confirmation. Checked only when a number is about
   * to be issued, because only then does the row join the series.
   */
  private async confirmBackdate(obj: IManageWorkshopInvoice, franchise: IFranchise): Promise<void> {
    if (obj.confirmBackdate) {
      return;
    }
    const fy = this.invoiceSequenceService.financialYearFor(obj.invoiceDate, franchise.financialYear);
    const prefix = `${franchise.franchiseCode}/${fy}/S/`;
    const [result] = await this.sequelize.query<{ latest: string | null }>(
      `SELECT MAX(d)::text AS latest
         FROM (SELECT payment_date AS d
                 FROM txn_member_payments
                WHERE franchise_id = :franchiseId
                  AND LEFT(invoice_id, LENGTH(:prefix)) = :prefix
               UNION ALL
               SELECT invoice_date AS d
                 FROM txn_workshop_invoices
                WHERE franchise_id = :franchiseId
                  AND LEFT(invoice_id, LENGTH(:prefix)) = :prefix) series`,
      {
        replacements: { franchiseId: obj.franchiseId, prefix },
        type: QueryTypes.SELECT,
      },
    );
    const latest = result?.latest ?? null;
    if (latest && obj.invoiceDate < latest) {
      throw new ConflictException(
        `The ${fy} S series already has an invoice dated ${this.formatDate(latest)}, later than ` +
          `${this.formatDate(obj.invoiceDate)}. Confirm to issue this invoice with the earlier date.`,
      );
    }
  }

  private lockedFieldChanges(row: TxnWorkshopInvoice, obj: IManageWorkshopInvoice): WorkshopInvoiceLockedField[] {
    const incoming: Record<WorkshopInvoiceLockedField, string> = {
      franchiseId: String(obj.franchiseId),
      quantity: String(obj.quantity),
      unitRate: Number(obj.unitRate).toFixed(2),
      description: (obj.description ?? '').trim(),
      currency: obj.currency,
      billToCountryId: String(obj.billToCountryId),
      billToStateId: String(obj.billToStateId),
      placeOfSupplyStateId: String(obj.placeOfSupplyStateId || obj.billToStateId),
      invoiceDate: obj.invoiceDate,
      supplyDate: obj.supplyDate,
    };
    const stored: Record<WorkshopInvoiceLockedField, string> = {
      franchiseId: String(row.franchiseId),
      quantity: String(row.quantity),
      unitRate: CommonFunctionsUtil.toNumber(row.unitRate).toFixed(2),
      description: row.description,
      currency: row.currency,
      billToCountryId: String(row.billToCountryId),
      billToStateId: String(row.billToStateId),
      placeOfSupplyStateId: String(row.placeOfSupplyStateId),
      invoiceDate: row.invoiceDate,
      supplyDate: row.supplyDate,
    };
    return WORKSHOP_INVOICE_LOCKED_FIELDS.filter((field) => incoming[field] !== stored[field]);
  }

  // ---------------------------------------------------------------------------
  // Tax and row values
  // ---------------------------------------------------------------------------

  private async buildDraft(obj: IManageWorkshopInvoice): Promise<IWorkshopInvoiceDraft> {
    const draft = await this.buildTaxDraft(obj);
    if (draft.billToAddress.countryCode === INDIA_COUNTRY_CODE && !/^\d{6}$/.test(obj.billToPinCode.trim())) {
      throw new BadRequestException('Pincode must be 6 digits for an Indian address');
    }
    draft.billToAddress = {
      ...draft.billToAddress,
      postalAddress: obj.billToAddressLine1.trim(),
      addressName: obj.billToAddressLine2?.trim() || undefined,
      cityVillage: obj.billToCity.trim(),
      pinCode: obj.billToPinCode.trim(),
    };
    return draft;
  }

  /**
   * Decision 5: base = quantity × unit rate, no discount; supplier = the franchise address;
   * customer = bill-to country + place-of-supply State; SERVICE, referenceId 1.
   */
  private async buildTaxDraft(req: IWorkshopInvoiceTaxRequest): Promise<IWorkshopInvoiceDraft> {
    const placeOfSupplyStateId = req.placeOfSupplyStateId || req.billToStateId;
    const [customerCountry, billToState, placeOfSupplyState, franchiseAddresses] = await Promise.all([
      this.countryService.fetchById(req.billToCountryId),
      this.stateService.fetchById(req.billToStateId),
      this.stateService.fetchById(placeOfSupplyStateId),
      this.addressService.filterByTableIdAndPk(TableEnum.MST_FRANCHISES, req.franchiseId),
    ]);
    if (Number(billToState.countryId) !== Number(req.billToCountryId)) {
      throw new BadRequestException('The bill-to State is not in the bill-to country');
    }
    if (Number(placeOfSupplyState.countryId) !== Number(req.billToCountryId)) {
      throw new BadRequestException('The place-of-supply State is not in the bill-to country');
    }
    const franchiseAddress = franchiseAddresses?.[0];
    if (!franchiseAddress?.countryId) {
      throw new BadRequestException('The franchise has no address; add one before raising invoices');
    }
    const [supplierCountry, supplierState] = await Promise.all([
      this.countryService.fetchById(franchiseAddress.countryId),
      franchiseAddress.stateId ? this.stateService.fetchById(franchiseAddress.stateId) : Promise.resolve(null),
    ]);

    const baseAmount = round2(req.quantity * req.unitRate);
    let taxResult: TaxResult;
    try {
      taxResult = await this.taxEngineService.calculate({
        baseAmount,
        discountAmount: 0,
        franchiseId: req.franchiseId,
        referenceId: 1,
        supplierCountryCode: supplierCountry.countryCode,
        supplierStateCode: supplierState?.code || undefined,
        customerCountryCode: customerCountry.countryCode,
        customerStateCode: placeOfSupplyState.code || undefined,
        currency: req.currency,
        transactionType: TransactionType.SERVICE,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException((error as Error).message);
    }

    const tax = this.roundTax(taxResult, req.currency);
    return {
      tax,
      placeOfSupplyStateId,
      billToAddress: {
        postalAddress: '',
        countryId: Number(req.billToCountryId),
        stateId: Number(req.billToStateId),
        country: customerCountry.country,
        countryCode: customerCountry.countryCode,
        state: billToState.state,
        stateCode: billToState.code,
      },
    };
  }

  /**
   * Rounds the engine result on the line total (decision 5). A CGST/SGST split takes the
   * odd paisa on SGST so the two halves always add up to the tax amount.
   */
  private roundTax(result: TaxResult, currency: string): ICalculateTaxResponse {
    const orderAmount = round2(result.baseAmount);
    const discountAmount = round2(result.discount || 0);
    const taxAmount = round2(result.taxAmount);
    const taxObj: Record<string, { amount: number; taxPercentage: number }> = {};
    for (const [key, value] of Object.entries(result.taxObj || {})) {
      // Tax Master rates are DECIMAL columns and arrive as strings ("18.00"); store numbers.
      taxObj[key] = { amount: round2(value.amount), taxPercentage: Number(value.taxPercentage) };
    }
    if (taxObj['CGST'] && taxObj['SGST']) {
      taxObj['CGST'].amount = round2(taxAmount / 2);
      taxObj['SGST'].amount = round2(taxAmount - taxObj['CGST'].amount);
    } else {
      const keys = Object.keys(taxObj);
      if (keys.length === 1) {
        taxObj[keys[0]].amount = taxAmount;
      }
    }
    const taxableAmount = round2(orderAmount - discountAmount);
    return {
      orderAmount,
      discountAmount,
      taxableAmount,
      taxPercentage: Number(result.taxPercentage),
      taxAmount,
      totalAmount: round2(taxableAmount + taxAmount),
      taxObj,
      taxType: result.taxType,
      taxMode: result.taxMode as TaxMode,
      invoiceNote: result.invoiceNote,
      currency,
      isLutApplied: result.isLutApplied,
      jurisdiction: {
        entityCountry: result.entityCountry,
        customerCountry: result.customerCountry,
        placeOfSupply: result.placeOfSupply,
      },
    };
  }

  private toRowValues(obj: IManageWorkshopInvoice, draft: IWorkshopInvoiceDraft): Partial<TxnWorkshopInvoice> {
    return {
      franchiseId: obj.franchiseId,
      invoiceDate: obj.invoiceDate,
      supplyDate: obj.supplyDate,
      billToCountryId: obj.billToCountryId,
      billToStateId: obj.billToStateId,
      placeOfSupplyStateId: draft.placeOfSupplyStateId,
      billToAddress: draft.billToAddress,
      description: obj.description.trim(),
      quantity: obj.quantity,
      unitRate: obj.unitRate,
      orderAmount: draft.tax.orderAmount,
      discountAmount: draft.tax.discountAmount,
      taxAmount: draft.tax.taxAmount,
      totalAmount: draft.tax.totalAmount,
      currency: obj.currency,
      taxObj: draft.tax.taxObj,
      taxType: draft.tax.taxType,
      taxMode: draft.tax.taxMode,
      taxPercentage: draft.tax.taxPercentage,
      isLutApplied: draft.tax.isLutApplied,
      jurisdiction: draft.tax.jurisdiction,
      ...this.editableValues(obj),
    };
  }

  /** Bill-to contact, payment and notes: editable before and after the number is issued. */
  private editableValues(obj: IManageWorkshopInvoice): Partial<TxnWorkshopInvoice> {
    return {
      billToName: obj.billToName.trim(),
      billToContactPerson: obj.billToContactPerson?.trim() || null,
      billToEmail: obj.billToEmail?.trim() || null,
      billToPhone: obj.billToPhone?.trim() || null,
      billToGstin: obj.billToGstin?.trim().toUpperCase() || null,
      paymentStatusId: obj.paymentStatusId,
      paymentModeId: obj.paymentModeId || null,
      transactionId: obj.transactionId?.trim() || null,
      paymentDate: obj.paymentDate || null,
      notes: obj.notes?.trim() || null,
    };
  }

  /**
   * After issue only the bill-to contact/address lines, payment details and notes change;
   * the country/State in the address snapshot stay as issued.
   */
  private editableAfterIssueValues(row: TxnWorkshopInvoice, obj: IManageWorkshopInvoice): Partial<TxnWorkshopInvoice> {
    const isIndia = row.billToAddress?.countryCode === INDIA_COUNTRY_CODE;
    if (isIndia && !/^\d{6}$/.test(obj.billToPinCode.trim())) {
      throw new BadRequestException('Pincode must be 6 digits for an Indian address');
    }
    return {
      ...this.editableValues(obj),
      billToAddress: {
        ...row.billToAddress,
        postalAddress: obj.billToAddressLine1.trim(),
        addressName: obj.billToAddressLine2?.trim() || undefined,
        cityVillage: obj.billToCity.trim(),
        pinCode: obj.billToPinCode.trim(),
      },
    };
  }

  /**
   * Decisions 2, 3, 7, 9: the next S number, FY from the invoice date, in the caller's
   * transaction (the counter row lock is held until it commits). The SAC is copied now so a
   * later config change can't alter an issued invoice.
   */
  private async issueInvoiceNumber(row: TxnWorkshopInvoice, franchise: IFranchise, t: Transaction): Promise<void> {
    row.invoiceId = await this.invoiceSequenceService.generateInvoiceNumber(
      row.franchiseId,
      franchise.financialYear,
      franchise.franchiseCode,
      BusinessTypeEnum.SERVICE,
      t,
      row.invoiceDate,
    );
    row.sacCode = this.appConfigService.getString(ConfigParam.DIET_SAC_CODE);
    await row.save({ transaction: t });
  }

  /** YYYY-MM-DD → "11 Aug 2026" */
  private formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return `${day} ${MONTHS[month - 1]} ${year}`;
  }

  private convertToModel(row: TxnWorkshopInvoice): IWorkshopInvoice {
    const item = row.get({ plain: true }) as TxnWorkshopInvoice;
    return {
      workshopInvoiceId: item.workshopInvoiceId,
      franchiseId: item.franchiseId,
      franchise: item.franchise?.companyName || '',
      franchiseCode: item.franchise?.franchiseCode || '',
      invoiceId: item.invoiceId,
      invoiceDate: item.invoiceDate,
      supplyDate: item.supplyDate,
      billToName: item.billToName,
      billToContactPerson: item.billToContactPerson,
      billToEmail: item.billToEmail,
      billToPhone: item.billToPhone,
      billToGstin: item.billToGstin,
      billToAddress: item.billToAddress,
      billToCountryId: item.billToCountryId,
      billToStateId: item.billToStateId,
      placeOfSupplyStateId: item.placeOfSupplyStateId,
      placeOfSupplyState: item.placeOfSupplyState
        ? `${item.placeOfSupplyState.state} (${item.placeOfSupplyState.code})`
        : '',
      description: item.description,
      sacCode: item.sacCode,
      quantity: item.quantity,
      unitRate: CommonFunctionsUtil.toNumber(item.unitRate),
      orderAmount: CommonFunctionsUtil.toNumber(item.orderAmount),
      discountAmount: CommonFunctionsUtil.toNumber(item.discountAmount),
      taxAmount: CommonFunctionsUtil.toNumber(item.taxAmount),
      totalAmount: CommonFunctionsUtil.toNumber(item.totalAmount),
      currency: item.currency,
      taxObj: item.taxObj || {},
      taxType: (item.taxType || TaxTypeEnum.NONE) as TaxTypeEnum,
      taxMode: (item.taxMode || TaxMode.NO_TAX) as TaxMode,
      taxPercentage: CommonFunctionsUtil.toNumber(item.taxPercentage),
      isLutApplied: item.isLutApplied,
      jurisdiction: item.jurisdiction,
      paymentStatusId: item.paymentStatusId,
      paymentStatus: item.paymentStatus?.paymentStatus || '',
      paymentModeId: item.paymentModeId,
      paymentMode: item.paymentMode?.paymentMode || '',
      transactionId: item.transactionId,
      paymentDate: item.paymentDate,
      notes: item.notes,
      cancelReason: item.cancelReason,
      active: item.active,
      locked: !!item.invoiceId,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
    };
  }
}
