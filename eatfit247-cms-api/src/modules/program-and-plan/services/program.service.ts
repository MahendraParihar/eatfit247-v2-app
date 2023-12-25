import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as moment from 'moment/moment';
import { Sequelize } from 'sequelize-typescript';
import { MstProgram } from '../../../core/database/models/mst-program.model';
import { MstProgramCategory } from '../../../core/database/models/mst-program-category.model';
import { ExceptionService } from '../../common/exception.service';
import { CommonService } from '../../common/common.service';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { IServerResponse } from '../../../common-dto/response-interface';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../../constants/config-constants';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { IProgram } from '../../../response-interface/program.interface';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import { CreateProgramDto } from '../dto/program.dto';
import { DropdownListInterface } from '../../../response-interface/dropdown-list.interface';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class ProgramService {
  constructor(
    @InjectModel(MstProgram) private readonly programRepository: typeof MstProgram,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
    private commonService: CommonService,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'program');

      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

      const { rows, count } = await this.programRepository.findAndCountAll<MstProgram>({
        include: [
          {
            model: MstProgramCategory,
            required: true,
            as: 'ProgramCategory',
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
        order: [
          ['programCategoryId', 'ASC'],
          ['sequenceNumber', 'ASC'],
        ],
        offset: offset,
        limit: pageSize,
        raw: true,
        nest: true,
      });
      if (!rows) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      } else if (rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      }

      const resList: IProgram[] = [];
      for (const s of rows) {
        const iEvent: IProgram = {
          id: s.programId,
          title: s.program,
          programCategoryId: s.programCategoryId,
          programCategory: s['ProgramCategory']['programCategory'],
          details: s.details,
          idealFor: s.idealFor ? s.idealFor.split(', ') : null,
          punchLine: s.punchLine,
          sequenceNumber: s.sequenceNumber,
          isSpecialProgram: s.isSpecialProgram,
          videoUrl: s.videoUrl,
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
      this.exceptionService.logError(e);
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
      const find = await this.programRepository.findOne({
        where: {
          programId: id,
        },
        include: [
          {
            model: MstProgramCategory,
            required: true,
            as: 'ProgramCategory',
          },
        ],
        raw: true,
        nest: true,
      });
      if (find) {
        const dataObj = <IProgram>{
          id: find.programId,
          title: find.program,
          programCategoryId: find.programCategoryId,
          programCategory: find['ProgramCategory']['programCategory'],
          details: find.details,
          idealFor: find.idealFor ? find.idealFor.split(', ') : null,
          punchLine: find.punchLine,
          sequenceNumber: find.sequenceNumber,
          isSpecialProgram: find.isSpecialProgram,
          videoUrl: find.videoUrl,
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
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async create(obj: CreateProgramDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const createObj = {
        program: obj.title,
        programCategoryId: obj.programCategoryId,
        details: obj.details,
        idealFor: obj.idealFor,
        punchLine: obj.punchLine,
        sequenceNumber: obj.sequenceNumber,
        isSpecialProgram: obj.isSpecialProgram,
        videoUrl: obj.videoUrl,
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
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async update(id: number, obj: CreateProgramDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const find = await this.programRepository.findOne({
        where: {
          programId: id,
        },
      });
      if (find) {
        const updateObj = {
          program: obj.title,
          programCategoryId: obj.programCategoryId,
          details: obj.details,
          idealFor: obj.idealFor,
          punchLine: obj.punchLine,
          sequenceNumber: obj.sequenceNumber,
          videoUrl: obj.videoUrl,
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

      this.exceptionService.logError(e);
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
      const find = await this.programRepository.findOne({
        where: {
          programId: id,
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
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async getPaymentList(): Promise<DropdownListInterface[]> {
    const tempList = await this.programRepository.findAll<MstProgram>({
      where: {
        active: true,
      },
    });

    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.programId,
        name: t.program,
        selected: false,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.programRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.programRepository
      .update(obj, { where: { programId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
