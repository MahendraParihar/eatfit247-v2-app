import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstCallLogStatus } from '../models';
import { IBasicSearch, ICallLogStatus, IDropdownItem, IManageCallLogStatus, ITableList } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class CallLogStatusService {
  constructor(
    @InjectModel(MstCallLogStatus) private readonly callLogStatusRepository: typeof MstCallLogStatus,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ICallLogStatus>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'callLogStatus');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.callLogStatusRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['callLogStatus', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ICallLogStatus[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): ICallLogStatus {
    return <ICallLogStatus>{
      callLogStatusId: item.callLogStatusId,
      id: item.callLogStatusId,
      callLogStatus: item.callLogStatus,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<ICallLogStatus> {
    const find = await this.callLogStatusRepository.scope('details').findOne({
      where: { callLogStatusId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Call log status not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageCallLogStatus, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      callLogStatus: obj.callLogStatus,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.callLogStatusRepository.create(createObj);
  }

  public async update(id: number, obj: IManageCallLogStatus, cIp: string, adminId: number): Promise<void> {
    const find = await this.callLogStatusRepository.findOne({
      where: { callLogStatusId: id },
    });
    if (!find) {
      throw new NotFoundException('Call log status not found');
    }
    const updateObj = {
      callLogStatus: obj.callLogStatus,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.callLogStatusRepository.update(updateObj, { where: { callLogStatusId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.callLogStatusRepository.findOne({
      where: { callLogStatusId: id },
    });
    if (!find) {
      throw new NotFoundException('Call log status not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.callLogStatusRepository.update(updateObj, { where: { callLogStatusId: id } });
  }

  public async getCallLogStatusList(): Promise<IDropdownItem[]> {
    const tempList = await this.callLogStatusRepository.findAll<MstCallLogStatus>({
      where: { active: true },
      order: [['callLogStatus', 'ASC']],
    });
    return tempList.map((t) => ({
      id: t.callLogStatusId,
      label: t.callLogStatus,
      selected: false,
    }));
  }
}

