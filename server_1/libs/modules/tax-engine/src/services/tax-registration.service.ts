import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import {
  IAuthUser,
  IInvoiceRegistration,
  IManageTaxRegistration,
  ITaxRegistration,
  TableEnum,
  TaxRegistrationNumberUtil,
  TaxTypeEnum,
} from '@eatfit247-shared-lib';
import { MstFranchise } from '@server_1/core';
import { AddressService, CountryService, FranchiseDateUtil, INDIA_COUNTRY_CODE } from '@server_1/platform';
import { MstFranchiseTaxRegistration } from '../models';
import { TaxFranchiseScope } from './tax-franchise-scope';

/** Tax systems a registration can be for (US sales tax permits come with the next spec). */
const REGISTRABLE_SYSTEMS: ReadonlyArray<TaxTypeEnum> = [TaxTypeEnum.GST, TaxTypeEnum.VAT];

/** What a franchise-form save does to the home registration (group 4b). */
interface IFranchiseFormPlan {
  countryCode: string;
  taxSystem: TaxTypeEnum;
  /** The home registration effective today, ended by the save */
  current: MstFranchiseTaxRegistration | null;
  /** The new number, from today; null when the field was cleared */
  number: string | null;
  stateCode: string | null;
}

/** The legacy franchise-form fields that mirror the home registration for one release. */
export interface IFranchiseFormRegistration {
  gstNumber?: string | null;
  vatNumber?: string | null;
}

/**
 * Tax registrations of the franchises (configurable tax treatment, decision 8). "Registered" means an active
 * registration effective on the date asked about; the franchise's GST / VAT columns only mirror the home one.
 */
@Injectable()
export class TaxRegistrationService {
  constructor(
    @InjectModel(MstFranchiseTaxRegistration) private readonly registrationRepository: typeof MstFranchiseTaxRegistration,
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
    private readonly addressService: AddressService,
    private readonly countryService: CountryService,
  ) {}

  /** GST in India, VAT elsewhere: the system a franchise registers for in its own country. */
  static homeTaxSystem(countryCode: string | null | undefined): TaxTypeEnum {
    return (countryCode ?? '').trim().toUpperCase() === INDIA_COUNTRY_CODE ? TaxTypeEnum.GST : TaxTypeEnum.VAT;
  }

  /** Active registrations effective on `onDate` (YYYY-MM-DD), optionally of one system / country. */
  public async findActive(
    franchiseId: number,
    onDate: string,
    filter: { taxSystem?: TaxTypeEnum; countryCode?: string } = {},
  ): Promise<MstFranchiseTaxRegistration[]> {
    const rows = await this.registrationRepository.findAll({
      where: {
        franchiseId,
        active: true,
        ...(filter.taxSystem ? { taxSystem: filter.taxSystem } : {}),
        ...(filter.countryCode ? { countryCode: filter.countryCode.trim().toUpperCase() } : {}),
      },
      order: [['effectiveFrom', 'DESC']],
    });
    // A franchise has a handful of registrations: the date test is the one tested helper
    return rows.filter((row) => TaxRegistrationService.isEffectiveOn(row, onDate));
  }

  /** The registration in the franchise's own country (GST in India, VAT elsewhere) effective on `onDate`. */
  public async home(franchiseId: number, supplierCountryCode: string, onDate: string): Promise<MstFranchiseTaxRegistration | null> {
    const [row] = await this.findActive(franchiseId, onDate, {
      taxSystem: TaxRegistrationService.homeTaxSystem(supplierCountryCode),
      countryCode: supplierCountryCode,
    });
    return row ?? null;
  }

  public async isRegistered(franchiseId: number, taxSystem: TaxTypeEnum, countryCode: string, onDate: string): Promise<boolean> {
    return (await this.findActive(franchiseId, onDate, { taxSystem, countryCode })).length > 0;
  }

  /** An active registration of that system and country, whatever its dates (rule save checks). */
  public async hasActive(franchiseId: number, taxSystem: TaxTypeEnum, countryCode: string): Promise<boolean> {
    const count = await this.registrationRepository.count({
      where: { franchiseId, taxSystem, countryCode: countryCode.trim().toUpperCase(), active: true },
    });
    return count > 0;
  }

