import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnBlog } from '../models';
import {
  DB_DATE_FORMAT,
  DEFAULT_DATE_FORMAT,
  IBasicSearch,
  IBlog,
  IManageBlog,
  IPublicBlog,
  IPublicTableList,
  ITableList,
} from '@eatfit247-shared-lib';
import { AppConfigService, BasicSearchDto, CommonFunctionsUtil, SearchUtil } from '@server_1/core';
import moment from 'moment';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(TxnBlog) private readonly blogRepository: typeof TxnBlog,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IBlog>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'title');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.blogRepository.scope('list').findAndCountAll<TxnBlog>({
      where: whereCondition,
      order: [['title', 'ASC']],
      offset: offset,
      limit: pageSize,
      nest: true,
    });
    const resList: IBlog[] = [];
    for (const s of rows) {
      resList.push(this.convertToModel(s));
    }
    return <ITableList<IBlog>>{
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IBlog> {
    const find = await this.blogRepository.scope('details').findOne({
      where: {
        blogId: id,
      },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Blog not found');
    }
    return this.convertToModel(find);
  }

  /**
   * Public method to fetch all published and active blogs
   */
  public async findAllPublic(searchDto: BasicSearchDto): Promise<IPublicTableList<IPublicBlog>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'title');
    // Only show published and active blogs for public
    whereCondition.isPublished = true;
    whereCondition.active = true;
    // Filter by blogCategoryId if provided (from query parameters)
    if (searchDto.blogCategoryId) {
      whereCondition.blogCategoryId = searchDto.blogCategoryId;
    }
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.blogRepository.scope('list').findAndCountAll<TxnBlog>({
      where: whereCondition,
      order: [['writtenAt', 'DESC'], ['createdAt', 'DESC']], // Order by written date, then created date
      offset: offset,
      limit: pageSize,
      nest: true,
    });
    const resList: IPublicBlog[] = [];
    for (const s of rows) {
      resList.push(this.convertToPublic(this.convertToModel(s)));
    }
    return <IPublicTableList<IPublicBlog>>{
      tableData: resList,
      count: count,
    };
  }

  /**
   * Public method to fetch a published and active blog by ID
   */
  public async fetchByIdPublic(id: number): Promise<IPublicBlog> {
    const find = await this.blogRepository.scope('details').findOne({
      where: {
        blogId: id,
        isPublished: true,
        active: true,
      },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Blog not found');
    }
    return this.convertToPublic(this.convertToModel(find));
  }

  /**
   * Public method to fetch a published and active blog by URL (slug)
   */
  public async fetchByUrlPublic(url: string): Promise<IPublicBlog> {
    const find = await this.blogRepository.scope('details').findOne({
      where: {
        url: url,
        isPublished: true,
        active: true,
      },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Blog not found');
    }
    return this.convertToPublic(this.convertToModel(find));
  }

  private convertToModel(find: TxnBlog) {
    return <IBlog>{
      blogId: find.blogId,
      title: find.title,
      blogCategoryId: find.blogCategoryId,
      blogCategory: find.blogCategory?.blogCategory || null,
      blogAuthorId: find.blogAuthorId,
      blogAuthor: find.blogAuthor
        ? `${find.blogAuthor.firstName} ${find.blogAuthor.lastName}`
        : null,
      description: find.description,
      isPublished: find.isPublished,
      isCommentAllow: find.isCommentAllow,
      isMailSentToSubscriber: find.isMailSentToSubscriber,
      visitedCount: find.visitedCount,
      shareCount: find.shareCount,
      writtenAt: find.writtenAt ? moment(find.writtenAt, DB_DATE_FORMAT).toDate() : null,
      seo: {
        url: find.url,
      },
      active: find.active,
      createdBy: find.createdBy,
      modifiedBy: find.modifiedBy,
      imagePath: CommonFunctionsUtil.buildImageUrl(find.imagePath),
      createdAt: find.createdAt,
      updatedAt: find.updatedAt,
      createdByUser: find.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(find.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: find.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(find.updatedByUser, 'updatedByUser')
        : undefined,
    };
  }

  /**
   * Convert IBlog to IPublicBlog by omitting internal/admin fields
   * Omits: createdBy, updatedBy, modifiedBy, createdAt, updatedAt, createdIp, updatedIp, modifiedIp, active, createdByUser, updatedByUser
   */
  private convertToPublic(blog: IBlog): IPublicBlog {
    const { createdBy, modifiedBy, createdAt, updatedAt, active, createdByUser, updatedByUser, ...publicBlog } = blog;
    return publicBlog as IPublicBlog;
  }

  public async create(obj: IManageBlog, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      title: obj.title,
      blogCategoryId: obj.blogCategoryId,
      blogAuthorId: obj.blogAuthorId,
      description: obj.description,
      isPublished: obj.isPublished,
      isCommentAllow: obj.isCommentAllow,
      isMailSentToSubscriber: obj.isMailSentToSubscriber,
      visitedCount: 0,
      shareCount: 0,
      writtenAt: obj.writtenAt ? moment(obj.writtenAt) : null,
      url: obj.seo
        ? obj.seo.url
        : CommonFunctionsUtil.removeSpecialChar(obj.title.toString().toLowerCase(), '-'),
      active: true,
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(id: number, obj: IManageBlog, cIp: string, adminId: number): Promise<void> {
    const find = await this.blogRepository.findOne({
      where: {
        blogId: id,
      },
    });
    if (!find) {
      throw new NotFoundException('Blog not found');
    }
    const updateObj = {
      title: obj.title,
      blogCategoryId: obj.blogCategoryId,
      blogAuthorId: obj.blogAuthorId,
      description: obj.description,
      isPublished: obj.isPublished,
      isCommentAllow: obj.isCommentAllow,
      isMailSentToSubscriber: obj.isMailSentToSubscriber,
      writtenAt: obj.writtenAt ? moment(obj.writtenAt, DEFAULT_DATE_FORMAT) : null,
      url: obj.seo
        ? obj.seo.url
        : CommonFunctionsUtil.removeSpecialChar(obj.title.toString().toLowerCase(), '-'),
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.blogRepository.findOne({
      where: {
        blogId: id,
      },
    });
    if (!find) {
      throw new NotFoundException('Blog not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  private async createInDB(obj: any) {
    return await this.blogRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.blogRepository.update(obj, { where: { blogId: id } });
  }
}
