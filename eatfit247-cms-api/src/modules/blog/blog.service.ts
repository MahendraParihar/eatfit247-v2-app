import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DB_DATE_FORMAT,
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
} from '../../constants/config-constants';
import { IBasicSearch, IManageBlog, ITableList, StringResource } from 'shared-lib';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import moment from 'moment';
import { Sequelize } from 'sequelize-typescript';
import { CommonService } from '../common/common.service';
import { TxnBlog } from '../../core/database/models/txn-blog.model';
import { IBlog } from 'shared-lib';
import { MstBlogCategory } from '../../core/database/models/mst-blog-category.model';
import { MstBlogAuthor } from '../../core/database/models/mst-blog-author.model';
import { CreateBlogDto } from './dto/blog.dto';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(TxnBlog) private readonly blogRepository: typeof TxnBlog,
    private sequelize: Sequelize,
    private commonService: CommonService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IBlog>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'title');
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.blogRepository.findAndCountAll<TxnBlog>({
      include: [
        {
          model: MstBlogCategory,
          required: true,
          as: 'BlogCategory',
        },
        {
          model: MstBlogAuthor,
          required: true,
          as: 'BlogAuthor',
        },
        {
          model: MstAdminUser,
          required: false,
          as: 'CreatedBy',
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
        },
        {
          model: MstAdminUser,
          required: false,
          as: 'ModifiedBy',
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
        },
      ],
      where: whereCondition,
      order: [['title', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IBlog[] = [];
    for (const s of rows) {
      const iEvent: IBlog = {
        id: s.blogId,
        title: s.title,
        blogCategoryId: s.blogCategoryId,
        blogCategory: s['BlogCategory']['blogCategory'],
        blogAuthorId: s.blogAuthorId,
        blogAuthor: `${s['BlogAuthor']['firstName']} ${s['BlogAuthor']['lastName']}`,
        description: s.description,
        isPublished: s.isPublished,
        writtenAt: s.writtenAt ? moment(s.writtenAt, DB_DATE_FORMAT).toDate() : null,
        isCommentAllow: s.isCommentAllow,
        isMailSentToSubscriber: s.isMailSentToSubscriber,
        visitedCount: s.visitedCount,
        shareCount: s.shareCount,
        tags: s.tags ? s.tags.split(', ') : null,
        url: s.url,
        active: s.active,
        imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }
    return <ITableList<IBlog>>{
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IBlog> {
    const find = await this.blogRepository.findOne({
      where: {
        blogId: id,
      },
      include: [
        {
          model: MstBlogCategory,
          required: true,
          as: 'BlogCategory',
        },
        {
          model: MstBlogAuthor,
          required: true,
          as: 'BlogAuthor',
        },
      ],
      raw: true,
      nest: true,
    });
    if (find) {
      return <IBlog>{
        id: find.blogId,
        title: find.title,
        blogCategoryId: find.blogCategoryId,
        blogCategory: find['BlogCategory']['blogCategory'],
        blogAuthorId: find.blogAuthorId,
        blogAuthor: `${find['BlogAuthor']['firstName']} ${find['BlogAuthor']['lastName']}`,
        description: find.description,
        isPublished: find.isPublished,
        isCommentAllow: find.isCommentAllow,
        isMailSentToSubscriber: find.isMailSentToSubscriber,
        visitedCount: find.visitedCount,
        shareCount: find.shareCount,
        writtenAt: find.writtenAt ? moment(find.writtenAt, DB_DATE_FORMAT).toDate() : null,
        tags: find.tags ? find.tags.split(', ') : null,
        url: find.url,
        active: find.active,
        imagePath: CommonFunctionsUtil.getImagesObj(find.imagePath),
        createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
    } else {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
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
      tags: obj.tags,
      url: CommonFunctionsUtil.removeSpecialChar(obj.title.toString().toLowerCase(), '-'),
      active: obj.active,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
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
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
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
      tags: obj.tags,
      active: obj.active,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.blogRepository.findOne({
      where: {
        blogId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      active: obj.active,
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
