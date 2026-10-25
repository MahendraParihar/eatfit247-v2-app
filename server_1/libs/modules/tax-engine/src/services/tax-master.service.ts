import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ForeignKeyConstraintError, Op, QueryTypes, UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { MstTaxMaster } from '../models';
import {
  CustomerScopeEnum,
  CustomerTypeConditionEnum,
  CustomerTypeEnum,
  ElectronicConditionEnum,
  IAuthUser,
  IBasicSearch,
  ITableList,
  ITaxMaster,
  ITaxRule,
  ITaxRuleDraft,
  ITaxRuleFacts,
  ITaxRulePreviewRequest,
  ITaxRulePreviewResponse,
  ITaxRuleResolution,
  ITaxRuleSaveResult,
  ITaxRuleSaveWarning,
  MoneyConditionEnum,
  PaymentRouteEnum,
  RegistrationConditionEnum,
  StateRelationEnum,
  TableEnum,
  TaxCategoryEnum,
  TaxRegistrationNumberUtil,
  TaxRuleGuardrailsUtil,
  TaxRuleMatchUtil,
  TaxTreatmentEnum,
  TaxTypeEnum,
  TransactionType,
  gstStateCode,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, MstFranchise, SearchUtil, TableListSortUtil } from '@server_1/core';
import { AddressService, FranchiseDateUtil } from '@server_1/platform';
import { CreateTaxMasterDto } from '../dto/tax-master.dto';
import { TaxRegistrationService } from './tax-registration.service';
import { TaxFranchiseScope } from './tax-franchise-scope';

/** `reference_id` of a franchise's default SERVICE rule (every plan without its own rule; a plan with id 1 shares it) */
export const SERVICE_DEFAULT_REFERENCE = 1;

/** What today's form means by a reference: reference 1 on a SERVICE rule is the franchise default (all plans). */
export function legacyAppliesTo(transactionType: TransactionType, referenceId: number): 'ALL' | 'SPECIFIC' {
  return transactionType === TransactionType.SERVICE && Number(referenceId) === SERVICE_DEFAULT_REFERENCE ? 'ALL' : 'SPECIFIC';
}

@Injectable()
export class TaxMasterService {
  constructor(
    @InjectModel(MstTaxMaster) private readonly mstTaxMaster: typeof MstTaxMaster,
    private readonly taxRegistrationService: TaxRegistrationService,
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
    private readonly addressService: AddressService,
    private readonly sequelize: Sequelize,
  ) {}

  // ------------------------------------------------------------------ the rule resolver (decisions 3, 4)

  /** The franchise's active rules of a transaction type: the candidates for a sale (fallback-only ones never match). */
  private franchiseRules(franchiseId: number, transactionType: TransactionType | string): Promise<MstTaxMaster[]> {
    return this.mstTaxMaster.findAll({ where: { franchiseId, transactionType, active: true } });
  }

  /** The rules matching a sale, best first (D4 precedence through `TaxRuleMatchUtil`). */
  public async resolve(facts: ITaxRuleFacts): Promise<ITaxRuleResolution<MstTaxMaster>> {
    return TaxRuleMatchUtil.resolve(await this.franchiseRules(facts.franchiseId, facts.transactionType), facts);
  }

  /** The winning rule; none is today's 400 (a missing rule is an error, never a silent "no tax"). */
  public async resolveOrThrow(facts: ITaxRuleFacts): Promise<MstTaxMaster> {
    const { winner } = await this.resolve(facts);
    if (!winner) {
      throw new BadRequestException(TaxMasterService.noRuleMessage(facts));
    }
    return winner;
  }

  /**
   * The supply's own GST rate rule (requirements D3, group 6b): the same-country GST CHARGE rule that would price
   * this plan or product at home on the supply date. A GST export or IGST on a sale abroad is charged at its rate,
   * inclusive flag and HSN/SAC; the foreign rule only decides the treatment.
   */
  public async supplyRateRule(facts: ITaxRuleFacts): Promise<MstTaxMaster | null> {
    const rateRules = (await this.franchiseRules(facts.franchiseId, facts.transactionType)).filter(
      (rule) =>
        rule.customerScope === CustomerScopeEnum.SAME_COUNTRY &&
        rule.treatment === TaxTreatmentEnum.CHARGE &&
        rule.taxSystem === TaxTypeEnum.GST,
    );
    return TaxRuleMatchUtil.winner(rateRules, {
      ...facts,
      placeOfSupplyCountryCode: facts.supplierCountryCode,
      placeOfSupplyStateCode: facts.supplierStateCode,
    });
  }

