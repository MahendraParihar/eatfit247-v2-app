import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstLifestyle } from '../models';
import { IBasicSearch, IDropdownItem, ILifestyle, IManageLifestyle, ITableList } from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class LifestyleService {
  constructor(
    @InjectModel(MstLifestyle) private readonly lifestyleRepository: typeof MstLifestyle,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ILifestyle>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'lifestyle');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.lifestyleRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['lifestyle', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ILifestyle[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): ILifestyle {
    return <ILifestyle>{
      lifestyleId: item.lifestyleId,
      id: item.lifestyleId,
      lifestyle: item.lifestyle,
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

  public async fetchById(id: number): Promise<ILifestyle> {
    const find = await this.lifestyleRepository.scope('details').findOne({
      where: { lifestyleId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Lifestyle not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageLifestyle, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      lifestyle: obj.lifestyle,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.lifestyleRepository.create(createObj);
  }

  public async update(id: number, obj: IManageLifestyle, cIp: string, adminId: number): Promise<void> {
    const find = await this.lifestyleRepository.findOne({ where: { lifestyleId: id } });
    if (!find) {
      throw new NotFoundException('Lifestyle not found');
    }
    const updateObj = {
      lifestyle: obj.lifestyle,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.lifestyleRepository.update(updateObj, { where: { lifestyleId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.lifestyleRepository.findOne({ where: { lifestyleId: id } });
    if (!find) {
      throw new NotFoundException('Lifestyle not found');
    }
    await this.lifestyleRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { lifestyleId: id } });
  }

  public async getLifestyleList(): Promise<IDropdownItem[]> {
    const tempList = await this.lifestyleRepository.findAll<MstLifestyle>({
      where: { active: true },
      order: [['lifestyle', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.lifestyleId, label: t.lifestyle, selected: false }));
  }
}

