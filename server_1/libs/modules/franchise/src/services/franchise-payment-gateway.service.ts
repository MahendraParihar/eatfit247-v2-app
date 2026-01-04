import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { IBasicSearch, ITableList } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';
import { MstFranchisePaymentGateway } from '../models';
import { CreateFranchisePaymentGatewayDto, UpdateFranchisePaymentGatewayDto } from '../dto';
import { MstPaymentGateway } from '@server_1/platform';

@Injectable()
export class FranchisePaymentGatewayService {
  constructor(
    @InjectModel(MstFranchisePaymentGateway)
    private readonly franchisePaymentGatewayRepository: typeof MstFranchisePaymentGateway,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<any>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'franchiseId');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.franchisePaymentGatewayRepository
      .scope('list')
      .findAndCountAll({
        where: whereCondition,
        order: [['franchisePaymentGatewayId', 'DESC']],
        offset: offset,
        limit: pageSize,
        raw: true,
        nest: true,
      });
    const resList = rows.map((item: any) => this.convertToModel(item));
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): any {
    return {
      franchisePaymentGatewayId: item.franchisePaymentGatewayId,
      id: item.franchisePaymentGatewayId,
      franchiseId: item.franchiseId,
      franchise: item.franchise
        ? {
          franchiseId: item.franchise.franchiseId,
          companyName: item.franchise.companyName,
        }
        : undefined,
      paymentGatewayId: item.paymentGatewayId,
      countryCode: item.countryCode,
      currencyCode: item.currencyCode,
      isPrimary: item.isPrimary,
      supportsDomestic: item.supportsDomestic,
      supportsInternational: item.supportsInternational,
      supportsEmi: item.supportsEmi,
      supportsUpi: item.supportsUpi,
      settlementDelayDays: item.settlementDelayDays,
      gatewayFeePercentage: item.gatewayFeePercentage,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
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

  public async fetchById(id: number): Promise<any> {
    const find = await this.franchisePaymentGatewayRepository.scope('details').findOne({
      where: { franchisePaymentGatewayId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Franchise payment gateway not found');
    }
    return this.convertToModel(find);
  }

  public async findByFranchiseId(franchiseId: number): Promise<any[]> {
    const results = await this.franchisePaymentGatewayRepository.scope('list').findAll({
      where: { franchiseId, active: true },
      order: [
        ['isPrimary', 'DESC'],
        ['franchisePaymentGatewayId', 'ASC'],
      ],
      raw: true,
      nest: true,
    });
    return results.map((item: any) => this.convertToModel(item));
  }

  public async create(
    obj: CreateFranchisePaymentGatewayDto,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    // If this is set as primary, unset other primary gateways for this franchise
    if (obj.isPrimary) {
      await this.franchisePaymentGatewayRepository.update(
        { isPrimary: false },
        { where: { franchiseId: obj.franchiseId } },
      );
    }
    const createObj = {
      franchiseId: obj.franchiseId,
      paymentGatewayId: obj.paymentGatewayId,
      countryCode: obj.countryCode || null,
      currencyCode: obj.currencyCode || null,
      isPrimary: obj.isPrimary,
      supportsDomestic: obj.supportsDomestic,
      supportsInternational: obj.supportsInternational,
      supportsEmi: obj.supportsEmi,
      supportsUpi: obj.supportsUpi,
      settlementDelayDays: obj.settlementDelayDays || null,
      gatewayFeePercentage: obj.gatewayFeePercentage || null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.franchisePaymentGatewayRepository.create(createObj);
  }

  public async update(
    id: number,
    obj: UpdateFranchisePaymentGatewayDto,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.franchisePaymentGatewayRepository.findOne({
      where: { franchisePaymentGatewayId: id },
    });
    if (!find) {
      throw new NotFoundException('Franchise payment gateway not found');
    }
    // If this is being set as primary, unset other primary gateways for this franchise
    if (obj.isPrimary === true) {
      const franchiseId = obj.franchiseId || find.franchiseId;
      await this.franchisePaymentGatewayRepository.update(
        { isPrimary: false },
        {
          where: {
            franchiseId: franchiseId,
            franchisePaymentGatewayId: { [Op.ne]: id },
          },
        },
      );
    }
    const updateObj: any = {};
    if (obj.franchiseId !== undefined) updateObj.franchiseId = obj.franchiseId;
    if (obj.paymentGatewayId !== undefined) updateObj.paymentGatewayId = obj.paymentGatewayId;
    if (obj.countryCode !== undefined) updateObj.countryCode = obj.countryCode || null;
    if (obj.currencyCode !== undefined) updateObj.currencyCode = obj.currencyCode || null;
    if (obj.isPrimary !== undefined) updateObj.isPrimary = obj.isPrimary;
    if (obj.supportsDomestic !== undefined) updateObj.supportsDomestic = obj.supportsDomestic;
    if (obj.supportsInternational !== undefined)
      updateObj.supportsInternational = obj.supportsInternational;
    if (obj.supportsEmi !== undefined) updateObj.supportsEmi = obj.supportsEmi;
    if (obj.supportsUpi !== undefined) updateObj.supportsUpi = obj.supportsUpi;
    if (obj.settlementDelayDays !== undefined)
      updateObj.settlementDelayDays = obj.settlementDelayDays || null;
    if (obj.gatewayFeePercentage !== undefined)
      updateObj.gatewayFeePercentage = obj.gatewayFeePercentage || null;
    if (obj.active !== undefined) updateObj.active = obj.active;
    updateObj.modifiedBy = adminId;
    updateObj.modifiedIp = cIp;
    await this.franchisePaymentGatewayRepository.update(updateObj, {
      where: { franchisePaymentGatewayId: id },
    });
  }

  public async changeStatus(
    id: number,
    active: boolean,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.franchisePaymentGatewayRepository.findOne({
      where: { franchisePaymentGatewayId: id },
    });
    if (!find) {
      throw new NotFoundException('Franchise payment gateway not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.franchisePaymentGatewayRepository.update(updateObj, {
      where: { franchisePaymentGatewayId: id },
    });
  }

  public async delete(id: number): Promise<void> {
    const find = await this.franchisePaymentGatewayRepository.findOne({
      where: { franchisePaymentGatewayId: id },
    });
    if (!find) {
      throw new NotFoundException('Franchise payment gateway not found');
    }
    await this.franchisePaymentGatewayRepository.destroy({
      where: { franchisePaymentGatewayId: id },
    });
  }

  async findActiveByFranchiseAndCurrency(params: {
    franchiseId: number;
    currency: string
  }): Promise<MstFranchisePaymentGateway[]> {
    return await this.franchisePaymentGatewayRepository.findAll({
      where: {
        franchiseId: params.franchiseId,
        currencyCode: params.currency,
        active: true,
      },
      include: [{
        model: MstPaymentGateway,
        as: 'paymentGateway',
        required: true,
      }],
    });
  }
}

