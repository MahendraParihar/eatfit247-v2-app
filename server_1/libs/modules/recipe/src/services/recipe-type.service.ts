import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstRecipeType } from '../models';
import { ITableList, IBasicSearch, IRecipeType, IManageRecipeType, IDropdownItem, ConfigParam } from '@eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server_1/core';

@Injectable()
export class RecipeTypeService {
  constructor(
    @InjectModel(MstRecipeType) private readonly recipeTypeRepository: typeof MstRecipeType,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IRecipeType>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'recipeType');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.recipeTypeRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['recipeType', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IRecipeType[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IRecipeType {
    return <IRecipeType>{
      recipeTypeId: item.recipeTypeId,
      id: item.recipeTypeId,
      recipeType: item.recipeType,
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

  public async fetchById(id: number): Promise<IRecipeType> {
    const find = await this.recipeTypeRepository.scope('details').findOne({
      where: { recipeTypeId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Recipe type not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageRecipeType, requestedIp: string, userId: number): Promise<void> {
    const dataObj: any = {
      recipeType: obj.recipeType,
      active: obj.active,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      createdBy: userId,
      modifiedBy: userId,
      createdIp: requestedIp,
      modifiedIp: requestedIp,
    };
    await this.recipeTypeRepository.create(dataObj);
  }

  public async update(id: number, obj: IManageRecipeType, requestedIp: string, userId: number): Promise<void> {
    const find = await this.recipeTypeRepository.findOne({ where: { recipeTypeId: id } });
    if (!find) {
      throw new NotFoundException('Recipe type not found');
    }
    const dataObj: any = {
      recipeType: obj.recipeType,
      active: obj.active,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      modifiedBy: userId,
      modifiedIp: requestedIp,
    };
    await this.recipeTypeRepository.update(dataObj, { where: { recipeTypeId: id } });
  }

  public async changeStatus(id: number, active: boolean, requestedIp: string, userId: number): Promise<void> {
    const find = await this.recipeTypeRepository.findOne({ where: { recipeTypeId: id } });
    if (!find) {
      throw new NotFoundException('Recipe type not found');
    }
    await this.recipeTypeRepository.update(
      {
        active: active,
        modifiedBy: userId,
        modifiedIp: requestedIp,
      },
      { where: { recipeTypeId: id } },
    );
  }

  public async getRecipeTypeList(): Promise<IDropdownItem[]> {
    const tempList = await this.recipeTypeRepository.scope('list').findAll({
      where: { active: true },
      order: [['recipeType', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t: any) => ({
      id: t.recipeTypeId,
      label: t.recipeType,
      isActive: t.active,
    }));
  }
}

