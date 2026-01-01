import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnPromoCode } from '../models';
import { ITableList, IBasicSearch, IPromoCode, IApplyPromoCodeResult, DiscountTypeEnum } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil } from '@server_1/core';
import { Op } from 'sequelize';
import { CreatePromoCodeDto, ApplyPromoCodeDto } from '../dto';

@Injectable()
export class PromoCodeService {
  constructor(
    @InjectModel(TxnPromoCode) private readonly promoCodeRepository: typeof TxnPromoCode,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IPromoCode>> {
    const whereCondition: any = {};
    
    if (searchDto.search) {
      whereCondition[Op.or] = [
        { code: { [Op.iLike]: `%${searchDto.search}%` } },
      ];
    }

    if (searchDto.name) {
      whereCondition.code = { [Op.iLike]: `%${searchDto.name}%` };
    }

    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.promoCodeRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IPromoCode[] = rows.map((item: any) => this.convertToModel(item));
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IPromoCode {
    return <IPromoCode>{
      promoCodeId: item.promoCodeId,
      code: item.code,
      discountType: item.discountType,
      discountValue: item.discountValue,
      maxDiscount: item.maxDiscount,
      minOrderAmount: item.minOrderAmount,
      usageLimit: item.usageLimit,
      usedCount: item.usedCount,
      active: item.active !== undefined ? item.active : true,
      expiresAt: item.expiresAt,
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

  public async fetchById(id: number): Promise<IPromoCode> {
    const find = await this.promoCodeRepository.scope('details').findOne({
      where: { promoCodeId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Promo code not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: CreatePromoCodeDto, cIp: string, adminId: number): Promise<void> {
    // Check if code already exists
    const existingCode = await this.promoCodeRepository.findOne({
      where: { code: obj.code.toUpperCase() },
    });
    if (existingCode) {
      throw new BadRequestException('Promo code already exists');
    }

    const createObj = {
      code: obj.code.toUpperCase(),
      discountType: obj.discountType,
      discountValue: obj.discountValue,
      maxDiscount: obj.maxDiscount || null,
      minOrderAmount: obj.minOrderAmount || null,
      usageLimit: obj.usageLimit || null,
      usedCount: 0,
      active: obj.active !== undefined ? obj.active : true,
      expiresAt: obj.expiresAt || null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    
    await this.promoCodeRepository.create(createObj);
  }

  public async update(id: number, obj: CreatePromoCodeDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.promoCodeRepository.findOne({ where: { promoCodeId: id } });
    if (!find) {
      throw new NotFoundException('Promo code not found');
    }

    // Check if code already exists for another promo code
    if (obj.code && obj.code.toUpperCase() !== find.code) {
      const existingCode = await this.promoCodeRepository.findOne({
        where: { code: obj.code.toUpperCase() },
      });
      if (existingCode) {
        throw new BadRequestException('Promo code already exists');
      }
    }

    const updateObj: any = {
      code: obj.code.toUpperCase(),
      discountType: obj.discountType,
      discountValue: obj.discountValue,
      maxDiscount: obj.maxDiscount || null,
      minOrderAmount: obj.minOrderAmount || null,
      usageLimit: obj.usageLimit || null,
      active: obj.active !== undefined ? obj.active : true,
      expiresAt: obj.expiresAt || null,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };

    await this.promoCodeRepository.update(updateObj, { where: { promoCodeId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.promoCodeRepository.findOne({ where: { promoCodeId: id } });
    if (!find) {
      throw new NotFoundException('Promo code not found');
    }
    await this.promoCodeRepository.update(
      {
        active: active,
        modifiedBy: adminId,
        modifiedIp: cIp,
      },
      { where: { promoCodeId: id } }
    );
  }

  public async applyPromoCode(dto: ApplyPromoCodeDto): Promise<IApplyPromoCodeResult> {
    const promoCode = await this.promoCodeRepository.findOne({
      where: { code: dto.code.toUpperCase() },
    });

    if (!promoCode) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: dto.orderAmount,
        message: 'Invalid promo code',
      };
    }

    // Check if promo code is active
    if (!promoCode.active) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: dto.orderAmount,
        message: 'Promo code is not active',
      };
    }

    // Check if promo code has expired
    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: dto.orderAmount,
        message: 'Promo code has expired',
      };
    }

    // Check minimum order amount
    if (promoCode.minOrderAmount && dto.orderAmount < promoCode.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: dto.orderAmount,
        message: `Minimum order amount of ${promoCode.minOrderAmount} is required`,
      };
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: dto.orderAmount,
        message: 'Promo code usage limit reached',
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discountType === DiscountTypeEnum.FLAT) {
      discountAmount = promoCode.discountValue;
    } else if (promoCode.discountType === DiscountTypeEnum.PERCENT) {
      discountAmount = (dto.orderAmount * promoCode.discountValue) / 100;
    }

    // Apply max discount limit if set
    if (promoCode.maxDiscount && discountAmount > promoCode.maxDiscount) {
      discountAmount = promoCode.maxDiscount;
    }

    const finalAmount = Math.max(0, dto.orderAmount - discountAmount);

    return {
      valid: true,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      message: 'Promo code applied successfully',
    };
  }
}

