import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Order, WhereOptions } from 'sequelize';
import { TxnGoogleReview } from '../models';
import {
  GoogleReviewEntityTypeEnum,
  IBasicSearch,
  IGoogleReview,
  IGoogleReviewReply,
  IManageGoogleReview,
  IPublicGoogleReview,
  IPublicTableList,
  ITableList,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil, TableListSortUtil } from '@server_1/core';

interface IGoogleReviewSearchExt extends IBasicSearch {
  entityType?: GoogleReviewEntityTypeEnum;
  entityId?: number;
  rating?: number;
  source?: string;
  isPublished?: boolean;
}

@Injectable()
export class GoogleReviewService {
  constructor(
    @InjectModel(TxnGoogleReview) private readonly reviewRepository: typeof TxnGoogleReview,
  ) {}

  public async findAll(searchDto: IGoogleReviewSearchExt): Promise<ITableList<IGoogleReview>> {
    const whereCondition: WhereOptions = SearchUtil.filterBasicSearch(searchDto, 'reviewerName');
    if (searchDto.entityType) {
      (whereCondition as any).entityType = searchDto.entityType;
    }
    if (searchDto.entityId !== undefined && searchDto.entityId !== null) {
      (whereCondition as any).entityId = searchDto.entityId;
    }
    if (searchDto.rating !== undefined && searchDto.rating !== null) {
      (whereCondition as any).rating = searchDto.rating;
    }
    if (searchDto.source) {
      (whereCondition as any).source = searchDto.source;
    }
    if (searchDto.isPublished !== undefined && searchDto.isPublished !== null) {
      (whereCondition as any).isPublished = searchDto.isPublished;
    }
    if (searchDto.active !== undefined && searchDto.active !== null) {
      (whereCondition as any).active = searchDto.active;
    }

    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const order: Order = TableListSortUtil.orderFromAllowlist(
      searchDto,
      new Set([
        'googleReviewId',
        'reviewerName',
        'rating',
        'reviewDate',
        'displayOrder',
        'isPublished',
        'active',
        'createdAt',
        'updatedAt',
      ]),
      [
        ['displayOrder', 'ASC'],
        ['reviewDate', 'DESC'],
      ],
    );

    const { rows, count } = await this.reviewRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order,
      offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IGoogleReview[] = rows.map((item: any) => this.convertToModel(item));
    return {
      tableData: resList,
      count,
    };
  }

  public async fetchById(id: number): Promise<IGoogleReview> {
    const find = await this.reviewRepository.scope('details').findOne({
      where: { googleReviewId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Google review not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageGoogleReview, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      entityType: obj.entityType,
      entityId: obj.entityId,
      source: obj.source,
      googleReviewIdExt: obj.googleReviewIdExt || null,
      reviewerName: obj.reviewerName,
      reviewerRole: obj.reviewerRole || null,
      reviewerPhotoUrl: obj.reviewerPhotoUrl || null,
      rating: obj.rating,
      reviewText: obj.reviewText || null,
      reviewDate: obj.reviewDate,
      language: obj.language || 'en',
      isPublished: obj.isPublished,
      displayOrder: obj.displayOrder || 0,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.reviewRepository.create(createObj);
  }

  public async update(id: number, obj: IManageGoogleReview, cIp: string, adminId: number): Promise<void> {
    const find = await this.reviewRepository.findOne({ where: { googleReviewId: id } });
    if (!find) {
      throw new NotFoundException('Google review not found');
    }
    const updateObj = {
      entityType: obj.entityType,
      entityId: obj.entityId,
      source: obj.source,
      googleReviewIdExt: obj.googleReviewIdExt || null,
      reviewerName: obj.reviewerName,
      reviewerRole: obj.reviewerRole || null,
      reviewerPhotoUrl: obj.reviewerPhotoUrl || null,
      rating: obj.rating,
      reviewText: obj.reviewText || null,
      reviewDate: obj.reviewDate,
      language: obj.language || 'en',
      isPublished: obj.isPublished,
      displayOrder: obj.displayOrder || 0,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.reviewRepository.update(updateObj, { where: { googleReviewId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.reviewRepository.findOne({ where: { googleReviewId: id } });
    if (!find) {
      throw new NotFoundException('Google review not found');
    }
    await this.reviewRepository.update(
      { active, modifiedBy: adminId, modifiedIp: cIp },
      { where: { googleReviewId: id } },
    );
  }

  public async reply(id: number, body: IGoogleReviewReply, cIp: string, adminId: number): Promise<void> {
    const find = await this.reviewRepository.findOne({ where: { googleReviewId: id } });
    if (!find) {
      throw new NotFoundException('Google review not found');
    }
    await this.reviewRepository.update(
      {
        adminReply: body.adminReply,
        adminRepliedAt: new Date(),
        adminRepliedBy: adminId,
        modifiedBy: adminId,
        modifiedIp: cIp,
      },
      { where: { googleReviewId: id } },
    );
  }

  public async remove(id: number): Promise<void> {
    const find = await this.reviewRepository.findOne({ where: { googleReviewId: id } });
    if (!find) {
      throw new NotFoundException('Google review not found');
    }
    await this.reviewRepository.destroy({ where: { googleReviewId: id } });
  }

  public async findPublicByEntity(
    entityType: GoogleReviewEntityTypeEnum,
    entityId: number,
    page = 0,
    limit = 15,
  ): Promise<IPublicTableList<IPublicGoogleReview>> {
    const whereCondition: WhereOptions = {
      entityType,
      entityId,
      isPublished: true,
      active: true,
    } as any;

    const offset = page === 0 ? 0 : page * limit;

    const { rows, count } = await this.reviewRepository.findAndCountAll({
      where: whereCondition,
      order: [
        ['displayOrder', 'ASC'],
        ['reviewDate', 'DESC'],
      ],
      offset,
      limit,
      raw: true,
      nest: true,
    });

    const resList: IPublicGoogleReview[] = rows.map((r: any) => this.convertToPublic(r));
    return {
      tableData: resList,
      count,
    };
  }

  private convertToModel(item: any): IGoogleReview {
    return <IGoogleReview>{
      googleReviewId: Number(item.googleReviewId),
      entityType: item.entityType,
      entityId: Number(item.entityId),
      source: item.source,
      googleReviewIdExt: item.googleReviewIdExt,
      reviewerName: item.reviewerName,
      reviewerRole: item.reviewerRole,
      reviewerPhotoUrl: item.reviewerPhotoUrl,
      rating: item.rating,
      reviewText: item.reviewText,
      reviewDate: item.reviewDate,
      language: item.language,
      adminReply: item.adminReply,
      adminRepliedAt: item.adminRepliedAt,
      adminRepliedBy: item.adminRepliedBy,
      helpfulCount: item.helpfulCount,
      isPublished: item.isPublished,
      displayOrder: item.displayOrder,
      active: item.active,
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

  private convertToPublic(item: any): IPublicGoogleReview {
    return {
      googleReviewId: Number(item.googleReviewId),
      entityType: item.entityType,
      entityId: Number(item.entityId),
      reviewerName: item.reviewerName,
      reviewerRole: item.reviewerRole,
      reviewerPhotoUrl: item.reviewerPhotoUrl,
      rating: item.rating,
      reviewText: item.reviewText,
      reviewDate: item.reviewDate,
      language: item.language,
      adminReply: item.adminReply,
      adminRepliedAt: item.adminRepliedAt,
      helpfulCount: item.helpfulCount,
    };
  }
}
