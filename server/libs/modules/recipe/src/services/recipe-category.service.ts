import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstRecipeCategory } from '../models';
import { ITableList, IBasicSearch, IRecipeCategory, IManageRecipeCategory, IDropdownItem, ConfigParam } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

@Injectable()
export class RecipeCategoryService {
  constructor(
    @InjectModel(MstRecipeCategory) private readonly recipeCategoryRepository: typeof MstRecipeCategory,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IRecipeCategory>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'recipeCategory');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.recipeCategoryRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['sequence', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IRecipeCategory[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IRecipeCategory {
    return <IRecipeCategory>{
      recipeCategoryId: item.recipeCategoryId,
      id: item.recipeCategoryId,
      recipeCategory: item.recipeCategory,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
      fromTime: item.fromTime,
      toTime: item.toTime,
      sequence: item.sequence,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IRecipeCategory> {
    const find = await this.recipeCategoryRepository.scope('details').findOne({
      where: { recipeCategoryId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Recipe category not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageRecipeCategory, requestedIp: string, userId: number): Promise<void> {
    const dataObj: any = {
      recipeCategory: obj.recipeCategory,
      fromTime: obj.fromTime,
      toTime: obj.toTime,
      sequence: obj.sequence,
      active: obj.active,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      createdBy: userId,
      modifiedBy: userId,
      createdIp: requestedIp,
      modifiedIp: requestedIp,
    };
    await this.recipeCategoryRepository.create(dataObj);
  }

  public async update(id: number, obj: IManageRecipeCategory, requestedIp: string, userId: number): Promise<void> {
    const find = await this.recipeCategoryRepository.findOne({ where: { recipeCategoryId: id } });
    if (!find) {
      throw new NotFoundException('Recipe category not found');
    }
    const dataObj: any = {
      recipeCategory: obj.recipeCategory,
      fromTime: obj.fromTime,
      toTime: obj.toTime,
      sequence: obj.sequence,
      active: obj.active,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      modifiedBy: userId,
      modifiedIp: requestedIp,
    };
    await this.recipeCategoryRepository.update(dataObj, { where: { recipeCategoryId: id } });
  }

  public async changeStatus(id: number, active: boolean, requestedIp: string, userId: number): Promise<void> {
    const find = await this.recipeCategoryRepository.findOne({ where: { recipeCategoryId: id } });
    if (!find) {
      throw new NotFoundException('Recipe category not found');
    }
    await this.recipeCategoryRepository.update(
      {
        active: active,
        modifiedBy: userId,
        modifiedIp: requestedIp,
      },
      { where: { recipeCategoryId: id } },
    );
  }

  public async getRecipeCategoryList(): Promise<IDropdownItem[]> {
    const tempList = await this.recipeCategoryRepository.scope('list').findAll({
      where: { active: true },
      order: [['sequence', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t: any) => ({
      id: t.recipeCategoryId,
      label: t.recipeCategory,
      isActive: t.active,
    }));
  }
}

