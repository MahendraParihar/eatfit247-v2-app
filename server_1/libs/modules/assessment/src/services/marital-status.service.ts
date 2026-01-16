import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstMaritalStatus } from '../models';
import { IBasicSearch, IDropdownItem, IManageMaritalStatus, IMaritalStatus, ITableList } from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class MaritalStatusService {
  constructor(
    @InjectModel(MstMaritalStatus) private readonly maritalStatusRepository: typeof MstMaritalStatus,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IMaritalStatus>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'maritalStatus');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.maritalStatusRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['maritalStatus', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IMaritalStatus[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IMaritalStatus {
    return <IMaritalStatus>{
      maritalStatusId: item.maritalStatusId,
      id: item.maritalStatusId,
      maritalStatus: item.maritalStatus,
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

  public async fetchById(id: number): Promise<IMaritalStatus> {
    const find = await this.maritalStatusRepository.scope('details').findOne({
      where: { maritalStatusId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Marital status not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageMaritalStatus, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      maritalStatus: obj.maritalStatus,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.maritalStatusRepository.create(createObj);
  }

  public async update(id: number, obj: IManageMaritalStatus, cIp: string, adminId: number): Promise<void> {
    const find = await this.maritalStatusRepository.findOne({ where: { maritalStatusId: id } });
    if (!find) {
      throw new NotFoundException('Marital status not found');
    }
    const updateObj = {
      maritalStatus: obj.maritalStatus,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.maritalStatusRepository.update(updateObj, { where: { maritalStatusId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.maritalStatusRepository.findOne({ where: { maritalStatusId: id } });
    if (!find) {
      throw new NotFoundException('Marital status not found');
    }
    await this.maritalStatusRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { maritalStatusId: id } });
  }

  public async getMaritalStatusList(): Promise<IDropdownItem[]> {
    const tempList = await this.maritalStatusRepository.findAll<MstMaritalStatus>({
      where: { active: true },
      order: [['maritalStatus', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.maritalStatusId, label: t.maritalStatus, selected: false }));
  }
}

