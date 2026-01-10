import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnSuccessStories } from '../models';
import { IBasicSearch, IManageSuccessStory, ISuccessStory, ITableList } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';

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
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.successStoryRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
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
      imagePath: CommonFunctionsUtil.buildImageUrl(item.imagePath),
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
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
    const createObj = {
      name: obj.name,
      title: obj.title ? obj.title : null,
      date: obj.date,
      description: obj.description,
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : [],
      active: obj.active,
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
    const updateObj = {
      name: obj.name,
      title: obj.title,
      date: obj.date,
      description: obj.description,
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : [],
      active: obj.active,
      updatedBy: adminId,
      modifiedIp: cIp,
    };
    await this.successStoryRepository.update(updateObj, { where: { successStoryId: id } });
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