  /** An active registration in that country, of any tax system (FOREIGN_REGISTRATION rules, decision 7). */
  public async hasActiveIn(franchiseId: number, countryCode: string): Promise<boolean> {
    const count = await this.registrationRepository.count({
      where: { franchiseId, countryCode: countryCode.trim().toUpperCase(), active: true },
    });
    return count > 0;
  }

  /** Registered for that system and country at any time between `from` and `to` (reports). */
  public async registeredBetween(franchiseId: number, taxSystem: TaxTypeEnum, countryCode: string, from: string, to: string): Promise<boolean> {
    const rows = await this.registrationRepository.findAll({
      where: { franchiseId, taxSystem, countryCode: countryCode.trim().toUpperCase(), active: true },
    });
    return rows.some((row) => TaxRegistrationService.periodsOverlap(row.effectiveFrom, row.effectiveTo, from, to));
  }

  /** Of these franchises, the ones with an active Indian GST registration on `onDate`. */
  public async gstRegisteredFranchiseIds(franchiseIds: number[], onDate: string): Promise<Set<number>> {
    if (franchiseIds.length === 0) {
      return new Set();
    }
    const rows = await this.registrationRepository.findAll({
      attributes: ['franchiseId', 'effectiveFrom', 'effectiveTo'],
      where: { franchiseId: { [Op.in]: franchiseIds }, taxSystem: TaxTypeEnum.GST, countryCode: INDIA_COUNTRY_CODE, active: true },
    });
    return new Set(rows.filter((row) => TaxRegistrationService.isEffectiveOn(row, onDate)).map((row) => row.franchiseId));
  }

  /**
   * The registration an invoice is issued under (decision 12): the sale's stored registration when there is
   * one, else the home registration effective on the invoice date. Null = unregistered (no tax number printed).
   */
  public async invoiceRegistration(
    franchiseId: number,
    supplierCountryCode: string | null | undefined,
    onDate: string,
    taxRegistrationId?: number | null,
  ): Promise<IInvoiceRegistration | null> {
    const row = taxRegistrationId
      ? await this.registrationRepository.findOne({ where: { taxRegistrationId, franchiseId } })
      : supplierCountryCode
        ? await this.home(franchiseId, supplierCountryCode.trim().toUpperCase(), onDate)
        : null;
    if (!row) {
      return null;
    }
    return {
      taxRegistrationId: row.taxRegistrationId,
      countryCode: row.countryCode,
      taxSystem: row.taxSystem,
      registrationNumber: row.registrationNumber,
      label: TaxRegistrationNumberUtil.label(row.taxSystem, row.countryCode),
      stateCode: row.stateCode,
      currencyCode: row.currencyCode,
    };
  }

  // ------------------------------------------------------------------ admin CRUD (TaxMaster rights, scoped)

  public async list(franchiseId: number, user: IAuthUser): Promise<ITaxRegistration[]> {
    TaxFranchiseScope.assertAccess(franchiseId, user);
    const rows = await this.registrationRepository.findAll({
      where: { franchiseId },
      order: [['active', 'DESC'], ['effectiveFrom', 'DESC'], ['taxRegistrationId', 'DESC']],
    });
    return rows.map((row) => this.toModel(row));
  }

  public async create(franchiseId: number, obj: IManageTaxRegistration, user: IAuthUser, ip: string): Promise<ITaxRegistration> {
    TaxFranchiseScope.assertAccess(franchiseId, user);
    await this.assertFranchiseExists(franchiseId);
    const fields = await this.validated(franchiseId, obj, null);
    const created = await this.registrationRepository.create({
      ...fields,
      franchiseId,
      createdBy: user.adminId,
      modifiedBy: user.adminId,
      createdIp: ip,
      modifiedIp: ip,
    } as MstFranchiseTaxRegistration);
    await this.syncFranchiseColumns(franchiseId);
    return this.toModel(created);
  }

  public async update(
    franchiseId: number,
    taxRegistrationId: number,
    obj: IManageTaxRegistration,
    user: IAuthUser,
    ip: string,
  ): Promise<ITaxRegistration> {
    const row = await this.findOwned(franchiseId, taxRegistrationId, user);
    const fields = await this.validated(
      franchiseId,
      { ...obj, active: obj.active ?? row.active, currencyCode: obj.currencyCode || row.currencyCode },
      taxRegistrationId,
    );
    await row.update({ ...fields, modifiedBy: user.adminId, modifiedIp: ip });
    await this.syncFranchiseColumns(franchiseId);
    return this.toModel(row);
  }

