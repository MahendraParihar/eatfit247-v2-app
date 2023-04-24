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
  DEFAULT_TIME_FORMAT,
  IS_DEV,
} from '../../../constants/config-constants';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import * as moment from 'moment';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import { TxnMemberCallLog } from '../../../core/database/models/txn-member-call-log.model';
import { IMemberCallLog } from '../../../response-interface/member-call-log.interface';
import { MstCallLogStatus } from '../../../core/database/models/mst-call-log-status.model';
import { MstCallPurpose } from '../../../core/database/models/mst-call-purpose.model';
import { MstCallType } from '../../../core/database/models/mst-call-type.model';
import { CreateMemberCallLogDto } from '../dto/member-call-log.dto';
import { CallLogStatusEnum } from '../../../enums/call-log-status-enum';

@Injectable()
export class MemberCallScheduleService {
  constructor(
    @InjectModel(TxnMemberCallLog) private readonly memberCallLogRepository: typeof TxnMemberCallLog,
    private exceptionService: ExceptionService,
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

      const { rows, count } = await this.memberCallLogRepository.findAndCountAll<TxnMemberCallLog>({
        include: [
          {
            model: MstCallLogStatus,
            required: true,
            as: 'MemberCallLogStatus',
          },
          {
            model: MstCallPurpose,
            required: true,
            as: 'MemberCallLogPurpose',
          },
          {
            model: MstCallType,
            required: true,
            as: 'MemberCallLogType',
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
          ['date', 'ASC'],
          ['startTime', 'ASC'],
        ],
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

      const resList: IMemberCallLog[] = [];
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
      const find = await this.memberCallLogRepository.findOne({
        where: {
          memberCallLogId: id,
        },
        raw: true,
        nest: true,
      });
      if (find) {
        const dataObj = this.convertDBObject(find);

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
    obj: CreateMemberCallLogDto,
    cIp: string,
    adminId: number,
  ): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const createObj = {
        memberId: memberId,
        callPurposeId: obj.callPurposeId,
        callLogStatusId: obj.callStatusId,
        callTypeId: obj.callTypeId,
        detail: obj.detail,
        conversionHistory: obj.conversionHistory,
        date: moment(obj.date),
        startTime: obj.startTime ? obj.startTime : null,
        endTime: obj.endTime ? obj.endTime : null,
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

  public async update(id: number, obj: CreateMemberCallLogDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const find = await this.memberCallLogRepository.findOne({
        where: {
          memberCallLogId: id,
        },
      });
      if (find) {
        const updateObj = {
          memberId: obj.memberId,
          callPurposeId: obj.callPurposeId,
          callLogStatusId: obj.callStatusId,
          callTypeId: obj.callTypeId,
          detail: obj.detail,
          conversionHistory: obj.conversionHistory,
          date: moment(obj.date),
          startTime: obj.startTime ? obj.startTime : null,
          endTime: obj.endTime ? obj.endTime : null,
          active: obj.active != null ? obj.active : find.active,
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
      const find = await this.memberCallLogRepository.findOne({
        where: {
          memberCallLogId: id,
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

  public async findAllById(memberId: number): Promise<TxnMemberCallLog[]> {
    return await this.memberCallLogRepository.findAll<TxnMemberCallLog>({
      where: { memberId: memberId, callLogStatusId: CallLogStatusEnum.PENDING },
      raw: true,
      nest: true,
    });
  }

  private convertDBObject(obj: TxnMemberCallLog): IMemberCallLog {
    return <IMemberCallLog>{
      id: obj.memberCallLogId,
      callPurposeId: obj.callPurposeId,
      callLogStatusId: obj.callLogStatusId,
      callTypeId: obj.callTypeId,
      callPurpose: obj['MemberCallLogPurpose'] ? obj['MemberCallLogPurpose']['callPurpose'] : null,
      callLogStatus: obj['MemberCallLogStatus'] ? obj['MemberCallLogStatus']['callLogStatus'] : null,
      callType: obj['MemberCallLogType'] ? obj['MemberCallLogType']['callType'] : null,
      detail: obj.detail,
      conversionHistory: obj.conversionHistory,
      date: obj.date ? moment(obj.date, DB_DATE_FORMAT) : null,
      startTime: obj.startTime ? moment(obj.startTime, DEFAULT_TIME_FORMAT).format(DEFAULT_TIME_FORMAT) : null,
      endTime: obj.endTime ? moment(obj.endTime, DEFAULT_TIME_FORMAT).format(DEFAULT_TIME_FORMAT) : null,
      active: obj.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(obj['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(obj['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(obj.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(obj.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  private async createInDB(obj: any) {
    return await this.memberCallLogRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.memberCallLogRepository
      .update(obj, { where: { memberCallLogId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
