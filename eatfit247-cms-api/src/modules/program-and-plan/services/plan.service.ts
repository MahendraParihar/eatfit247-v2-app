import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as moment from 'moment/moment';
import { Sequelize } from 'sequelize-typescript';
import { ExceptionService } from '../../common/exception.service';
import { MstProgramPlan } from '../../../core/database/models/mst-program-plan.model';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { IServerResponse } from '../../../common-dto/response-interface';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../../constants/config-constants';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import { CreatePlanDto } from '../dto/plan.dto';
import { IPlanFees, IProgramPlan } from '../../../response-interface/program-plan.interface';
import { DropdownListInterface } from '../../../response-interface/dropdown-list.interface';
import { MstProgramPlanType } from '../../../core/database/models/mst-program-plan-type.model';
import { ICreateUpdate } from '../../../response-interface/lov.interface';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class PlanService {
  constructor(
    @InjectModel(MstProgramPlan) private readonly programRepository: typeof MstProgramPlan,
    @InjectModel(MstProgramPlanType) private readonly programPlanTypeRepository: typeof MstProgramPlanType,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'plan');

      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      let offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

      const { rows, count } = await this.programRepository.findAndCountAll<MstProgramPlan>({
        include: [
          {
            model: MstProgramPlanType,
            required: true,
            as: 'ProgramPlanType',
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
        order: [['sequenceNumber', 'ASC']],
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

      const resList: IProgramPlan[] = [];
      for (const s of rows) {
        resList.push(this.convertProgramPlanDBObject(s));
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
      const find = await this.findById(id);
      if (find) {
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: this.convertProgramPlanDBObject(find),
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

  public async findById(id: number): Promise<MstProgramPlan> {
    return await this.programRepository.findOne<MstProgramPlan>({
      include: [
        {
          model: MstProgramPlanType,
          required: true,
          as: 'ProgramPlanType',
        },
      ],
      where: {
        programPlanId: id,
      },
      raw: true,
      nest: true,
    });
  }

  public async create(obj: CreatePlanDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const createObj = {
        plan: obj.title,
        details: obj.details,
        inrAmount: obj.inrAmount,
        noOfCycle: obj.noOfCycle,
        programPlanTypeId: obj.programPlanTypeId,
        isOnline: obj.isOnline,
        isVisibleOnWeb: obj.isVisibleOnWeb,
        noOfDaysInCycle: obj.noOfDaysInCycle,
        sequenceNumber: obj.sequenceNumber,
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

  public async update(id: number, obj: CreatePlanDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const find = await this.programRepository.findOne({
        where: {
          programPlanId: id,
        },
      });
      if (find) {
        const updateObj = {
          plan: obj.title,
          details: obj.details,
          inrAmount: obj.inrAmount,
          noOfCycle: obj.noOfCycle,
          programPlanTypeId: obj.programPlanTypeId,
          isOnline: obj.isOnline,
          isVisibleOnWeb: obj.isVisibleOnWeb,
          noOfDaysInCycle: obj.noOfDaysInCycle,
          sequenceNumber: obj.sequenceNumber,
          tags: obj.tags,
          url: CommonFunctionsUtil.removeSpecialChar(obj.title.toString().toLowerCase(), '-'),
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
          programPlanId: id,
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

  public async getProgramPlanTypeList(): Promise<DropdownListInterface[]> {
    const tempList = await this.programPlanTypeRepository.findAll<MstProgramPlanType>({
      where: {
        active: true,
      },
      raw: true,
      order: [['programPlanType', 'ASC']],
    });
    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.programPlanTypeId,
        name: t.programPlanType,
        selected: false,
      });
    }
    return list;
  }

  public async getProgramPlanList(): Promise<IPlanFees[]> {
    const tempList = await this.programRepository.findAll<MstProgramPlan>({
      where: {
        active: true,
      },
      order: [['noOfCycle', 'asc'], ['noOfDaysInCycle', 'asc'], ['inr_amount', 'asc']],
      raw: true,
    });
    const list: IPlanFees[] = [];
    for (const s of tempList) {
      list.push(<IPlanFees>{
        id: s.programPlanId,
        title: `${s.plan} (INR ${s.inrAmount} - ${s.isOnline ? 'OnLine' : 'Personal'})`,
        inrAmount: s.inrAmount,
        noOfCycle: s.noOfCycle,
        noOfDaysInCycle: s.noOfDaysInCycle,
        isOnline: s.isOnline,
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
      .update(obj, { where: { programPlanId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private convertProgramPlanDBObject(obj: MstProgramPlan): IProgramPlan {
    return <IProgramPlan>(<ICreateUpdate>{
      id: obj.programPlanId,
      title: obj.plan,
      details: obj.details,
      inrAmount: obj.inrAmount,
      noOfCycle: obj.noOfCycle,
      programPlanTypeId: obj.programPlanTypeId,
      programPlanType: obj['ProgramPlanType']['programPlanType'],
      isOnline: obj.isOnline,
      isVisibleOnWeb: obj.isVisibleOnWeb,
      noOfDaysInCycle: obj.noOfDaysInCycle,
      sequenceNumber: obj.sequenceNumber,
      tags: obj.tags ? obj.tags.split(', ') : null,
      url: obj.url,
      active: obj.active,
      imagePath: CommonFunctionsUtil.getImagesObj(obj.imagePath),
      createdBy: CommonFunctionsUtil.getAdminShortInfo(obj['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(obj['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(obj.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(obj.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    });
  }
}