  /** Soft delete / reactivate (principle 6). Reactivating runs the overlap and number checks again. */
  public async changeStatus(franchiseId: number, taxRegistrationId: number, active: boolean, user: IAuthUser, ip: string): Promise<void> {
    const row = await this.findOwned(franchiseId, taxRegistrationId, user);
    if (active && !row.active) {
      await this.validated(franchiseId, { ...this.toModel(row), active: true }, taxRegistrationId);
    }
    await row.update({ active, modifiedBy: user.adminId, modifiedIp: ip });
    await this.syncFranchiseColumns(franchiseId);
  }

  // ------------------------------------------------------------------ the franchise form's legacy fields

  /**
   * Before the franchise form writes anything: the home-system number (GSTIN in India, VAT elsewhere) goes
   * through every check the sync will make, so a refused number never leaves a half-saved form (group 4b).
   */
  public async assertFranchiseFormNumbers(
    franchiseId: number | null,
    countryCode: string | null,
    form: IFranchiseFormRegistration,
    stored: IFranchiseFormRegistration,
  ): Promise<void> {
    const today = franchiseId ? await this.franchiseToday(franchiseId) : FranchiseDateUtil.localDate(new Date(), FranchiseDateUtil.DEFAULT_TIME_ZONE);
    await this.planFranchiseForm(franchiseId, countryCode, form, stored, today);
  }

  /**
   * The franchise form still edits `gst_number` / `vat_number` (until group 13). When the home-system number
   * differs from the stored column, the current home registration ends yesterday and a new one starts today;
   * a cleared number just ends it. History is kept: earlier invoices keep the number they were issued under.
   * An omitted field, or an unchanged one (a legacy value 146 skipped), changes nothing.
   */
  public async syncFromFranchiseForm(
    franchiseId: number,
    form: IFranchiseFormRegistration,
    stored: IFranchiseFormRegistration,
    adminId: number,
    ip: string,
  ): Promise<void> {
    const homeCountry = await this.franchiseCountry(franchiseId);
    const today = await this.franchiseToday(franchiseId);
    const plan = await this.planFranchiseForm(franchiseId, homeCountry, form, stored, today);
    if (!plan) {
      return;
    }
    if (plan.current) {
      // A registration that hadn't started yet never applied: it is deactivated rather than ended
      const ended = plan.current.effectiveFrom < today
        ? { effectiveTo: TaxRegistrationService.dayBefore(today) }
        : { active: false };
      await plan.current.update({ ...ended, modifiedBy: adminId, modifiedIp: ip });
    }
    if (plan.number) {
      await this.registrationRepository.create({
        franchiseId,
        countryCode: plan.countryCode,
        taxSystem: plan.taxSystem,
        registrationNumber: plan.number,
        stateCode: plan.stateCode,
        currencyCode: await this.defaultCurrency(franchiseId, plan.countryCode),
        effectiveFrom: today,
        active: true,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: ip,
        modifiedIp: ip,
      } as MstFranchiseTaxRegistration);
    }
    await this.syncFranchiseColumns(franchiseId);
  }

  /** What a franchise-form save does to the home registration; null = nothing. Throws when it would be refused. */
  private async planFranchiseForm(
    franchiseId: number | null,
    countryCode: string | null,
    form: IFranchiseFormRegistration,
    stored: IFranchiseFormRegistration,
    today: string,
  ): Promise<IFranchiseFormPlan | null> {
    const country = (countryCode ?? '').trim().toUpperCase();
    if (!country) {
      return null;
    }
    const taxSystem = TaxRegistrationService.homeTaxSystem(country);
    const field = taxSystem === TaxTypeEnum.GST ? 'gstNumber' : 'vatNumber';
    if (form[field] === undefined) {
      return null;
    }
    const typed = TaxRegistrationNumberUtil.normalize(form[field]);
    if (typed === TaxRegistrationNumberUtil.normalize(stored[field])) {
      return null;
    }
    const [current] = franchiseId ? await this.findActive(franchiseId, today, { taxSystem, countryCode: country }) : [];
    if (!typed) {
      return { countryCode: country, taxSystem, current: current ?? null, number: null, stateCode: null };
    }
    const checked = this.checkNumber(country, taxSystem, typed);
    if (current?.registrationNumber === checked.number) {
      return null;
    }
    await this.assertNumberFree(country, taxSystem, checked.number, current?.taxRegistrationId ?? null);
    if (franchiseId) {
      await this.assertNoOverlap(franchiseId, country, taxSystem, today, null, current?.taxRegistrationId ?? null);
    }
    return { countryCode: country, taxSystem, current: current ?? null, number: checked.number, stateCode: checked.stateCode };
  }

