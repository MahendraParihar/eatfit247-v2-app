import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstBlogCategory } from '../models';
import {
  ConfigParam,
  IBasicSearch,
  IBlogCategory,
  IManageBlogCategory,
  IStatusChange,
  ITableList,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class BlogCategoryService {
  constructor(
    @InjectModel(MstBlogCategory) private readonly blogCategoryRepository: typeof MstBlogCategory,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IBlogCategory>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'blogCategory');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.blogCategoryRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['blogCategory', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IBlogCategory {
    return <IBlogCategory>{
      blogCategoryId: item.blogCategoryId,
      id: item.blogCategoryId,
      blogCategory: item.blogCategory,
      url: item.url,
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

  public async fetchAll(): Promise<MstBlogCategory[]> {
    return await this.blogCategoryRepository.scope('list').findAll({
      where: { active: true },
      order: [['blogCategory', 'ASC']],
      raw: true,
      nest: true,
    });
  }

  public async fetchById(id: number): Promise<IBlogCategory> {
    const find = await this.blogCategoryRepository.scope('details').findOne({
      where: { blogCategoryId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Blog category not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageBlogCategory, requestedIp: string, userId: number): Promise<void> {
    const dataObj: any = {
      blogCategory: obj.blogCategory,
      url: obj.url || CommonFunctionsUtil.removeSpecialChar(obj.blogCategory),
      active: obj.active,
      imagePath: obj.imagePath ? obj.imagePath : null,
      createdBy: userId,
      modifiedBy: userId,
      createdIp: requestedIp,
      modifiedIp: requestedIp,
    };
    await this.blogCategoryRepository.create(dataObj);
  }

  public async update(id: number, obj: IManageBlogCategory, requestedIp: string, userId: number): Promise<void> {
    const find = await this.blogCategoryRepository.findOne({ where: { blogCategoryId: id } });
    if (!find) {
      throw new NotFoundException('Blog category not found');
    }
    const dataObj: any = {
      blogCategory: obj.blogCategory,
      url: obj.url || CommonFunctionsUtil.removeSpecialChar(obj.blogCategory),
      active: obj.active,
      imagePath: obj.imagePath ? obj.imagePath : null,
      modifiedBy: userId,
      modifiedIp: requestedIp,
    };
    await this.blogCategoryRepository.update(dataObj, { where: { blogCategoryId: id } });
  }

  public async changeStatus(id: number, body: IStatusChange, requestedIp: string, userId: number): Promise<void> {
    const find = await this.blogCategoryRepository.findOne({ where: { blogCategoryId: id } });
    if (!find) {
      throw new NotFoundException('Blog category not found');
    }
    await this.blogCategoryRepository.update(
      {
        active: body.active,
        modifiedBy: userId,
        modifiedIp: requestedIp,
      },
      { where: { blogCategoryId: id } },
    );
  }
}

