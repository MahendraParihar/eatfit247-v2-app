import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnBanner } from '../models';
import { ConfigParam, IBanner, IBasicSearch, IManageBanner, ITableList } from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

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
      order: [['createdAt', 'DESC']],
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
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser,
      updatedByUser: item.updatedByUser,
    };
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
