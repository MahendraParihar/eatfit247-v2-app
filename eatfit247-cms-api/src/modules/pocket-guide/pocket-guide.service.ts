import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../common/exception.service';
import { BasicSearchDto, UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { IServerResponse } from '../../common-dto/response-interface';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../constants/config-constants';
import { ServerResponseEnum } from '../../enums/server-response-enum';
import { StringResource } from '../../enums/string-resource';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import * as moment from 'moment/moment';
import { CreatePocketGuideDto } from './dto/pocket-guide.dto';
import { MstPocketGuide } from '../../core/database/models/mst-pocket-guide.model';
import { IPocketGuide } from '../../response-interface/pocket-guide.interface';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class PocketGuideService {
  constructor(
    @InjectModel(MstPocketGuide) private readonly pocketGuideRepository: typeof MstPocketGuide,
    private exceptionService: ExceptionService,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'pocketGuide');

      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      let offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

      const { rows, count } = await this.pocketGuideRepository.findAndCountAll<MstPocketGuide>({
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
        order: [['pocketGuide', 'ASC']],
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

      const resList: IPocketGuide[] = [];
      for (const s of rows) {
        const iEvent: IPocketGuide = {
          id: s.pocketGuideId,
          name: s.pocketGuide,
          description: s.description,
          active: s.active,
          imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
          filePath: CommonFunctionsUtil.getImagesObj(s.filePath),
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
      const find = await this.pocketGuideRepository.findOne({
        where: {
          pocketGuideId: id,
        },
      });
      if (find) {
        const dataObj = <IPocketGuide>{
          id: find.pocketGuideId,
          name: find.pocketGuide,
          description: find.description,
          active: find.active,
          imagePath: CommonFunctionsUtil.getImagesObj(find.imagePath),
          filePath: CommonFunctionsUtil.getImagesObj(find.filePath),
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

  public async create(obj: CreatePocketGuideDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const createObj = {
        pocketGuide: obj.name,
        description: obj.description,
        imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        filePath: obj.uploadAttachment && obj.uploadAttachment.length > 0 ? obj.uploadAttachment : null,
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

  public async update(id: number, obj: CreatePocketGuideDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.pocketGuideRepository.findOne({
        where: {
          pocketGuideId: id,
        },
      });
      if (find) {
        const updateObj = {
          pocketGuide: obj.name,
          description: obj.description,
          imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
          filePath: obj.uploadAttachment && obj.uploadAttachment.length > 0 ? obj.uploadAttachment : null,
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
      const find = await this.pocketGuideRepository.findOne({
        where: {
          pocketGuideId: id,
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
    return await this.pocketGuideRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.pocketGuideRepository
      .update(obj, { where: { pocketGuideId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
