import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DB_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
  DEFAULT_TIME_FORMAT,
} from '../../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch, IManageMemberCallLog } from 'shared-lib';
import moment from 'moment';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import { TxnMemberCallLog } from '../../../core/database/models/txn-member-call-log.model';
import { IMemberCallLog } from 'shared-lib';
import { MstCallLogStatus } from '../../../core/database/models/mst-call-log-status.model';
import { MstCallPurpose } from '../../../core/database/models/mst-call-purpose.model';
import { MstCallType } from '../../../core/database/models/mst-call-type.model';
import { CallLogStatusEnum } from 'shared-lib';

@Injectable()
export class MemberCallScheduleService {
  constructor(
    @InjectModel(TxnMemberCallLog) private readonly memberCallLogRepository: typeof TxnMemberCallLog,
    private sequelize: Sequelize,
  ) {}

  public async findAll(id: number, searchDto: IBasicSearch): Promise<ITableList<IMemberCallLog>> {
    const whereCondition: any = {
      memberId: id,
    };
    if (searchDto.name) {
      whereCondition['name'] = searchDto.name;
    }
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
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
    const resList: IMemberCallLog[] = [];
    for (const s of rows) {
      resList.push(this.convertDBObject(s));
    }
    return <ITableList<IMemberCallLog>>{
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IMemberCallLog> {
    const find = await this.memberCallLogRepository.findOne({
      where: {
        memberCallLogId: id,
      },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return this.convertDBObject(find);
  }

  public async create(
    memberId: number,
    obj: IManageMemberCallLog,
    cIp: string,
    adminId: number,
  ): Promise<void> {
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
      await this.createInDB(createObj);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async update(id: number, obj: IManageMemberCallLog, cIp: string, adminId: number): Promise<void> {
    const find = await this.memberCallLogRepository.findOne({
      where: {
        memberCallLogId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const t = await this.sequelize.transaction();
    try {
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
      await this.updateInDB(id, updateObj);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.memberCallLogRepository.findOne({
      where: {
        memberCallLogId: id,
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
      date: obj.date ? moment(obj.date, DB_DATE_FORMAT).toDate() : null,
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
    return await this.memberCallLogRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.memberCallLogRepository.update(obj, { where: { memberCallLogId: id } });
  }
}
