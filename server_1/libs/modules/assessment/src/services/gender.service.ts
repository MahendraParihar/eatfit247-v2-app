import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstGender } from '../models';
import { IBasicSearch, IDropdownItem, IGender, IManageGender, ITableList } from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil, TableListSortUtil } from '@server_1/core';

@Injectable()
export class GenderService {
  constructor(
    @InjectModel(MstGender) private readonly genderRepository: typeof MstGender,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IGender>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'gender');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.genderRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: TableListSortUtil.orderFromAllowlist(
        searchDto,
        new Set(['genderId', 'gender', 'imagePath', 'active', 'createdAt', 'updatedAt']),
        [['gender', 'ASC']],
      ),
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IGender[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IGender {
    return <IGender>{
      genderId: item.genderId,
      id: item.genderId,
      gender: item.gender,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath
      ),
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IGender> {
    const find = await this.genderRepository.scope('details').findOne({
      where: { genderId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Gender not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageGender, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      gender: obj.gender,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.genderRepository.create(createObj);
  }

  public async update(id: number, obj: IManageGender, cIp: string, adminId: number): Promise<void> {
    const find = await this.genderRepository.findOne({
      where: { genderId: id },
    });
    if (!find) {
      throw new NotFoundException('Gender not found');
    }
    const updateObj = {
      gender: obj.gender,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.genderRepository.update(updateObj, { where: { genderId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.genderRepository.findOne({
      where: { genderId: id },
    });
    if (!find) {
      throw new NotFoundException('Gender not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.genderRepository.update(updateObj, { where: { genderId: id } });
  }

  public async getGenderList(): Promise<IDropdownItem[]> {
    const tempList = await this.genderRepository.findAll<MstGender>({
      where: { active: true },
      order: [['gender', 'ASC']],
    });
    return tempList.map((t) => ({
      id: t.genderId,
      label: t.gender,
      selected: false,
    }));
  }
}