  static noRuleMessage(facts: Pick<ITaxRuleFacts, 'franchiseId' | 'supplierCountryCode' | 'transactionType' | 'referenceId'>): string {
    return (
      `No active tax rule for franchise ${facts.franchiseId}, country ${facts.supplierCountryCode}, ` +
      `${facts.transactionType} (reference ${facts.referenceId}). Add it in Tax Master.`
    );
  }

  // ------------------------------------------------------------------ preview (decision 7, plan 5.3)

  /** Which rule would price this sale, with the runners-up and warnings. Nothing is saved; scoped like the list. */
  public async preview(request: ITaxRulePreviewRequest, user: IAuthUser): Promise<ITaxRulePreviewResponse> {
    this.assertFranchiseAccess(request.franchiseId, user);
    const { facts, warnings } = await this.facts(request);
    const resolution = await this.resolve(facts);
    if (!resolution.winner) {
      warnings.push({ code: 'NO_RULE', message: TaxMasterService.noRuleMessage(facts) });
    }
    if (resolution.ambiguous) {
      warnings.push({
        code: 'AMBIGUOUS',
        message: `Rules ${resolution.winner?.id} and ${resolution.runnersUp[0]?.id} tie on every dimension: deactivate one of them.`,
      });
    }
    warnings.push(...TaxRuleMatchUtil.shadowingWarnings(resolution));
    return {
      facts,
      winner: resolution.winner ? this.toRule(resolution.winner) : null,
      runnersUp: resolution.runnersUp.map((rule) => this.toRule(rule)),
      warnings,
      tax: null,
    };
  }

