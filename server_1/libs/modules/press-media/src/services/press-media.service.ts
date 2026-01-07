import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnPressMedia } from '../models';
import { ConfigParam, IBasicSearch, IManagePressMedia, IPressMedia, ITableList, IPublicPressMedia, IPublicTableList } from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class PressMediaService {
  constructor(
    @InjectModel(TxnPressMedia) private readonly pressMediaRepository: typeof TxnPressMedia,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IPressMedia>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'title');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.pressMediaRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IPressMedia[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  /**
   * Public method to fetch all active press media items
   */
  public async findAllPublic(searchDto: IBasicSearch & { type?: 'youtube' | 'press'; active?: boolean }): Promise<IPublicTableList<IPublicPressMedia>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'title');
    // Only show active press media for public
    whereCondition.active = searchDto.active !== undefined ? searchDto.active : true;
    
    // Filter by type if provided
    if (searchDto.type) {
      whereCondition.type = searchDto.type;
    }
    
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    // For public endpoints, don't use scope with includes to avoid issues with raw: true
    const { rows, count } = await this.pressMediaRepository.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IPublicPressMedia[] = rows.map((item: any) => {return this.convertToPublic(this.convertToModel(item));});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IPressMedia {
    return <IPressMedia>{
      pressMediaId: item.pressMediaId,
      id: item.pressMediaId,
      title: item.title,
      type: item.type as 'youtube' | 'press',
      link: item.link,
      active: item.active,
      imagePath: CommonFunctionsUtil.buildImageUrl(item.imagePath),
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser,
      updatedByUser: item.updatedByUser,
    };
  }

  /**
   * Convert IPressMedia to IPublicPressMedia by omitting internal/admin fields
   * Omits: createdBy, updatedBy, modifiedBy, createdAt, updatedAt, createdIp, updatedIp, modifiedIp, active, createdByUser, updatedByUser
   */
  private convertToPublic(pressMedia: IPressMedia): IPublicPressMedia {
    const { createdBy, updatedBy, createdAt, updatedAt, active, createdByUser, updatedByUser, ...publicPressMedia } = pressMedia;
    return publicPressMedia as IPublicPressMedia;
  }

  public async fetchById(id: number): Promise<IPressMedia> {
    const find = await this.pressMediaRepository.scope('details').findOne({
      where: { pressMediaId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Press media not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManagePressMedia, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      title: obj.title || null,
      type: obj.type,
      link: obj.link,
      active: obj.active,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.pressMediaRepository.create(createObj);
  }

  public async update(id: number, obj: IManagePressMedia, cIp: string, adminId: number): Promise<void> {
    const find = await this.pressMediaRepository.findOne({
      where: { pressMediaId: id },
    });
    if (!find) {
      throw new NotFoundException('Press media not found');
    }
    const updateObj = {
      title: obj.title || null,
      type: obj.type,
      link: obj.link,
      active: obj.active,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.pressMediaRepository.update(updateObj, { where: { pressMediaId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.pressMediaRepository.findOne({
      where: { pressMediaId: id },
    });
    if (!find) {
      throw new NotFoundException('Press media not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.pressMediaRepository.update(updateObj, { where: { pressMediaId: id } });
  }

  /**
   * Check if a YouTube video link already exists in the database
   * @param link - The YouTube video link to check
   * @returns true if link exists, false otherwise
   */
  public async linkExists(link: string): Promise<boolean> {
    const existing = await this.pressMediaRepository.findOne({
      where: { link: link },
    });
    return !!existing;
  }

  /**
   * Save YouTube video if link doesn't exist
   * @param title - Video title
   * @param link - YouTube video link
   * @param cIp - IP address
   * @param adminId - Admin user ID
   * @returns true if saved, false if skipped (already exists)
   */
  public async saveYouTubeVideoIfNotExists(
    title: string,
    link: string,
    cIp: string,
    adminId: number,
  ): Promise<boolean> {
    const exists = await this.linkExists(link);
    if (exists) {
      return false; // Link already exists, skip
    }
    const createObj = {
      title: title || null,
      type: 'youtube' as const,
      link: link,
      active: true,
      imagePath: null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.pressMediaRepository.create(createObj);
    return true; // Successfully saved
  }
}

