import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ITaxRuleLookup } from '../interfaces/tax.interface';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { MstTaxMaster } from '../models';
import { IBasicSearch, ITableList, ITaxMaster, TaxCategoryEnum, TaxTypeEnum, TransactionType } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, MstFranchise, SearchUtil, TableListSortUtil } from '@server_1/core';
import { CreateTaxMasterDto } from '../dto/tax-master.dto';

/** `reference_id` of a franchise's default SERVICE rule (every plan without its own rule; a plan with id 1 shares it) */
export const SERVICE_DEFAULT_REFERENCE = 1;

@Injectable()
export class TaxMasterService {
  constructor(
    @InjectModel(MstTaxMaster) private readonly mstTaxMaster: typeof MstTaxMaster,
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
  ) {}

  /**
   * The active rule for (franchise, reference, transaction type, country) effective on the date,
   * newest first. Null when none is configured (the engine turns that into an error).
   */
  async getApplicableTaxRule(input: ITaxRuleLookup): Promise<MstTaxMaster | null> {
    const rule = await this.findRule(input, input.referenceId);
    if (rule || input.transactionType !== TransactionType.SERVICE || input.referenceId === SERVICE_DEFAULT_REFERENCE) {
      return rule;
    }
    // Services: a plan-specific rule wins; otherwise the franchise's default service rule (reference 1)
    return this.findRule(input, SERVICE_DEFAULT_REFERENCE);
  }

  private findRule(input: ITaxRuleLookup, referenceId: number): Promise<MstTaxMaster | null> {
    return this.mstTaxMaster.findOne({
      where: {
        franchiseId: input.franchiseId,
        referenceId,
        transactionType: input.transactionType,
        countryCode: input.countryCode,
        active: true,
        effectiveFrom: { [Op.lte]: input.onDate },
        [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: input.onDate } }],
      },
      order: [['effectiveFrom', 'DESC']],
    });
  }

  /**
   * A VAT rule needs its franchise's TRN (4.6 decision 18); a 0% VAT rule must be zero-rated or exempt
   * (decision 7). A GST rule may exist without a GSTIN: it prices as unregistered until the GSTIN is
   * added (matrix decision 13).
   */
  private async assertConsistentRule(obj: CreateTaxMasterDto, checkRegistration = true): Promise<void> {
    const category = obj.taxCategory || TaxCategoryEnum.STANDARD;
    const rate = Number(obj.taxPercent || 0);
    if (obj.taxSystem === TaxTypeEnum.VAT && rate === 0 && category === TaxCategoryEnum.STANDARD) {
      throw new BadRequestException('A 0% VAT rule must be zero-rated or exempt.');
    }
    if (obj.taxSystem === TaxTypeEnum.VAT && rate > 0 && category !== TaxCategoryEnum.STANDARD) {
      throw new BadRequestException(`A ${rate}% VAT rule is standard-rated; zero-rated, exempt and out-of-scope rules are 0%.`);
    }
    if (!checkRegistration || obj.taxSystem !== TaxTypeEnum.VAT) {
      return;
    }
    const franchise = await this.franchiseRepository.findByPk(obj.franchiseId, {
      attributes: ['franchiseId', 'vatNumber'],
    });
    if (!franchise?.vatNumber?.trim()) {
      throw new BadRequestException('Add the franchise TRN before creating a VAT rule (or use tax system NONE if it is not registered).');
    }
  }

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ITaxMaster>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'taxName');
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

  public async fetchById(id: number): Promise<ITaxMaster> {
    const find = await this.mstTaxMaster.scope('details').findOne({
      where: { id: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Tax master not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: CreateTaxMasterDto, cIp: string, adminId: number): Promise<void> {
    await this.assertConsistentRule(obj);
    // Set default values if not provided
    const franchiseId = obj.franchiseId
    const referenceId = obj.referenceId
    const createObj = {
      franchiseId: franchiseId,
      referenceId: referenceId,
      countryCode: obj.countryCode,
      transactionType: obj.transactionType,
      taxSystem: obj.taxSystem,
      taxCode: obj.taxCode,
      taxName: obj.taxName,
      taxPercent: obj.taxPercent,
      applyOn: obj.applyOn,
      isTaxInclusive: obj.isTaxInclusive,
      taxCategory: obj.taxCategory || TaxCategoryEnum.STANDARD,
      hsnSacCode: obj.hsnSacCode?.trim() || null,
      legalBasis: obj.legalBasis?.trim() || null,
      effectiveFrom: obj.effectiveFrom,
      effectiveTo: obj.effectiveTo || null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.mstTaxMaster.create(createObj);
  }

  public async update(id: number, obj: CreateTaxMasterDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.mstTaxMaster.findOne({
      where: { id: id },
    });
    if (!find) {
      throw new NotFoundException('Tax master not found');
    }
    // A staged (inactive) VAT rule may be edited before the TRN exists; the TRN is checked on activation
    await this.assertConsistentRule(
      {
        ...obj,
        franchiseId: obj.franchiseId ?? find.franchiseId,
        taxCategory: obj.taxCategory ?? find.taxCategory,
      } as CreateTaxMasterDto,
      find.active,
    );
    // Only update if provided, otherwise keep existing values
    const updateObj: any = {};
    if (obj.franchiseId !== undefined) updateObj.franchiseId = obj.franchiseId;
    if (obj.referenceId !== undefined) updateObj.referenceId = obj.referenceId;
    updateObj.countryCode = obj.countryCode;
    updateObj.transactionType = obj.transactionType;
    updateObj.taxSystem = obj.taxSystem;
    updateObj.taxCode = obj.taxCode;
    updateObj.taxName = obj.taxName;
    updateObj.taxPercent = obj.taxPercent;
    updateObj.applyOn = obj.applyOn;
    updateObj.isTaxInclusive = obj.isTaxInclusive;
    if (obj.taxCategory !== undefined) updateObj.taxCategory = obj.taxCategory;
    if (obj.hsnSacCode !== undefined) updateObj.hsnSacCode = obj.hsnSacCode?.trim() || null;
    if (obj.legalBasis !== undefined) updateObj.legalBasis = obj.legalBasis?.trim() || null;
    updateObj.effectiveFrom = obj.effectiveFrom;
    updateObj.effectiveTo = obj.effectiveTo || null;
    updateObj.modifiedBy = adminId;
    updateObj.modifiedIp = cIp;
    await this.mstTaxMaster.update(updateObj, { where: { id: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.mstTaxMaster.findOne({
      where: { id: id },
    });
    if (!find) {
      throw new NotFoundException('Tax master not found');
    }
    if (active && !find.active) {
      // Activating a staged VAT rule needs the franchise TRN behind it
      await this.assertConsistentRule(find.get({ plain: true }) as unknown as CreateTaxMasterDto);
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.mstTaxMaster.update(updateObj, { where: { id: id } });
  }
}
