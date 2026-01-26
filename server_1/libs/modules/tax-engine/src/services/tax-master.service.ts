import { Injectable, NotFoundException } from '@nestjs/common';
import { ITaxCalculationInput } from '../interfaces/tax.interface';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { MstTaxMaster } from '../models';
import { IBasicSearch, ITableList, ITaxMaster } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';
import { CreateTaxMasterDto } from '../dto/tax-master.dto';

@Injectable()
export class TaxMasterService {
  constructor(@InjectModel(MstTaxMaster) private readonly mstTaxMaster: typeof MstTaxMaster) {}

  async getApplicableTaxRule(input: ITaxCalculationInput) {
    const today = new Date();
    return this.mstTaxMaster.findOne({
      where: {
        franchiseId: input.franchiseId,
        referenceId: input.referenceId,
        countryCode: input.buyerCountryCode,
        effectiveFrom: {
          [Op.lte]: today,
        },
        [Op.or]: [
          { effectiveTo: null },
          { effectiveTo: { [Op.gte]: today } },
        ],
      },
    });
  }

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ITaxMaster>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'taxName');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.mstTaxMaster.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['taxName', 'ASC']],
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
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.mstTaxMaster.update(updateObj, { where: { id: id } });
  }
}
