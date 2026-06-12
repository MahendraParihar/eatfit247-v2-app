import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnSuccessStories } from '../models';
import { IBasicSearch, IManageSuccessStory, ISuccessStory, ITableList } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil, TableListSortUtil } from '@server_1/core';

@Injectable()
export class SuccessStoryService {
  constructor(
    @InjectModel(TxnSuccessStories) private readonly successStoryRepository: typeof TxnSuccessStories,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ISuccessStory>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');
    // Filter by active status if provided
    if (searchDto.active !== undefined) {
      whereCondition.active = searchDto.active;
    }
    if (searchDto.showOnWebsite !== undefined && searchDto.showOnWebsite !== null) {
      whereCondition.showOnWebsite = searchDto.showOnWebsite;
    }
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.successStoryRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: TableListSortUtil.orderFromAllowlist(
        searchDto,
        new Set([
          'successStoryId',
          'name',
          'title',
          'date',
          'active',
          'showOnWebsite',
          'sequence',
          'createdAt',
          'updatedAt',
        ]),
        [
          ['sequence', 'ASC'],
          ['date', 'DESC'],
          ['name', 'ASC'],
        ],
      ),
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: ISuccessStory[] = rows.map((item: any) => {
      return this.convertToModel(item);
    });
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): ISuccessStory {
    return <ISuccessStory>{
      successStoryId: item.successStoryId,
      id: item.successStoryId,
      name: item.name,
      title: item.title,
      date: item.date,
      description: item.description,
      mediaType: item.mediaType,
      imagePath: CommonFunctionsUtil.buildImageUrl(item.imagePath),
      youtubeUrl: item.youtubeUrl,
      active: item.active,
      showOnWebsite: item.showOnWebsite,
      sequence: item.sequence,
      createdBy: item.createdBy,
      modifiedBy: item.updatedBy,
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

  public async fetchById(id: number): Promise<ISuccessStory> {
    const find = await this.successStoryRepository.scope('details').findOne({
      where: { successStoryId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Success story not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageSuccessStory, cIp: string, adminId: number): Promise<void> {
    const { imagePath, youtubeUrl } = this.resolveMediaFields(obj);
    const createObj = {
      name: obj.name,
      title: obj.title || null,
      date: obj.date,
      description: obj.description,
      mediaType: obj.mediaType,
      imagePath,
      youtubeUrl,
      active: obj.active,
      showOnWebsite: obj.showOnWebsite,
      sequence: obj.sequence ?? 0,
      createdBy: adminId,
      updatedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.successStoryRepository.create(createObj);
  }

  public async update(id: number, obj: IManageSuccessStory, cIp: string, adminId: number): Promise<void> {
    const find = await this.successStoryRepository.findOne({
      where: { successStoryId: id },
    });
    if (!find) {
      throw new NotFoundException('Success story not found');
    }
    const { imagePath, youtubeUrl } = this.resolveMediaFields(obj);
    const updateObj = {
      name: obj.name,
      title: obj.title,
      date: obj.date,
      description: obj.description,
      mediaType: obj.mediaType,
      imagePath,
      youtubeUrl,
      active: obj.active,
      showOnWebsite: obj.showOnWebsite,
      sequence: obj.sequence ?? 0,
      updatedBy: adminId,
      modifiedIp: cIp,
    };
    await this.successStoryRepository.update(updateObj, { where: { successStoryId: id } });
  }

  private resolveMediaFields(obj: IManageSuccessStory): { imagePath: any; youtubeUrl: string | null } {
    if (obj.mediaType === 'youtube') {
      const link = obj.youtubeUrl?.trim();
      if (!link) {
        throw new BadRequestException('YouTube URL is required when media type is youtube');
      }
      return { imagePath: null, youtubeUrl: link };
    }
    if (!obj.imagePath || obj.imagePath.length === 0) {
      throw new BadRequestException(`A ${obj.mediaType} upload is required`);
    }
    return { imagePath: obj.imagePath, youtubeUrl: null };
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.successStoryRepository.findOne({
      where: { successStoryId: id },
    });
    if (!find) {
      throw new NotFoundException('Success story not found');
    }
    const updateObj = {
      active: active,
      updatedBy: adminId,
      modifiedIp: cIp,
    };
    await this.successStoryRepository.update(updateObj, { where: { successStoryId: id } });
  }
}

