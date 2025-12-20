import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstRecipe } from '../models';
import { ITableList, IBasicSearch, IRecipe, IManageRecipe, ConfigParam } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

@Injectable()
export class RecipeService {
  constructor(
    @InjectModel(MstRecipe) private readonly recipeRepository: typeof MstRecipe,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IRecipe>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.recipeRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['name', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IRecipe[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IRecipe {
    return <IRecipe>{
      recipeId: item.recipeId,
      id: item.recipeId,
      name: item.name,
      recipeTypeId: item.recipeTypeId,
      recipeType: item.recipeType?.recipeType || '',
      details: item.details,
      preparationMethod: item.preparationMethod,
      ingredient: item.ingredient,
      howToMake: item.howToMake,
      benefits: item.benefits,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
      servingCount: item.servingCount,
      tags: item.tags,
      downloadPath: item.downloadPath,
      url: item.url,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      visitedCount: item.visitedCount,
      shareCount: item.shareCount,
      isVisibleToAll: item.isVisibleToAll,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IRecipe> {
    const find = await this.recipeRepository.scope('details').findOne({
      where: { recipeId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Recipe not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageRecipe, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      name: obj.name,
      recipeTypeId: obj.recipeTypeId,
      details: obj.details || null,
      preparationMethod: obj.preparationMethod || null,
      ingredient: obj.ingredient || null,
      howToMake: obj.howToMake || null,
      benefits: obj.benefits || null,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      servingCount: obj.servingCount,
      tags: obj.tags || null,
      downloadPath: obj.downloadPath || null,
      url: obj.url || CommonFunctionsUtil.removeSpecialChar(obj.name.toString().toLowerCase(), '-'),
      metaTitle: obj.metaTitle || null,
      metaDescription: obj.metaDescription || null,
      visitedCount: 0,
      shareCount: 0,
      isVisibleToAll: obj.isVisibleToAll,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.recipeRepository.create(createObj);
  }

  public async update(id: number, obj: IManageRecipe, cIp: string, adminId: number): Promise<void> {
    const find = await this.recipeRepository.findOne({
      where: { recipeId: id },
    });
    if (!find) {
      throw new NotFoundException('Recipe not found');
    }
    const updateObj = {
      name: obj.name,
      recipeTypeId: obj.recipeTypeId,
      details: obj.details || null,
      preparationMethod: obj.preparationMethod || null,
      ingredient: obj.ingredient || null,
      howToMake: obj.howToMake || null,
      benefits: obj.benefits || null,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      servingCount: obj.servingCount,
      tags: obj.tags || null,
      downloadPath: obj.downloadPath || null,
      url: obj.url || CommonFunctionsUtil.removeSpecialChar(obj.name.toString().toLowerCase(), '-'),
      metaTitle: obj.metaTitle || null,
      metaDescription: obj.metaDescription || null,
      isVisibleToAll: obj.isVisibleToAll,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.recipeRepository.update(updateObj, { where: { recipeId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.recipeRepository.findOne({
      where: { recipeId: id },
    });
    if (!find) {
      throw new NotFoundException('Recipe not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.recipeRepository.update(updateObj, { where: { recipeId: id } });
  }
}

