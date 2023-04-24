import { Injectable } from '@nestjs/common';
import { MstBlogAuthor } from '../../../core/database/models/mst-blog-author.model';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../../common/exception.service';
import { IServerResponse } from '../../../common-dto/response-interface';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../../constants/config-constants';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import * as moment from 'moment';
import { CreateBlogAuthorDto } from '../dto/blog-author.dto';
import { IBlogAuthor } from '../../../response-interface/blog-author.interface';
import { DropdownListInterface } from '../../../response-interface/dropdown-list.interface';
import { Op } from 'sequelize';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class BlogAuthorService {
  constructor(
    @InjectModel(MstBlogAuthor) private readonly blogAuthorRepository: typeof MstBlogAuthor,
    private exceptionService: ExceptionService,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      let whereCondition: any = {};
      if (searchDto.name) {
        whereCondition = {
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${searchDto.name}%` } },
            { lastName: { [Op.iLike]: `%${searchDto.name}%` } },
          ],
        };
      }
      if (searchDto.active) {
        whereCondition['active'] = searchDto.active;
      }

      const dateFilter = SearchUtil.filterDateRange(searchDto.createdFrom, searchDto.createdTo);
      if (dateFilter) {
        whereCondition['createdAt'] = dateFilter;
      }
      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      let offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

      const { rows, count } = await this.blogAuthorRepository.findAndCountAll<MstBlogAuthor>({
        include: [
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
        order: [['firstName', 'ASC']],
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

      const resList: IBlogAuthor[] = [];
      for (const s of rows) {
        const iEvent: IBlogAuthor = {
          id: s.blogAuthorId,
          firstName: s.firstName,
          lastName: s.lastName,
          contactNumber: s.contactNumber,
          countryCode: s.countryCode,
          emailId: s.emailId,
          linkedUrl: s.linkedUrl,
          active: s.active,
          imagePath: CommonFunctionsUtil.getImagesObj(s.profilePicture),
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
      const find = await this.blogAuthorRepository.findOne({
        where: {
          blogAuthorId: id,
        },
      });
      if (find) {
        const dataObj = <IBlogAuthor>{
          id: find.blogAuthorId,
          firstName: find.firstName,
          lastName: find.lastName,
          contactNumber: find.contactNumber,
          countryCode: find.countryCode,
          emailId: find.emailId,
          linkedUrl: find.linkedUrl,
          imagePath: CommonFunctionsUtil.getImagesObj(find.profilePicture),
          active: find.active,
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

  public async create(obj: CreateBlogAuthorDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const createObj = {
        firstName: obj.firstName,
        lastName: obj.lastName,
        profilePicture: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        countryCode: obj.countryCode,
        contactNumber: obj.contactNumber,
        emailId: obj.emailId,
        linkedUrl: obj.linkedUrl,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const createdObj = await this.createInDB(createObj);
      if (createdObj) {
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS_DATA_UPDATE,
          data: null,
        };
      } else {
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
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

  public async update(id: number, obj: CreateBlogAuthorDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.blogAuthorRepository.findOne({
        where: {
          blogAuthorId: id,
        },
      });
      if (find) {
        const updateObj = {
          firstName: obj.firstName,
          lastName: obj.lastName,
          profilePicture: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
          countryCode: obj.countryCode,
          contactNumber: obj.contactNumber,
          emailId: obj.emailId,
          linkedUrl: obj.linkedUrl,
          active: obj.active != null ? obj.active : find.active,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_UPDATE,
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

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.blogAuthorRepository.findOne({
        where: {
          blogAuthorId: id,
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

  public async getBlogAuthorList(): Promise<DropdownListInterface[]> {
    const tempList = await this.blogAuthorRepository.findAll<MstBlogAuthor>({
      where: {
        active: true,
      },
      order: [
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
    });
    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.blogAuthorId,
        name: `${t.firstName} ${t.lastName}`,
        selected: false,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.blogAuthorRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.blogAuthorRepository
      .update(obj, { where: { blogAuthorId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
