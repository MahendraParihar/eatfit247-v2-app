import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DB_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
} from '../../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import moment from 'moment';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import { TxnMemberHealthParameter } from '../../../core/database/models/txn-member-health-parameter.model';
import { TxnMemberHealthParameterLog } from '../../../core/database/models/txn-member-health-parameter-log.model';
import {
  IMemberHealthParameter,
  IMemberHealthParameterLog,
} from 'shared-lib';
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
    private healthParameterService: HealthParameterService,
    private sequelize: Sequelize,
  ) {}

  public async findAll(id: number, searchDto: IBasicSearch): Promise<ITableList<IMemberHealthParameterLog>> {
    const whereCondition: any = {
      memberId: id,
    };
    if (searchDto.name) {
      whereCondition['name'] = searchDto.name;
    }
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
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
    const resList: IMemberHealthParameterLog[] = [];
    for (const s of rows) {
      resList.push(this.convertDBObject(s));
    }
    return <ITableList<IMemberHealthParameterLog>>{
      data: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IMemberHealthParameterLog> {
    const find = await this.memberHealthParameterLogRepository.findOne({
      where: {
        memberHealthParameterLogId: id,
      },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
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
    dataObj.memberHealthParameters = defaultHealthParameters;
    return dataObj;
  }

  public async create(
    memberId: number,
    obj: CreateHealthParameterLogDto,
    cIp: string,
    adminId: number,
  ): Promise<void> {
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
      await this.memberHealthParameterRepository.bulkCreate(memberHealthParameter);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async update(
    id: number,
    obj: CreateHealthParameterLogDto,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const find = await this.memberHealthParameterLogRepository.findOne({
        where: {
          memberHealthParameterLogId: id,
        },
      });
      if (!find) {
        await t.rollback();
        throw new NotFoundException(StringResource.NO_DATA_FOUND);
      }
      const updateObj = {
        logDate: obj.logDate,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };
      await this.updateInDB(id, updateObj);
      await this.memberHealthParameterRepository.destroy({
        where: { memberHealthParameterLogId: id },
      });
      const memberHealthParameter = [];
      for (const s of obj.bodyStats) {
        memberHealthParameter.push({
          ...s,
          memberHealthParameterLogId: id,
        });
      }
      await this.memberHealthParameterRepository.bulkCreate(memberHealthParameter);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.memberHealthParameterLogRepository.findOne({
      where: {
        memberHealthParameterLogId: id,
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
      logDate: obj.logDate ? moment(obj.logDate, DB_DATE_FORMAT).toDate() : null,
      active: obj.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(obj['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(obj['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(obj.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(obj.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      memberHealthParameters: [],
    };
  }

  private async createInDB(obj: any) {
    return await this.memberHealthParameterLogRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.memberHealthParameterLogRepository.update(obj, { where: { memberHealthParameterLogId: id } });
  }
}
