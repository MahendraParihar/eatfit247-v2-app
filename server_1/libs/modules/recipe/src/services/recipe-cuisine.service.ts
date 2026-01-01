import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstRecipeCuisine } from '../models';
import { ITableList, IBasicSearch, IRecipeCuisine, IManageRecipeCuisine, IDropdownItem, ConfigParam } from '@eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server_1/core';

@Injectable()
export class RecipeCuisineService {
  constructor(
    @InjectModel(MstRecipeCuisine) private readonly recipeCuisineRepository: typeof MstRecipeCuisine,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IRecipeCuisine>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'recipeCuisine');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.recipeCuisineRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['recipeCuisine', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IRecipeCuisine[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IRecipeCuisine {
    return <IRecipeCuisine>{
      recipeCuisineId: item.recipeCuisineId,
      id: item.recipeCuisineId,
      recipeCuisine: item.recipeCuisine,
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

  public async fetchById(id: number): Promise<IRecipeCuisine> {
    const find = await this.recipeCuisineRepository.scope('details').findOne({
      where: { recipeCuisineId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Recipe cuisine not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageRecipeCuisine, requestedIp: string, userId: number): Promise<void> {
    const dataObj: any = {
      recipeCuisine: obj.recipeCuisine,
      active: obj.active,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      createdBy: userId,
      modifiedBy: userId,
      createdIp: requestedIp,
      modifiedIp: requestedIp,
    };
    await this.recipeCuisineRepository.create(dataObj);
  }

  public async update(id: number, obj: IManageRecipeCuisine, requestedIp: string, userId: number): Promise<void> {
    const find = await this.recipeCuisineRepository.findOne({ where: { recipeCuisineId: id } });
    if (!find) {
      throw new NotFoundException('Recipe cuisine not found');
    }
    const dataObj: any = {
      recipeCuisine: obj.recipeCuisine,
      active: obj.active,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      modifiedBy: userId,
      modifiedIp: requestedIp,
    };
    await this.recipeCuisineRepository.update(dataObj, { where: { recipeCuisineId: id } });
  }

  public async changeStatus(id: number, active: boolean, requestedIp: string, userId: number): Promise<void> {
    const find = await this.recipeCuisineRepository.findOne({ where: { recipeCuisineId: id } });
    if (!find) {
      throw new NotFoundException('Recipe cuisine not found');
    }
    await this.recipeCuisineRepository.update(
      {
        active: active,
        modifiedBy: userId,
        modifiedIp: requestedIp,
      },
      { where: { recipeCuisineId: id } },
    );
  }

  public async getRecipeCuisineList(): Promise<IDropdownItem[]> {
    const tempList = await this.recipeCuisineRepository.scope('list').findAll({
      where: { active: true },
      order: [['recipeCuisine', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t: any) => ({
      id: t.recipeCuisineId,
      label: t.recipeCuisine,
      isActive: t.active,
    }));
  }
}

