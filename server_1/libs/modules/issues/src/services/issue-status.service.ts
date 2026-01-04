import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstIssueStatus } from '../models';
import { IBasicSearch, IDropdownItem, IIssueStatus, IManageIssueStatus, ITableList } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class IssueStatusService {
  constructor(
    @InjectModel(MstIssueStatus) private readonly issueStatusRepository: typeof MstIssueStatus,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IIssueStatus>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'issueStatus');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.issueStatusRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['issueStatus', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IIssueStatus[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IIssueStatus {
    return <IIssueStatus>{
      issueStatusId: item.issueStatusId,
      id: item.issueStatusId,
      issueStatus: item.issueStatus,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IIssueStatus> {
    const find = await this.issueStatusRepository.scope('details').findOne({
      where: { issueStatusId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Issue status not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageIssueStatus, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      issueStatus: obj.issueStatus,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
    };
    await this.issueStatusRepository.create(createObj);
  }

  public async update(id: number, obj: IManageIssueStatus, cIp: string, adminId: number): Promise<void> {
    const find = await this.issueStatusRepository.findOne({ where: { issueStatusId: id } });
    if (!find) {
      throw new NotFoundException('Issue status not found');
    }
    const updateObj = {
      issueStatus: obj.issueStatus,
      active: obj.active,
      modifiedBy: adminId,
    };
    await this.issueStatusRepository.update(updateObj, { where: { issueStatusId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.issueStatusRepository.findOne({ where: { issueStatusId: id } });
    if (!find) {
      throw new NotFoundException('Issue status not found');
    }
    await this.issueStatusRepository.update({ active, modifiedBy: adminId }, { where: { issueStatusId: id } });
  }

  public async getIssueStatusList(): Promise<IDropdownItem[]> {
    const tempList = await this.issueStatusRepository.findAll<MstIssueStatus>({
      where: { active: true },
      order: [['issueStatus', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.issueStatusId, label: t.issueStatus, selected: false }));
  }
}