  /** `YYYY-MM-DD` of the day before. */
  static dayBefore(date: string): string {
    const day = new Date(`${date}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 1);
    return day.toISOString().slice(0, 10);
  }

  /** Effective on `date` (`effectiveTo` inclusive; open-ended when null). */
  static isEffectiveOn(period: { effectiveFrom: string; effectiveTo?: string | null }, date: string): boolean {
    return period.effectiveFrom <= date && (!period.effectiveTo || period.effectiveTo >= date);
  }

  /** Two date ranges share a day (`to` inclusive; null = open-ended). The overlap query is this predicate. */
  static periodsOverlap(aFrom: string, aTo: string | null, bFrom: string, bTo: string | null): boolean {
    return (!bTo || aFrom <= bTo) && (!aTo || bFrom <= aTo);
  }

  /** Mirrors today's home registration into `mst_franchises.gst_number` (India) / `vat_number` (elsewhere). */
  private async syncFranchiseColumns(franchiseId: number): Promise<void> {
    const homeCountry = await this.franchiseCountry(franchiseId);
    if (!homeCountry) {
      return;
    }
    const home = await this.home(franchiseId, homeCountry, await this.franchiseToday(franchiseId));
    const column = TaxRegistrationService.homeTaxSystem(homeCountry) === TaxTypeEnum.GST ? 'gstNumber' : 'vatNumber';
    await this.franchiseRepository.update({ [column]: home?.registrationNumber ?? null }, { where: { franchiseId } });
  }

  // ------------------------------------------------------------------ validation

  private async validated(
    franchiseId: number,
    obj: IManageTaxRegistration,
    exceptId: number | null,
  ): Promise<Partial<MstFranchiseTaxRegistration>> {
    const countryCode = (obj.countryCode ?? '').trim().toUpperCase();
    if (!/^[A-Z]{2,3}$/.test(countryCode)) {
      throw new BadRequestException('Country must be an ISO country code.');
    }
    const taxSystem = obj.taxSystem as TaxTypeEnum;
    if (!REGISTRABLE_SYSTEMS.includes(taxSystem)) {
      throw new BadRequestException('A registration is for GST or VAT.');
    }
    const checked = this.checkNumber(countryCode, taxSystem, obj.registrationNumber);
    if (obj.effectiveTo && obj.effectiveTo < obj.effectiveFrom) {
      throw new BadRequestException('The registration ends before it starts.');
    }
    const active = obj.active ?? true;
    if (active) {
      await this.assertNoOverlap(franchiseId, countryCode, taxSystem, obj.effectiveFrom, obj.effectiveTo ?? null, exceptId);
      await this.assertNumberFree(countryCode, taxSystem, checked.number, exceptId);
    }
    const currencyCode = (obj.currencyCode ?? '').trim().toUpperCase() || (await this.countryCurrency(countryCode));
    if (!currencyCode || !/^[A-Z]{3}$/.test(currencyCode)) {
      throw new BadRequestException(`No currency for ${countryCode}: enter the registration's currency.`);
    }
    return {
      countryCode,
      taxSystem,
      registrationNumber: checked.number,
      stateCode: checked.stateCode,
      iecNumber: (obj.iecNumber ?? '').trim().toUpperCase() || null,
      currencyCode,
      effectiveFrom: obj.effectiveFrom,
      effectiveTo: obj.effectiveTo || null,
      active,
    };
  }

  /** GSTIN (India) and TRN (UAE) by their format; other VAT numbers as entered, normalised. */
  private checkNumber(countryCode: string, taxSystem: TaxTypeEnum, value: string | null | undefined): { number: string; stateCode: string | null } {
    if (taxSystem === TaxTypeEnum.GST) {
      if (countryCode !== INDIA_COUNTRY_CODE) {
        throw new BadRequestException('GST registrations are Indian (country IN).');
      }
      const gstin = TaxRegistrationNumberUtil.checkGstin(value);
      if (!gstin.valid) {
        throw new BadRequestException(gstin.error);
      }
      return { number: gstin.normalized, stateCode: gstin.stateCode };
    }
    const number = TaxRegistrationNumberUtil.normalize(value);
    if (countryCode === 'AE') {
      const trn = TaxRegistrationNumberUtil.checkTrn(number);
      if (!trn.valid) {
        throw new BadRequestException(trn.error);
      }
    }
    if (!number || number.length > 50) {
      throw new BadRequestException('Enter the registration number (at most 50 characters).');
    }
    return { number, stateCode: null };
  }