  /**
   * The facts of a sale (decision 3): the place of supply (billing for services, delivery for goods, the GSTIN
   * State for India B2B services), the supplier's home registration on the supply date, B2B when a valid
   * customer GSTIN / TRN is given, the plan's electronic flag, and the money: domestic when paid in the
   * franchise's own currency over a domestic route (decision 17; no currency literal).
   */
  public async facts(request: ITaxRulePreviewRequest): Promise<{ facts: ITaxRuleFacts; warnings: ITaxRuleSaveWarning[] }> {
    const warnings: ITaxRuleSaveWarning[] = [];
    const franchise = await this.franchiseRepository.findByPk(request.franchiseId, { attributes: ['franchiseId', 'timeZone', 'currencyCode'] });
    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }
    const address = await this.addressService.findByTableIdAndPk(TableEnum.MST_FRANCHISES, request.franchiseId);
    const supplier = (address?.countryCode ?? '').trim().toUpperCase();
    if (!supplier) {
      throw new BadRequestException('The franchise address has no country. Add the franchise address first.');
    }
    // The franchise's calendar day, as the engine reads it: a timestamp is converted, a plain date kept
    const requested = (request.supplyDate ?? '').trim();
    const supplyDate = /^\d{4}-\d{2}-\d{2}$/.test(requested)
      ? requested
      : FranchiseDateUtil.localDate(requested && !Number.isNaN(new Date(requested).getTime()) ? new Date(requested) : new Date(), franchise.timeZone);
    const number = (request.customerRegistrationNumber ?? '').trim();
    const customerNumber = number ? TaxRegistrationNumberUtil.checkForCountry(request.billingCountryCode, number) : null;
    if (customerNumber && !customerNumber.valid) {
      warnings.push({ code: 'CUSTOMER_NUMBER_INVALID', message: `Customer tax number ignored: ${customerNumber.error}` });
    }
    const isGoods = request.transactionType === TransactionType.PRODUCT;
    const place = TaxRuleMatchUtil.placeOfSupply({
      transactionType: request.transactionType,
      supplierCountryCode: supplier,
      billingCountryCode: request.billingCountryCode,
      billingStateCode: request.billingStateCode,
      deliveryCountryCode: request.deliveryCountryCode,
      deliveryStateCode: request.deliveryStateCode,
      customerRegistrationNumber: customerNumber?.valid ? customerNumber.normalized : null,
    });
    if (place.stateDiffersFromBilling) {
      warnings.push({ code: 'GSTIN_STATE_DIFFERS', message: `Place of supply: the GSTIN's State ${place.stateCode}, not the billing State (IGST s.12(2)(a)).` });
    }
    const facts: ITaxRuleFacts = {
      franchiseId: request.franchiseId,
      supplierCountryCode: supplier,
      supplierStateCode: gstStateCode(address?.stateCode),
      transactionType: request.transactionType,
      referenceId: Number(request.referenceId),
      placeOfSupplyCountryCode: place.countryCode ?? '',
      placeOfSupplyStateCode: place.stateCode,
      registered: !!(await this.taxRegistrationService.home(request.franchiseId, supplier, supplyDate)),
      customerType: customerNumber?.valid ? CustomerTypeEnum.B2B : CustomerTypeEnum.B2C,
      electronic: isGoods ? false : await this.isElectronicPlan(Number(request.referenceId)),
      // No currency given: the franchise's own (the preview's default sale)
      money: isGoods
        ? null
        : TaxRuleMatchUtil.moneyOrigin(TaxMasterService.paymentRoute(request.currency || franchise.currencyCode, request.paymentRoute, franchise.currencyCode)),
      supplyDate,
    };
    return { facts, warnings };
  }

  /**
   * How the money arrived, as the engine decides it today: a chosen route, except that money in a foreign
   * currency is foreign whatever route was picked; without a route, foreign currency means an international
   * gateway and the franchise's own currency a domestic payment.
   */
  static paymentRoute(currency: string | null | undefined, route: PaymentRouteEnum | null | undefined, franchiseCurrency: string | null | undefined): PaymentRouteEnum | null {
    const paid = (currency ?? '').trim().toUpperCase();
    const own = (franchiseCurrency ?? '').trim().toUpperCase();
    if (!paid || !own) {
      return route ?? null;
    }
    const foreign = paid !== own;
    if (route) {
      return foreign && route === PaymentRouteEnum.DOMESTIC ? PaymentRouteEnum.FOREIGN_REMITTANCE : route;
    }
    return foreign ? PaymentRouteEnum.INTERNATIONAL_CARD_GATEWAY : PaymentRouteEnum.DOMESTIC;
  }

  /** `mst_program_plans.is_electronic_service` (UAE ER Art 23); read by name, as the plan module is a sibling. */
  public async isElectronicPlan(programPlanId: number): Promise<boolean> {
    const rows = await this.sequelize.query<{ electronic: boolean }>(
      'SELECT is_electronic_service AS electronic FROM public.mst_program_plans WHERE program_plan_id = :programPlanId',
      { replacements: { programPlanId }, type: QueryTypes.SELECT },
    );
    return rows[0]?.electronic === true;
  }

  // ------------------------------------------------------------------ save-time guardrails (decision 7)

  /**
   * Every D7 block (structural ones in `TaxRuleGuardrailsUtil`; registrations, the fallback row and duplicates
   * here) and the warnings, which need a legal basis. Registration checks apply to an active rule only, so a
   * staged rule can be prepared before the registration exists.
   */
  private async validated(draft: ITaxRuleDraft, options: { seeded: boolean; storedLegalBasis?: string | null }): Promise<ITaxRuleSaveWarning[]> {
    const blocks = TaxRuleGuardrailsUtil.blocks(draft);
    if (blocks.length > 0) {
      throw new BadRequestException(blocks.map((block) => block.message).join(' '));
    }
    // The supplier country of a rule is its franchise's (a registration abroad is used through FOREIGN_REGISTRATION)
    if (!(await this.franchiseRepository.findByPk(draft.franchiseId, { attributes: ['franchiseId'] }))) {
      throw new NotFoundException('Franchise not found');
    }
    const franchiseCountry = (await this.addressService.findByTableIdAndPk(TableEnum.MST_FRANCHISES, draft.franchiseId))?.countryCode?.trim().toUpperCase();
    if (franchiseCountry && franchiseCountry !== draft.countryCode) {
      throw new BadRequestException(`The rule's country must be the franchise's country (${franchiseCountry}).`);
    }
    // A foreign-registration rule taxes under the registration in the customer's country, checked below
    const foreignRegistration = draft.treatment === TaxTreatmentEnum.FOREIGN_REGISTRATION;
    if (
      draft.active &&
      !foreignRegistration &&
      draft.taxSystem === TaxTypeEnum.VAT &&
      !(await this.taxRegistrationService.hasActive(draft.franchiseId, TaxTypeEnum.VAT, draft.countryCode.trim()))
    ) {
      throw new BadRequestException('Add the franchise\'s VAT registration (TRN) before activating a VAT rule (or use tax system NONE if it is not registered).');
    }
    if (draft.active && foreignRegistration) {
      const country = (draft.placeOfSupplyCountryCode ?? '').trim().toUpperCase();
      if (!(await this.taxRegistrationService.hasActive(draft.franchiseId, draft.taxSystem as TaxTypeEnum, country))) {
        throw new BadRequestException(`Invoicing under a registration in ${country} needs the franchise's active registration there: add it under Tax registrations first.`);
      }
    }
    if (draft.fallbackTaxMasterId) {
      const fallback = await this.mstTaxMaster.findByPk(draft.fallbackTaxMasterId);
      if (!fallback) {
        throw new BadRequestException(`Fallback rule ${draft.fallbackTaxMasterId} does not exist.`);
      }
      const fallbackBlocks = TaxRuleGuardrailsUtil.fallbackBlocks(draft, this.toRule(fallback));
      if (fallbackBlocks.length > 0) {
        throw new BadRequestException(fallbackBlocks.map((block) => block.message).join(' '));
      }
    }
    // A rule other active rules fall back on must stay a valid fallback for each of them (D7)
    if (draft.id) {
      for (const dependent of await this.mstTaxMaster.findAll({ where: { fallbackTaxMasterId: draft.id, active: true } })) {
        const dependentBlocks = TaxRuleGuardrailsUtil.fallbackBlocks(this.toRule(dependent), { ...draft, id: draft.id });
        if (dependentBlocks.length > 0) {
          throw new BadRequestException(
            `Rule ${dependent.id} (${dependent.taxCode}) uses this rule as its fallback: ${dependentBlocks.map((block) => block.message).join(' ')}`,
          );
        }
      }
    }
    const [duplicate] = TaxRuleMatchUtil.duplicates(draft, await this.mstTaxMaster.findAll({ where: { franchiseId: draft.franchiseId, active: true } }));
    if (duplicate) {
      throw new BadRequestException(
        `Rule ${duplicate.id} (${duplicate.taxCode}) already has these conditions from ${duplicate.effectiveFrom}. ` +
          'Edit it, or give this rule a later effective date (it then takes over from that date).',
      );
    }
    const warnings = TaxRuleGuardrailsUtil.warnings(draft, options);
    if (warnings.length > 0 && !(draft.legalBasis ?? '').trim()) {
      throw new BadRequestException(`A legal basis is required for this rule: ${warnings.map((warning) => warning.message).join(' ')}`);
    }
    // A seeded rule changed in its tax: the stored basis no longer explains it
    if (options.seeded && (draft.legalBasis ?? '').trim() === (options.storedLegalBasis ?? '').trim()) {
      throw new BadRequestException('This rule was seeded from the legal analysis: update the legal basis to say why it changes.');
    }
    return warnings;
  }

  /** The rule as saved: the request over the stored row (update) or today's defaults (create). */
  private draftOf(obj: CreateTaxMasterDto, row: MstTaxMaster | null): ITaxRuleDraft {
    const pick = <K extends keyof CreateTaxMasterDto & keyof MstTaxMaster>(key: K, fallback: MstTaxMaster[K] | CreateTaxMasterDto[K]) =>
      (obj[key] !== undefined ? obj[key] : row ? row[key] : fallback) as never;
    const transactionType = (obj.transactionType ?? row?.transactionType) as TransactionType;
    const referenceId = Number(obj.referenceId ?? row?.referenceId ?? 0);
    // Today's form sends no applies-to: reference 1 on a SERVICE rule is the franchise default (plan 1b.6). An
    // existing rule keeps its own unless the type or the reference changes value (an ALL rule stays ALL, 5b.1).
    const referenceMoved = !row || transactionType !== row.transactionType || referenceId !== Number(row.referenceId);
    const appliesTo = obj.appliesTo ?? (referenceMoved ? legacyAppliesTo(transactionType, referenceId) : row.appliesTo);
    const customerScope = pick('customerScope', CustomerScopeEnum.SAME_COUNTRY) as string;
    return {
      id: row?.id ?? null,
      franchiseId: Number(obj.franchiseId ?? row?.franchiseId),
      countryCode: String(obj.countryCode ?? row?.countryCode ?? '').trim().toUpperCase(),
      transactionType,
      referenceId,
      taxSystem: pick('taxSystem', TaxTypeEnum.NONE),
      taxCode: pick('taxCode', ''),
      taxName: pick('taxName', ''),
      taxPercent: Number(obj.taxPercent ?? row?.taxPercent ?? 0),
      isTaxInclusive: pick('isTaxInclusive', false),
      taxCategory: pick('taxCategory', TaxCategoryEnum.STANDARD),
      hsnSacCode: obj.hsnSacCode !== undefined ? obj.hsnSacCode?.trim() || null : row?.hsnSacCode ?? null,
      legalBasis: obj.legalBasis !== undefined ? obj.legalBasis?.trim() || null : row?.legalBasis ?? null,
      effectiveFrom: TaxMasterService.day(obj.effectiveFrom ?? row?.effectiveFrom) as string,
      effectiveTo: obj.effectiveTo !== undefined ? TaxMasterService.day(obj.effectiveTo) : TaxMasterService.day(row?.effectiveTo),
      // A new rule may be created staged; an existing one changes state only through update-status
      active: row ? row.active : obj.active ?? true,
      customerScope,
      // Leaving a specific-country scope clears the country (5b.5)
      placeOfSupplyCountryCode: customerScope === CustomerScopeEnum.SPECIFIC_COUNTRY ? pick('placeOfSupplyCountryCode', null) : null,
      stateRelation: pick('stateRelation', StateRelationEnum.ANY),
      registrationCondition: pick('registrationCondition', RegistrationConditionEnum.ANY),
      customerTypeCondition: pick('customerTypeCondition', CustomerTypeConditionEnum.ANY),
      electronicCondition: pick('electronicCondition', ElectronicConditionEnum.ANY),
      moneyCondition: pick('moneyCondition', MoneyConditionEnum.ANY),
      appliesTo,
      treatment: pick('treatment', TaxTreatmentEnum.CHARGE),
      refusalMessage: obj.refusalMessage !== undefined ? obj.refusalMessage?.trim() || null : row?.refusalMessage ?? null,
      invoiceNote: obj.invoiceNote !== undefined ? obj.invoiceNote?.trim() || null : row?.invoiceNote ?? null,
      requiresEvidence: pick('requiresEvidence', false),
      fallbackTaxMasterId: obj.fallbackTaxMasterId !== undefined ? obj.fallbackTaxMasterId : row?.fallbackTaxMasterId ?? null,
      fallbackOnly: pick('fallbackOnly', false),
    };
  }

  /** The columns a draft writes. */
  private columnsOf(draft: ITaxRuleDraft): Partial<MstTaxMaster> {
    const { id: _id, ...columns } = draft;
    return {
      ...columns,
      taxSystem: draft.taxSystem as TaxTypeEnum,
      taxCategory: draft.taxCategory as TaxCategoryEnum,
      transactionType: draft.transactionType as TransactionType,
      placeOfSupplyCountryCode: draft.customerScope === CustomerScopeEnum.SPECIFIC_COUNTRY ? draft.placeOfSupplyCountryCode ?? null : null,
      effectiveFrom: draft.effectiveFrom as unknown as Date,
      effectiveTo: (draft.effectiveTo ?? null) as unknown as Date | null,
    };
  }

  /**
   * `YYYY-MM-DD` of a date input. DATEONLY strings pass through. A timestamp is today's form's date picker: the
   * admin's local midnight sent in UTC (1 Dec in IST arrives as 30 Nov 18:30Z), so it is read as its nearest UTC
   * midnight, the day the admin chose anywhere from UTC−11 to UTC+11 (5b.2).
   */
  static day(value: Date | string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return new Date(Math.round(date.getTime() / 86_400_000) * 86_400_000).toISOString().slice(0, 10);
  }

  /** Did the save change what the rule charges or when (not just its labels or legal basis)? */
  private taxChanged(row: MstTaxMaster, draft: ITaxRuleDraft): boolean {
    const stored = this.toRule(row);
    const keys: Array<keyof ITaxRuleDraft> = [
      'countryCode', 'transactionType', 'referenceId', 'taxSystem', 'taxPercent', 'isTaxInclusive', 'taxCategory', 'hsnSacCode',
      'effectiveFrom', 'effectiveTo', 'customerScope', 'placeOfSupplyCountryCode', 'stateRelation', 'registrationCondition',
      'customerTypeCondition', 'electronicCondition', 'moneyCondition', 'appliesTo', 'treatment', 'refusalMessage',
      'requiresEvidence', 'fallbackTaxMasterId', 'fallbackOnly',
    ];
    return keys.some((key) => String(stored[key] ?? '') !== String(draft[key] ?? ''));
  }

  /** A row as the shared rule shape (preview, guardrails). */
  private toRule(row: MstTaxMaster): ITaxRule {
    return {
      id: row.id,
      franchiseId: row.franchiseId,
      countryCode: (row.countryCode ?? '').trim(),
      transactionType: row.transactionType,
      referenceId: Number(row.referenceId),
      taxSystem: row.taxSystem,
      taxCode: row.taxCode,
      taxName: row.taxName,
      taxPercent: Number(row.taxPercent),
      isTaxInclusive: row.isTaxInclusive,
      taxCategory: row.taxCategory,
      hsnSacCode: row.hsnSacCode,
      legalBasis: row.legalBasis,
      effectiveFrom: TaxMasterService.day(row.effectiveFrom) as string,
      effectiveTo: TaxMasterService.day(row.effectiveTo),
      active: row.active,
      customerScope: row.customerScope,
      placeOfSupplyCountryCode: row.placeOfSupplyCountryCode,
      stateRelation: row.stateRelation,
      registrationCondition: row.registrationCondition,
      customerTypeCondition: row.customerTypeCondition,
      electronicCondition: row.electronicCondition,
      moneyCondition: row.moneyCondition,
      appliesTo: row.appliesTo,
      treatment: row.treatment,
      refusalMessage: row.refusalMessage,
      invoiceNote: row.invoiceNote,
      requiresEvidence: row.requiresEvidence,
      fallbackTaxMasterId: row.fallbackTaxMasterId,
      fallbackOnly: row.fallbackOnly,
    };
  }

  /** Migrations 144 / 146 seed rows with `created_ip = ':0'`: editing one is a D7 warning. */
  private static isSeeded(row: MstTaxMaster): boolean {
    return row.createdIp === ':0';
  }

  /** The unique index is the last guard against a race; it reads as the duplicate message, never a 500. */
  private static async saving<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new BadRequestException('Another active rule already has these conditions and effective date.');
      }
      if (error instanceof ForeignKeyConstraintError) {
        throw new BadRequestException('The franchise or the fallback rule does not exist.');
      }
      throw error;
    }
  }

  /** The admin's franchises only (decision 14): all of them for a super admin, none for an unmapped admin. */
  public async findAll(searchDto: IBasicSearch, user: IAuthUser): Promise<ITableList<ITaxMaster>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'taxName');
    const scope = TaxFranchiseScope.franchiseIds(user);
    if (scope) {
      whereCondition.franchiseId = { [Op.in]: scope };
    }
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.mstTaxMaster.scope('list').findAndCountAll({
      where: whereCondition,
      order: TableListSortUtil.orderFromAllowlist(
        searchDto,
        new Set([
          'id',
          'taxName',
          'taxCode',
          'franchiseId',
          'referenceId',
          'countryCode',
          'effectiveFrom',
          'effectiveTo',
          'active',
          'createdAt',
          'updatedAt',
        ]),
        [['taxName', 'ASC']],
      ),
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: ITaxMaster[] = rows.map((item: any) => this.convertToModel(item));
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): ITaxMaster {
    return <ITaxMaster>{
      id: item.id,
      franchiseId: item.franchiseId,
      referenceId: item.referenceId,
      countryCode: item.countryCode,
      transactionType: item.transactionType,
      taxSystem: item.taxSystem,
      taxCode: item.taxCode,
      taxName: item.taxName,
      taxPercent: item.taxPercent,
      applyOn: item.applyOn,
      isTaxInclusive: item.isTaxInclusive,
      taxCategory: item.taxCategory,
      hsnSacCode: item.hsnSacCode ?? null,
      legalBasis: item.legalBasis ?? null,
      effectiveFrom: item.effectiveFrom,
      effectiveTo: item.effectiveTo,
      active: item.active,
      customerScope: item.customerScope,
      placeOfSupplyCountryCode: item.placeOfSupplyCountryCode ?? null,
      stateRelation: item.stateRelation,
      registrationCondition: item.registrationCondition,
      customerTypeCondition: item.customerTypeCondition,
      electronicCondition: item.electronicCondition,
      moneyCondition: item.moneyCondition,
      appliesTo: item.appliesTo,
      treatment: item.treatment,
      refusalMessage: item.refusalMessage ?? null,
      invoiceNote: item.invoiceNote ?? null,
      requiresEvidence: item.requiresEvidence,
      fallbackTaxMasterId: item.fallbackTaxMasterId ?? null,
      fallbackOnly: item.fallbackOnly,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdIp: item.createdIp,
      modifiedIp: item.modifiedIp,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
    };
  }

  public async fetchById(id: number, user: IAuthUser): Promise<ITaxMaster> {
    const find = await this.mstTaxMaster.scope('details').findOne({
      where: { id: id },
      raw: true,
      nest: true,
    });
    if (find) {
      this.assertFranchiseAccess(find.franchiseId, user);
    }
    if (!find) {
      throw new NotFoundException('Tax master not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: CreateTaxMasterDto, cIp: string, user: IAuthUser): Promise<ITaxRuleSaveResult> {
    this.assertFranchiseAccess(obj.franchiseId, user);
    const draft = this.draftOf(obj, null);
    const warnings = await this.validated(draft, { seeded: false });
    const created = await TaxMasterService.saving(() =>
      this.mstTaxMaster.create({
        ...this.columnsOf(draft),
        createdBy: user.adminId,
        modifiedBy: user.adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      } as MstTaxMaster),
    );
    return { id: created.id, warnings };
  }

  public async update(id: number, obj: CreateTaxMasterDto, cIp: string, user: IAuthUser): Promise<ITaxRuleSaveResult> {
    const find = await this.mstTaxMaster.findOne({
      where: { id: id },
    });
    if (!find) {
      throw new NotFoundException('Tax master not found');
    }
    // Both the rule's franchise and the one it would move to
    this.assertFranchiseAccess(find.franchiseId, user);
    if (obj.franchiseId !== undefined) {
      this.assertFranchiseAccess(obj.franchiseId, user);
    }
    const draft = this.draftOf(obj, find);
    const warnings = await this.validated(draft, {
      seeded: TaxMasterService.isSeeded(find) && this.taxChanged(find, draft),
      storedLegalBasis: find.legalBasis,
    });
    await TaxMasterService.saving(() =>
      this.mstTaxMaster.update({ ...this.columnsOf(draft), modifiedBy: user.adminId, modifiedIp: cIp }, { where: { id: id } }),
    );
    return { id, warnings };
  }

  /**
   * Soft delete / reactivate (principle 6). Reactivating runs every save check again (a duplicate, a missing
   * registration). A fallback still named by an active rule can't be deactivated.
   */
  public async changeStatus(id: number, active: boolean, cIp: string, user: IAuthUser): Promise<void> {
    const find = await this.mstTaxMaster.findOne({
      where: { id: id },
    });
    if (!find) {
      throw new NotFoundException('Tax master not found');
    }
    this.assertFranchiseAccess(find.franchiseId, user);
    if (active && !find.active) {
      await this.validated({ ...this.toRule(find), active: true }, { seeded: false });
    }
    if (!active && find.active) {
      const dependent = await this.mstTaxMaster.findOne({ where: { fallbackTaxMasterId: id, active: true } });
      if (dependent) {
        throw new BadRequestException(`Rule ${dependent.id} (${dependent.taxCode}) uses this rule as its fallback: change that rule first.`);
      }
    }
    await TaxMasterService.saving(() =>
      this.mstTaxMaster.update({ active, modifiedBy: user.adminId, modifiedIp: cIp }, { where: { id: id } }),
    );
  }

  /** Admins reach only their own franchises' rules (principle 3, decision 14; see `TaxFranchiseScope`). */
  private assertFranchiseAccess(franchiseId: number, user: IAuthUser): void {
    TaxFranchiseScope.assertAccess(franchiseId, user);
  }
}
