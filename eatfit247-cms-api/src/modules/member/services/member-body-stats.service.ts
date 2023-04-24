import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../../common/exception.service';
import { Sequelize } from 'sequelize-typescript';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { IServerResponse } from '../../../common-dto/response-interface';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DB_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
  IS_DEV,
} from '../../../constants/config-constants';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import * as moment from 'moment';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import { TxnMemberHealthParameter } from '../../../core/database/models/txn-member-health-parameter.model';
import { TxnMemberHealthParameterLog } from '../../../core/database/models/txn-member-health-parameter-log.model';
import {
  IMemberHealthParameter,
  IMemberHealthParameterLog,
} from '../../../response-interface/member-health-parameter.interface';
import { CreateHealthParameterLogDto } from '../dto/member-health-parameter-log.dto';
import { HealthParameterService } from '../../lov/services/health-parameter.service';
import * as _ from 'lodash';

@Injectable()
export class MemberBodyStatsService {
  constructor(
    @InjectModel(TxnMemberHealthParameterLog)
    private readonly memberHealthParameterLogRepository: typeof TxnMemberHealthParameterLog,
    @InjectModel(TxnMemberHealthParameter)
    private readonly memberHealthParameterRepository: typeof TxnMemberHealthParameter,
    private exceptionService: ExceptionService,
    private healthParameterService: HealthParameterService,
    private sequelize: Sequelize,
  ) {}

  public async findAll(id: number, searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const whereCondition: any = {
        memberId: id,
      };
      if (searchDto.name) {
        whereCondition['name'] = searchDto.name;
      }
      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      let offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

      const { rows, count } =
        await this.memberHealthParameterLogRepository.findAndCountAll<TxnMemberHealthParameterLog>({
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
          order: [['logDate', 'ASC']],
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

      const resList: IMemberHealthParameterLog[] = [];
      for (const s of rows) {
        resList.push(this.convertDBObject(s));
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
      const find = await this.memberHealthParameterLogRepository.findOne({
        where: {
          memberHealthParameterLogId: id,
        },
        raw: true,
        nest: true,
      });
      if (find) {
        const dataObj = this.convertDBObject(find);

        const defaultHealthParameters: IMemberHealthParameter[] =
          await this.healthParameterService.createDefaultHealthParameterLogs();

        const memberLogs = await this.memberHealthParameterRepository.findAll({
          where: {
            memberHealthParameterLogId: id,
          },
          nest: true,
          raw: true,
        });
        for (const s of defaultHealthParameters) {
          const f = _.find(memberLogs, { healthParameterId: s.healthParameterId });
          if (f) {
            s.value = f.value;
          }
        }
        dataObj['memberHealthParameters'] = defaultHealthParameters;

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

  public async create(
    memberId: number,
    obj: CreateHealthParameterLogDto,
    cIp: string,
    adminId: number,
  ): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const createObj = {
        memberId: memberId,
        logDate: obj.logDate,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const createdObj = await this.createInDB(createObj);

      const memberHealthParameter = [];
      for (const s of obj.bodyStats) {
        memberHealthParameter.push({
          ...s,
          memberHealthParameterLogId: createdObj['memberHealthParameterLogId'],
        });
      }

      const parameterLog = await this.memberHealthParameterRepository.bulkCreate(memberHealthParameter);

      if (createdObj && parameterLog) {
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

  public async update(
    id: number,
    obj: CreateHealthParameterLogDto,
    cIp: string,
    adminId: number,
  ): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const find = await this.memberHealthParameterLogRepository.findOne({
        where: {
          memberHealthParameterLogId: id,
        },
      });
      if (find) {
        const updateObj = {
          logDate: obj.logDate,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);

        const deleteOld = await this.memberHealthParameterRepository.destroy({
          where: { memberHealthParameterLogId: id },
        });

        const memberHealthParameter = [];
        for (const s of obj.bodyStats) {
          memberHealthParameter.push({
            ...s,
            memberHealthParameterLogId: id,
          });
        }

        const parameterLog = await this.memberHealthParameterRepository.bulkCreate(memberHealthParameter);

        if (updatedObj && deleteOld && parameterLog) {
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
      const find = await this.memberHealthParameterLogRepository.findOne({
        where: {
          memberHealthParameterLogId: id,
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

  public async findAllById(memberId: number): Promise<TxnMemberHealthParameterLog[]> {
    return await this.memberHealthParameterLogRepository.findAll<TxnMemberHealthParameterLog>({
      where: { memberId: memberId },
      raw: true,
      nest: true,
    });
  }

  private convertDBObject(obj: TxnMemberHealthParameterLog): IMemberHealthParameterLog {
    return <IMemberHealthParameterLog>{
      id: obj.memberHealthParameterLogId,
      memberId: obj.memberId,
      logDate: obj.logDate ? moment(obj.logDate, DB_DATE_FORMAT) : null,
      active: obj.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(obj['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(obj['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(obj.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(obj.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  private async createInDB(obj: any) {
    return await this.memberHealthParameterLogRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.memberHealthParameterLogRepository
      .update(obj, { where: { memberHealthParameterLogId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
