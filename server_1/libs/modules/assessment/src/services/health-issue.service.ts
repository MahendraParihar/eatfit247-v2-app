import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstHealthIssue } from '../models';
import { IBasicSearch, IDropdownItem, IHealthIssue, IManageHealthIssue, ITableList } from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class HealthIssueService {
  constructor(
    @InjectModel(MstHealthIssue) private readonly healthIssueRepository: typeof MstHealthIssue,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IHealthIssue>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'healthIssue');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.healthIssueRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['healthIssue', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IHealthIssue[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IHealthIssue {
    return <IHealthIssue>{
      healthIssueId: item.healthIssueId,
      id: item.healthIssueId,
      healthIssue: item.healthIssue,
      imagePath: CommonFunctionsUtil.buildImageUrl(item.imagePath),
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IHealthIssue> {
    const find = await this.healthIssueRepository.scope('details').findOne({
      where: { healthIssueId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Health issue not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageHealthIssue, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      healthIssue: obj.healthIssue,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.healthIssueRepository.create(createObj);
  }

  public async update(id: number, obj: IManageHealthIssue, cIp: string, adminId: number): Promise<void> {
    const find = await this.healthIssueRepository.findOne({ where: { healthIssueId: id } });
    if (!find) {
      throw new NotFoundException('Health issue not found');
    }
    const updateObj = {
      healthIssue: obj.healthIssue,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.healthIssueRepository.update(updateObj, { where: { healthIssueId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.healthIssueRepository.findOne({ where: { healthIssueId: id } });
    if (!find) {
      throw new NotFoundException('Health issue not found');
    }
    await this.healthIssueRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { healthIssueId: id } });
  }

  public async getHealthIssueList(): Promise<IDropdownItem[]> {
    const tempList = await this.healthIssueRepository.findAll<MstHealthIssue>({
      where: { active: true },
      order: [['healthIssue', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.healthIssueId, label: t.healthIssue, selected: false }));
  }
}