  private async assertNoOverlap(
    franchiseId: number,
    countryCode: string,
    taxSystem: TaxTypeEnum,
    from: string,
    to: string | null,
    exceptId: number | null,
  ): Promise<void> {
    const rows = await this.registrationRepository.findAll({
      where: { franchiseId, countryCode, taxSystem, active: true, ...(exceptId ? { taxRegistrationId: { [Op.ne]: exceptId } } : {}) },
    });
    const clash = rows.find((row) => TaxRegistrationService.periodsOverlap(row.effectiveFrom, row.effectiveTo, from, to));
    if (clash) {
      throw new BadRequestException(
        `The dates overlap the active ${taxSystem} registration ${clash.registrationNumber} (${clash.effectiveFrom} to ${clash.effectiveTo ?? 'open'}). End it first.`,
      );
    }
  }


  /** A number belongs to one active registration (the DB index, checked first for a readable message). */
  private async assertNumberFree(countryCode: string, taxSystem: TaxTypeEnum, number: string, exceptId: number | null): Promise<void> {
    const taken = await this.registrationRepository.findOne({
      where: {
        countryCode,
        taxSystem,
        active: true,
        registrationNumber: number,
        ...(exceptId ? { taxRegistrationId: { [Op.ne]: exceptId } } : {}),
      },
    });
    if (taken) {
      throw new BadRequestException(`${number} is already an active registration of franchise ${taken.franchiseId}.`);
    }
  }

  // ------------------------------------------------------------------ helpers

  private async findOwned(franchiseId: number, taxRegistrationId: number, user: IAuthUser): Promise<MstFranchiseTaxRegistration> {
    TaxFranchiseScope.assertAccess(franchiseId, user);
    const row = await this.registrationRepository.findOne({ where: { taxRegistrationId, franchiseId } });
    if (!row) {
      throw new NotFoundException('Tax registration not found');
    }
    return row;
  }

  private async assertFranchiseExists(franchiseId: number): Promise<void> {
    if (!(await this.franchiseRepository.findByPk(franchiseId, { attributes: ['franchiseId'] }))) {
      throw new NotFoundException('Franchise not found');
    }
  }

  private async franchiseCountry(franchiseId: number): Promise<string | null> {
    const address = await this.addressService.findByTableIdAndPk(TableEnum.MST_FRANCHISES, franchiseId);
    return (address?.countryCode ?? '').trim().toUpperCase() || null;
  }

  private async franchiseToday(franchiseId: number): Promise<string> {
    const franchise = await this.franchiseRepository.findByPk(franchiseId, { attributes: ['franchiseId', 'timeZone'] });
    return FranchiseDateUtil.localDate(new Date(), franchise?.timeZone);
  }

  private async defaultCurrency(franchiseId: number, countryCode: string): Promise<string> {
    const franchise = await this.franchiseRepository.findByPk(franchiseId, { attributes: ['franchiseId', 'currencyCode'] });
    return (franchise?.currencyCode ?? '').trim().toUpperCase() || (await this.countryCurrency(countryCode)) || 'INR';
  }

  private async countryCurrency(countryCode: string): Promise<string | null> {
    const countries = await this.countryService.findAll({ page: 0, limit: 1000 });
    const country = countries.tableData.find((c) => (c.countryCode ?? '').trim().toUpperCase() === countryCode);
    return (country?.currencyCode ?? '').trim().toUpperCase() || null;
  }

  private toModel(row: MstFranchiseTaxRegistration): ITaxRegistration {
    return {
      taxRegistrationId: row.taxRegistrationId,
      franchiseId: row.franchiseId,
      countryCode: row.countryCode,
      taxSystem: row.taxSystem,
      registrationNumber: row.registrationNumber,
      stateCode: row.stateCode,
      iecNumber: row.iecNumber,
      currencyCode: row.currencyCode,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      invoicePrefix: row.invoicePrefix,
      invoiceNumberFormat: row.invoiceNumberFormat,
      fyStartMonth: row.fyStartMonth,
      active: row.active,
    };
  }
}
