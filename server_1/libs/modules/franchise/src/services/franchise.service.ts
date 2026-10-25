import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, Sequelize } from 'sequelize';
import {
  BusinessTypeEnum,
  IBasicSearch,
  IDropdownItem,
  IFranchise,
  IFranchiseInvoiceCounters,
  IManageAddress,
  IManageFranchise,
  InvoiceNumberFormatUtil,
  ITableList,
  TableEnum,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, MstFranchise, SearchUtil, TableListSortUtil } from '@server_1/core';
import {
  AddressService,
  CountryService,
  FranchiseDateUtil,
  INDIA_COUNTRY_CODE,
  InvoiceSequenceModel,
  InvoiceSeriesUtil,
} from '@server_1/platform';
import { TaxRegistrationService } from '@server_1/modules/tax-engine';

/** The franchise columns that hold the invoice number format and the turnover threshold. */
interface IFranchiseNumberingFields {
  invoicePrefix?: string | null;
  invoiceNumberFormat?: string | null;
  registrationThresholdAmount?: number | null;
}

@Injectable()
export class FranchiseService {
  constructor(
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
    private addressService: AddressService,
    private countryService: CountryService,
    private readonly taxRegistrationService: TaxRegistrationService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IFranchise>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'companyName');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.franchiseRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: TableListSortUtil.orderFromAllowlist(
        searchDto,
        new Set([
          'franchiseId',
          'companyName',
          'franchiseCode',
          'emailId',
          'contactNumber',
          'active',
          'createdAt',
          'updatedAt',
        ]),
        [['companyName', 'ASC']],
      ),
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const gstRegistered = await this.taxRegistrationService.gstRegisteredFranchiseIds(
      rows.map((item: any) => item.franchiseId),
      FranchiseDateUtil.localDate(new Date(), FranchiseDateUtil.DEFAULT_TIME_ZONE),
    );
    const resList: IFranchise[] = await Promise.all(rows.map((item: any) => this.convertToModel(item, gstRegistered)));
    return {
      tableData: resList,
      count: count,
    };
  }

  /** `gstRegisteredIds`: the list's one-query answer; details look the franchise up itself. */
  private async convertToModel(item: any, gstRegisteredIds?: Set<number>): Promise<IFranchise> {
    // Fetch address for this franchise
    const address = await this.addressService.findByTableIdAndPk(
      TableEnum.MST_FRANCHISES,
      item.franchiseId,
    );
    const gstRegistered = (
      gstRegisteredIds ??
      (await this.taxRegistrationService.gstRegisteredFranchiseIds([item.franchiseId], FranchiseDateUtil.localDate(new Date(), item.timeZone)))
    ).has(item.franchiseId);
    
    return <IFranchise>{
      franchiseId: item.franchiseId,
      id: item.franchiseId,
      companyName: item.companyName,
      franchiseCode: item.franchiseCode,
      financialYear: item.financialYear,
      logo: CommonFunctionsUtil.buildImageUrl(
        item.logo
      ),
      firstName: item.firstName,
      lastName: item.lastName,
      emailId: item.emailId,
      alternateEmailId: item.alternateEmailId,
      contactNumber: item.contactNumber,
      alternateContactNumber: item.alternateContactNumber,
      panNumber: item.panNumber,
      tanNumber: item.tanNumber,
      gstNumber: item.gstNumber,
      vatNumber: item.vatNumber,
      gstRegistered,
      currencyCode: item.currencyCode ?? null,
      bankAccountId: item.bankAccountId,
      paymentGatewayConfigId: item.paymentGatewayConfigId,
      brandName: item.brandName,
      lutNumber: item.lutNumber,
      timeZone: item.timeZone,
      invoicePrefix: item.invoicePrefix ?? null,
      invoiceNumberFormat: item.invoiceNumberFormat ?? null,
      registrationThresholdAmount:
        item.registrationThresholdAmount === null || item.registrationThresholdAmount === undefined
          ? null
          : Number(item.registrationThresholdAmount),
      internationalTaxMode: item.internationalTaxMode,
      startDate: item.startDate,
      endDate: item.endDate,
      isPrimary: item.isPrimary,
      isDefault: item.isDefault,
      businessType: item.businessType,
      active: item.active,
      addressObj: address || undefined,
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

  public async fetchById(id: number): Promise<IFranchise> {
    const find = await this.franchiseRepository.scope('details').findOne({
      where: { franchiseId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Franchise not found');
    }
    return await this.convertToModel(find);
  }

  public async create(obj: IManageFranchise, cIp: string, adminId: number): Promise<void> {
    const numbering = await this.numberingFields(null, obj, null);
    await this.taxRegistrationService.assertFranchiseFormNumbers(null, await this.franchiseCountryCode(null, obj), obj, {});
    const createObj = {
      ...numbering,
      currencyCode: FranchiseService.currencyOf(obj),
      franchiseCode: obj.franchiseCode,
      financialYear: obj.financialYear,
      companyName: obj.companyName,
      logo: (obj.logo && obj.logo.length > 0) ? obj.logo : null,
      firstName: obj.firstName,
      lastName: obj.lastName,
      emailId: obj.emailId,
      alternateEmailId: obj.alternateEmailId,
      contactNumber: obj.contactNumber,
      alternateContactNumber: obj.alternateContactNumber,
      panNumber: obj.panNumber || null,
      tanNumber: obj.tanNumber || null,
      gstNumber: obj.gstNumber || null,
      vatNumber: obj.vatNumber || null,
      bankAccountId: obj.bankAccountId || null,
      paymentGatewayConfigId: obj.paymentGatewayConfigId || null,
      brandName: obj.brandName || null,
      lutNumber: obj.lutNumber || null,
      internationalTaxMode: (obj.internationalTaxMode as 'EXPORT_OF_SERVICE' | 'LOCAL_FOREIGN_TAX' | null) || null,
      startDate: obj.startDate,
      endDate: obj.endDate || null,
      isPrimary: obj.isPrimary,
      businessType: obj.businessType || null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    const franchise = await this.franchiseRepository.create(createObj);
    
    // Handle address creation if provided
    if (obj.addressObj) {
      const addressData: IManageAddress = {
        ...obj.addressObj,
        tableId: TableEnum.MST_FRANCHISES,
        pkOfTable: franchise.franchiseId,
      };
      await this.addressService.createOrUpdate(addressData, cIp, adminId);
    }
    if (!createObj.currencyCode) {
      // Decision 17: the working currency defaults to the address country's
      const currency = await this.countryCurrency(await this.franchiseCountryCode(franchise.franchiseId, obj));
      if (currency) {
        await this.franchiseRepository.update({ currencyCode: currency }, { where: { franchiseId: franchise.franchiseId } });
      }
    }
    await this.taxRegistrationService.syncFromFranchiseForm(franchise.franchiseId, obj, {}, adminId, cIp);
  }

  /** `currencyCode` from the payload, upper case; undefined when not sent (an update then keeps the stored one). */
  private static currencyOf(obj: IManageFranchise): string | null | undefined {
    if (obj.currencyCode === undefined) {
      return undefined;
    }
    return (obj.currencyCode ?? '').trim().toUpperCase() || null;
  }

  private async countryCurrency(countryCode: string | null): Promise<string | null> {
    if (!countryCode) {
      return null;
    }
    const countries = await this.countryService.findAll({ page: 0, limit: 1000 });
    const country = countries.tableData.find((c) => (c.countryCode ?? '').trim().toUpperCase() === countryCode);
    return (country?.currencyCode ?? '').trim().toUpperCase() || null;
  }

  public async update(id: number, obj: IManageFranchise, cIp: string, adminId: number): Promise<void> {
    const find = await this.franchiseRepository.findOne({
      where: { franchiseId: id },
    });
    if (!find) {
      throw new NotFoundException('Franchise not found');
    }
    const numbering = await this.numberingFields(id, obj, find);
    const countryCode = await this.franchiseCountryCode(id, obj);
    await this.taxRegistrationService.assertFranchiseFormNumbers(id, countryCode, obj, find);
    const stored = { gstNumber: find.gstNumber, vatNumber: find.vatNumber };
    // An empty currency falls back to the country's (decision 17: a franchise always states one)
    const sent = FranchiseService.currencyOf(obj);
    const currencyCode = sent === null ? await this.countryCurrency(countryCode) : sent;
    const updateObj = {
      ...numbering,
      ...(currencyCode !== undefined ? { currencyCode } : {}),
      franchiseCode: obj.franchiseCode,
      financialYear: obj.financialYear,
      companyName: obj.companyName,
      logo: (obj.logo && obj.logo.length > 0) ? obj.logo : null,
      firstName: obj.firstName,
      lastName: obj.lastName,
      emailId: obj.emailId,
      alternateEmailId: obj.alternateEmailId,
      contactNumber: obj.contactNumber,
      alternateContactNumber: obj.alternateContactNumber,
      panNumber: obj.panNumber || null,
      tanNumber: obj.tanNumber || null,
      // Omitted = unchanged (an older client); the home registration follows in syncFromFranchiseForm (group 4b)
      ...(obj.gstNumber !== undefined ? { gstNumber: obj.gstNumber || null } : {}),
      ...(obj.vatNumber !== undefined ? { vatNumber: obj.vatNumber || null } : {}),
      bankAccountId: obj.bankAccountId || null,
      paymentGatewayConfigId: obj.paymentGatewayConfigId || null,
      brandName: obj.brandName || null,
      lutNumber: obj.lutNumber || null,
      // Deprecated; the form no longer sends it (D15), so an omitted value leaves the stored one unchanged
      ...(obj.internationalTaxMode !== undefined
        ? { internationalTaxMode: (obj.internationalTaxMode as 'EXPORT_OF_SERVICE' | 'LOCAL_FOREIGN_TAX' | null) || null }
        : {}),
      startDate: obj.startDate,
      endDate: obj.endDate || null,
      isPrimary: obj.isPrimary,
      isDefault: obj.isDefault,
      businessType: obj.businessType || null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.franchiseRepository.update(updateObj, { where: { franchiseId: id } });
    
    // Handle address creation/update if provided
    if (obj.addressObj) {
      const addressData: IManageAddress = {
        ...obj.addressObj,
        tableId: TableEnum.MST_FRANCHISES,
        pkOfTable: id,
      };
      await this.addressService.createOrUpdate(addressData, cIp, adminId);
    }
    await this.taxRegistrationService.syncFromFranchiseForm(id, obj, stored, adminId, cIp);
  }

  /**
   * The numbering columns to save (compliant invoice numbering 3.4). Only keys present in the payload
   * are written, so a client that doesn't send them keeps the stored format. The effective prefix and
   * template are validated on every save (decision 6, amended in group 7): the Rule 46 limit applies
   * when the franchise's country is India or unknown, an Indian franchise must have both, and the
   * prefix must not equal another franchise's prefix or code nor start another franchise's issued
   * numbers, because invoice numbers are unique across franchises. Both empty = the legacy format
   * (non-Indian franchises only).
   */
  private async numberingFields(
    franchiseId: number | null,
    obj: IManageFranchise,
    stored: MstFranchise | null,
  ): Promise<IFranchiseNumberingFields> {
    const fields: IFranchiseNumberingFields = {};
    const clean = (value: string | null | undefined): string | null => (value ?? '').trim() || null;
    if (obj.invoicePrefix !== undefined) {
      fields.invoicePrefix = clean(obj.invoicePrefix)?.toUpperCase() ?? null;
    }
    if (obj.invoiceNumberFormat !== undefined) {
      fields.invoiceNumberFormat = clean(obj.invoiceNumberFormat);
    }
    if (obj.registrationThresholdAmount !== undefined) {
      fields.registrationThresholdAmount = obj.registrationThresholdAmount ?? null;
    }
    const prefix = 'invoicePrefix' in fields ? fields.invoicePrefix : clean(stored?.invoicePrefix);
    const template = 'invoiceNumberFormat' in fields ? fields.invoiceNumberFormat : clean(stored?.invoiceNumberFormat);
    const countryCode = await this.franchiseCountryCode(franchiseId, obj);
    if (!prefix && !template) {
      if (countryCode === INDIA_COUNTRY_CODE) {
        throw new BadRequestException(
          'An Indian franchise needs an invoice prefix and number format (GST invoices allow at most 16 characters, Rule 46).',
        );
      }
      return fields;
    }
    // Unknown country: hold the format to the Indian limit rather than skip it
    const gstLimit = countryCode === INDIA_COUNTRY_CODE || countryCode === null;
    const errors = InvoiceNumberFormatUtil.validate(template, prefix, { gstLimit });
    if (prefix) {
      const clash = await this.franchiseRepository.findOne({
        attributes: ['franchiseId', 'franchiseCode'],
        where: {
          ...(franchiseId ? { franchiseId: { [Op.ne]: franchiseId } } : {}),
          [Op.or]: [
            Sequelize.where(Sequelize.fn('upper', Sequelize.col('invoice_prefix')), prefix.toUpperCase()),
            Sequelize.where(Sequelize.fn('upper', Sequelize.col('franchise_code')), prefix.toUpperCase()),
          ],
        },
      });
      if (clash) {
        errors.push(`Prefix ${prefix} is already used by franchise ${clash.franchiseCode}; invoice numbers must be unique across franchises.`);
      } else if (await this.prefixIssuedByAnotherFranchise(prefix, franchiseId)) {
        errors.push(`Prefix ${prefix} starts invoice numbers already issued by another franchise; choose another prefix.`);
      }
    }
    if (errors.length > 0) {
      throw new BadRequestException(errors.join(' '));
    }
    return fields;
  }

  /** True when another franchise has issued an invoice or credit note numbered `{prefix}/…` or `{prefix}-…`. */
  private async prefixIssuedByAnotherFranchise(prefix: string, franchiseId: number | null): Promise<boolean> {
    const sequelize = this.franchiseRepository.sequelize as Sequelize;
    const [row] = await sequelize.query<{ found: number }>(
      `SELECT 1 AS found FROM (
           SELECT invoice_id AS number, franchise_id FROM public.txn_member_payments WHERE invoice_id IS NOT NULL
           UNION ALL SELECT invoice_id, franchise_id FROM public.txn_member_products WHERE invoice_id IS NOT NULL
           UNION ALL SELECT credit_note_number, franchise_id FROM public.txn_credit_notes
       ) t
       WHERE (upper(t.number) LIKE :slash OR upper(t.number) LIKE :dash)
         AND t.franchise_id IS DISTINCT FROM :franchiseId
       LIMIT 1`,
      {
        type: QueryTypes.SELECT,
        replacements: { slash: `${prefix.toUpperCase()}/%`, dash: `${prefix.toUpperCase()}-%`, franchiseId },
      },
    );
    return !!row;
  }

  /** Country of the franchise: the address in the payload, else the stored one. */
  private async franchiseCountryCode(franchiseId: number | null, obj: IManageFranchise): Promise<string | null> {
    const countryId =
      obj.addressObj?.countryId ??
      (franchiseId ? (await this.addressService.findByTableIdAndPk(TableEnum.MST_FRANCHISES, franchiseId))?.countryId : null);
    if (!countryId) {
      return null;
    }
    try {
      return InvoiceSeriesUtil.normalize((await this.countryService.fetchById(Number(countryId)))?.countryCode);
    } catch {
      return null;
    }
  }

  /** The franchise's counters for its current FY (number-format preview, compliant invoice numbering 5.1). */
  public async invoiceCounters(id: number): Promise<IFranchiseInvoiceCounters> {
    const franchise = await this.franchiseRepository.findOne({
      attributes: ['franchiseId', 'financialYear', 'timeZone'],
      where: { franchiseId: id },
      raw: true,
    });
    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }
    const invoiceDate = FranchiseDateUtil.localDate(new Date(), franchise.timeZone || FranchiseDateUtil.DEFAULT_TIME_ZONE);
    const financialYear = FranchiseDateUtil.financialYear(invoiceDate, Number(franchise.financialYear));
    const rows = await InvoiceSequenceModel.findAll({
      attributes: ['invoiceType', 'series', 'currentNumber'],
      where: { franchiseId: id, financialYear },
      raw: true,
    });
    return {
      financialYear,
      invoiceDate,
      counters: rows.map((row) => ({ invoiceType: row.invoiceType, series: row.series, currentNumber: Number(row.currentNumber) })),
    };
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.franchiseRepository.findOne({
      where: { franchiseId: id },
    });
    if (!find) {
      throw new NotFoundException('Franchise not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.franchiseRepository.update(updateObj, { where: { franchiseId: id } });
  }

  public async getFranchiseList(): Promise<IDropdownItem[]> {
    const tempList = await this.franchiseRepository.scope('list').findAll({
      where: { active: true },
      order: [['companyName', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t: any) => ({
      id: t.franchiseId,
      label: t.companyName,
      isActive: t.active,
    }));
  }

  /**
   * Get franchise list with country information for checkout
   * Returns franchises with their countryId from address and isDefault flag
   */
  public async getFranchiseListWithCountry(): Promise<
    Array<{ id: number; label: string; countryId: number | null; isDefault: boolean }>
  > {
    const tempList = await this.franchiseRepository.scope('list').findAll({
      where: { active: true },
      order: [['companyName', 'ASC']],
      raw: true,
      nest: true,
    });

    const franchisesWithCountry = await Promise.all(
      tempList.map(async (t: any) => {
        // Get franchise address to find country
        const addresses = await this.addressService.filterByTableIdAndPk(
          TableEnum.MST_FRANCHISES,
          t.franchiseId,
        );
        const countryId = addresses && addresses.length > 0 ? addresses[0].countryId : null;

        return {
          id: t.franchiseId,
          label: t.companyName,
          countryId: countryId,
          isDefault: t.isDefault,
        };
      }),
    );

    return franchisesWithCountry;
  }

  /**
   * "Tax applicable" for a franchise (configurable tax treatment, D15; replaces the GST_ENABLED config switch): it
   * holds an active registration in its own country today, in its time zone, the condition under which the tax
   * engine charges tax (D6). False for an unknown franchise or one without an address country.
   */
  public async taxApplicable(franchiseId: number | null | undefined): Promise<boolean> {
    if (!franchiseId) {
      return false;
    }
    const franchise = await this.franchiseRepository.findByPk(franchiseId, { attributes: ['franchiseId', 'timeZone'] });
    const address = franchise ? await this.addressService.findByTableIdAndPk(TableEnum.MST_FRANCHISES, franchiseId) : null;
    const country = (address?.countryCode ?? '').trim().toUpperCase();
    if (!country) {
      return false;
    }
    const today = FranchiseDateUtil.localDate(new Date(), franchise?.timeZone);
    return !!(await this.taxRegistrationService.home(franchiseId, country, today));
  }

  /** The franchise public signup assigns to countries without one (`is_default`); null when none is set. */
  public async getDefaultFranchise(): Promise<IDropdownItem | null> {
    const found = await this.franchiseRepository.scope('list').findOne({
      where: { active: true, isDefault: true },
      raw: true,
      nest: true,
    });
    return found ? { id: found.franchiseId, label: found.companyName, isActive: found.active } : null;
  }

  public async franchiseByBusinessType(businessType: BusinessTypeEnum): Promise<IDropdownItem[]> {
    const tempList = await this.franchiseRepository.scope('list').findAll({
      where: {
        active: true,
        [Op.and]: [
          Sequelize.literal(`'${businessType}'::public.business_type = ANY("business_type")`),
        ],
      },
      order: [['companyName', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t: any) => ({
      id: t.franchiseId,
      label: t.companyName,
      isActive: t.active,
    }));
  }
}

