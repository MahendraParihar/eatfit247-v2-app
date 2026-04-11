import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnBanner } from '../models';
import {
  IBanner,
  IBasicSearch,
  IManageBanner,
  IPublicBanner,
  IPublicTableList,
  ITableList,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil, TableListSortUtil } from '@server_1/core';

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(TxnBanner) private readonly bannerRepository: typeof TxnBanner,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch & { bannerFor?: string }): Promise<ITableList<IBanner>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'title');
    // Add bannerFor filter if provided
    if (searchDto.bannerFor) {
      whereCondition.bannerFor = searchDto.bannerFor;
    }
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.bannerRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: TableListSortUtil.orderFromAllowlist(
        searchDto,
        new Set(['bannerId', 'title', 'bannerFor', 'subTitle', 'active', 'createdAt', 'updatedAt']),
        [['createdAt', 'DESC']],
      ),
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IBanner[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  public async findAllPublic(searchDto: IBasicSearch & { bannerFor?: string }): Promise<IPublicTableList<IPublicBanner>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'title');
    // Add bannerFor filter if provided
    if (searchDto.bannerFor) {
      whereCondition.bannerFor = searchDto.bannerFor;
    }
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    // For public endpoints, don't use scope with includes to avoid issues with raw: true
    const { rows, count } = await this.bannerRepository.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IPublicBanner[] = rows.map((item: any) => {return this.convertToPublic(this.convertToModel(item));});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IBanner {
    return <IBanner>{
      bannerId: item.bannerId,
      id: item.bannerId,
      title: item.title,
      subTitle: item.subTitle,
      active: item.active,
      isInternalUrl: item.isInternalUrl,
      url: item.url,
      bannerFor: item.bannerFor,
      imagePosition: item.imagePosition,
      titleIcon: item.titleIcon,
      description: item.description,
      primaryActionText: item.primaryActionText,
      primaryActionUrl: item.primaryActionUrl,
      secondaryActionText: item.secondaryActionText,
      secondaryActionUrl: item.secondaryActionUrl,
      imagePath: CommonFunctionsUtil.buildImageUrl(item.imagePath),
      createdBy: item.createdBy,
      modifiedBy: item.updatedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser,
      updatedByUser: item.updatedByUser,
    };
  }

  /**
   * Convert IBanner to IPublicBanner by omitting internal/admin fields
   * Omits: createdBy, updatedBy, modifiedBy, createdAt, updatedAt, createdIp, updatedIp, modifiedIp, active, createdByUser, updatedByUser
   */
  private convertToPublic(banner: IBanner): IPublicBanner {
    const { createdBy, modifiedBy, createdAt, updatedAt, active, createdByUser, updatedByUser, ...publicBanner } = banner;
    return publicBanner as IPublicBanner;
  }

  public async fetchById(id: number): Promise<IBanner> {
    const find = await this.bannerRepository.scope('details').findOne({
      where: { bannerId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Banner not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageBanner, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      title: obj.title,
      subTitle: obj.subTitle || null,
      active: obj.active,
      bannerFor: obj.bannerFor,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      createdBy: adminId,
      updatedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.bannerRepository.create(createObj);
  }

  public async update(id: number, obj: IManageBanner, cIp: string, adminId: number): Promise<void> {
    const find = await this.bannerRepository.findOne({
      where: { bannerId: id },
    });
    if (!find) {
      throw new NotFoundException('Banner not found');
    }
    const updateObj = {
      title: obj.title,
      subTitle: obj.subTitle || null,
      active: obj.active,
      bannerFor: obj.bannerFor,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      updatedBy: adminId,
      modifiedIp: cIp,
    };
    await this.bannerRepository.update(updateObj, { where: { bannerId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.bannerRepository.findOne({
      where: { bannerId: id },
    });
    if (!find) {
      throw new NotFoundException('Banner not found');
    }
    const updateObj = {
      active: active,
      updatedBy: adminId,
      modifiedIp: cIp,
    };
    await this.bannerRepository.update(updateObj, { where: { bannerId: id } });
  }
}
