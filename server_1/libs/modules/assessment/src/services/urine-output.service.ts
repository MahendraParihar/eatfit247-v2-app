import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstUrineOutput } from '../models';
import {
  ConfigParam,
  IBasicSearch,
  IDropdownItem,
  IManageUrineOutput,
  ITableList,
  IUrineOutput,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class UrineOutputService {
  constructor(
    @InjectModel(MstUrineOutput) private readonly urineOutputRepository: typeof MstUrineOutput,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IUrineOutput>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'urineOutput');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.urineOutputRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['urineOutput', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IUrineOutput[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IUrineOutput {
    return <IUrineOutput>{
      urineOutputId: item.urineOutputId,
      id: item.urineOutputId,
      urineOutput: item.urineOutput,
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

  public async fetchById(id: number): Promise<IUrineOutput> {
    const find = await this.urineOutputRepository.scope('details').findOne({
      where: { urineOutputId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Urine output not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageUrineOutput, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      urineOutput: obj.urineOutput,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.urineOutputRepository.create(createObj);
  }

  public async update(id: number, obj: IManageUrineOutput, cIp: string, adminId: number): Promise<void> {
    const find = await this.urineOutputRepository.findOne({ where: { urineOutputId: id } });
    if (!find) {
      throw new NotFoundException('Urine output not found');
    }
    const updateObj = {
      urineOutput: obj.urineOutput,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.urineOutputRepository.update(updateObj, { where: { urineOutputId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.urineOutputRepository.findOne({ where: { urineOutputId: id } });
    if (!find) {
      throw new NotFoundException('Urine output not found');
    }
    await this.urineOutputRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { urineOutputId: id } });
  }

  public async getUrineOutputList(): Promise<IDropdownItem[]> {
    const tempList = await this.urineOutputRepository.findAll<MstUrineOutput>({
      where: { active: true },
      order: [['urineOutput', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.urineOutputId, label: t.urineOutput, selected: false }));
  }
}

