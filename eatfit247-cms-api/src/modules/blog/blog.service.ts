import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../common/exception.service';
import { BasicSearchDto, UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { IServerResponse } from '../../common-dto/response-interface';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DB_DATE_FORMAT,
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
  IS_DEV,
} from '../../constants/config-constants';
import { ServerResponseEnum } from '../../enums/server-response-enum';
import { StringResource } from '../../enums/string-resource';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import * as moment from 'moment/moment';
import { Sequelize } from 'sequelize-typescript';
import { CommonService } from '../common/common.service';
import { TxnBlog } from '../../core/database/models/txn-blog.model';
import { IBlog } from '../../response-interface/blog.interface';
import { MstBlogCategory } from '../../core/database/models/mst-blog-category.model';
import { MstBlogAuthor } from '../../core/database/models/mst-blog-author.model';
import { CreateBlogDto } from './dto/blog.dto';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(TxnBlog) private readonly blogRepository: typeof TxnBlog,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
    private commonService: CommonService,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
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
      if (!rows || rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      }

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
          writtenAt: s.writtenAt ? moment(s.writtenAt, DB_DATE_FORMAT) : null,
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

      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
          list: resList,
          count: count,
        },
      };

      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async fetchById(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
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
        const dataObj = <IBlog>{
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
          writtenAt: find.writtenAt ? moment(find.writtenAt, DB_DATE_FORMAT) : null,
          tags: find.tags ? find.tags.split(', ') : null,
          url: find.url,
          active: find.active,
          imagePath: CommonFunctionsUtil.getImagesObj(find.imagePath),
          createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
          createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
        };

        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: dataObj,
        };
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async create(obj: CreateBlogDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
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
      const createdObj = await this.createInDB(createObj);

      if (createdObj) {
        await t.commit();
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS_DATA_UPDATE,
          data: null,
        };
      } else {
        await t.rollback();
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null,
        };
      }
      return res;
    } catch (e) {
      await t.rollback();
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async update(id: number, obj: CreateBlogDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const find = await this.blogRepository.findOne({
        where: {
          blogId: id,
        },
      });
      if (find) {
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
        const updatedObj = await this.updateInDB(id, updateObj);

        if (updatedObj) {
          await t.commit();
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_UPDATE,
            data: null,
          };
        } else {
          await t.rollback();
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      await t.rollback();

      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.blogRepository.findOne({
        where: {
          blogId: id,
        },
      });
      if (find) {
        const updateObj = {
          active: obj.active,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_STATUS_CHANGE,
            data: null,
          };
        } else {
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  private async createInDB(obj: any) {
    return await this.blogRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.blogRepository
      .update(obj, { where: { blogId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
