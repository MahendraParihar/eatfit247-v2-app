import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstReligion } from '../models';
import { ITableList, IBasicSearch, IReligion, IManageReligion, IDropdownItem, ConfigParam } from '@eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server_1/core';

@Injectable()
export class ReligionService {
  constructor(
    @InjectModel(MstReligion) private readonly religionRepository: typeof MstReligion,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IReligion>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'religion');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.religionRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['religion', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IReligion[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IReligion {
    return <IReligion>{
      religionId: item.religionId,
      id: item.religionId,
      religion: item.religion,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IReligion> {
    const find = await this.religionRepository.scope('details').findOne({
      where: { religionId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Religion not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageReligion, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      religion: obj.religion,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.religionRepository.create(createObj);
  }

  public async update(id: number, obj: IManageReligion, cIp: string, adminId: number): Promise<void> {
    const find = await this.religionRepository.findOne({ where: { religionId: id } });
    if (!find) {
      throw new NotFoundException('Religion not found');
    }
    const updateObj = {
      religion: obj.religion,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.religionRepository.update(updateObj, { where: { religionId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.religionRepository.findOne({ where: { religionId: id } });
    if (!find) {
      throw new NotFoundException('Religion not found');
    }
    await this.religionRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { religionId: id } });
  }

  public async getReligionList(): Promise<IDropdownItem[]> {
    const tempList = await this.religionRepository.findAll<MstReligion>({
      where: { active: true },
      order: [['religion', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.religionId, label: t.religion, selected: false }));
  }
}

