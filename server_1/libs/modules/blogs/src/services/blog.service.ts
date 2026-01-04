import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnBlog } from '../models';
import { ConfigParam, IBasicSearch, IBlog, IManageBlog, ITableList } from '@eatfit247-shared-lib';
import {
  AppConfigService,
  CommonFunctionsUtil,
  DB_DATE_FORMAT,
  DEFAULT_DATE_FORMAT,
  SearchUtil,
} from '@server_1/core';
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
        metaTitle: find.metaTitle,
        metaDescription: find.metaDescription,
        tags: find.tags,
        url: find.url,
      },
      active: find.active,
      createdBy: find.createdBy,
      updatedBy: find.modifiedBy,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        find.imagePath,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
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
      tags: obj.seo ? obj.seo.tags : null,
      metaTitle: obj.seo ? obj.seo.metaTitle : null,
      metaDescription: obj.seo ? obj.seo.metaDescription : null,
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
      tags: obj.seo ? obj.seo.tags : null,
      metaTitle: obj.seo ? obj.seo.metaTitle : null,
      metaDescription: obj.seo ? obj.seo.metaDescription : null,
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
