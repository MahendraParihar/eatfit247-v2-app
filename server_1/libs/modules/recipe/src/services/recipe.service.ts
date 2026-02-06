import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { MstRecipe, MstRecipeCategoryMapping, MstRecipeCuisineMapping, MstRecipeType } from '../models';
import { IBasicSearch, IManageRecipe, IRecipe, ITableList, MediaForEnum } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';
import { IFileModel, PdfService } from '@server_1/platform';
import { FranchiseService } from '@server_1/modules/franchise';

@Injectable()
export class RecipeService {
  constructor(
    @InjectModel(MstRecipe) private readonly recipeRepository: typeof MstRecipe,
    private pdfService: PdfService,
    private franchiseService: FranchiseService,
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
      nest: true,
    });
    const resList: IRecipe[] = rows.map((item: any) => {return this.convertToModel(item.get({ plain: true }));});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IRecipe {
    const categories = [];
    const cuisines = [];
    if (item.recipeCategoryMappings && item.recipeCategoryMappings.length > 0) {
      item.recipeCategoryMappings.forEach((rcm: MstRecipeCategoryMapping) => {
        categories.push({
          recipeCategoryId: rcm.recipeCategoryId,
          recipeId: rcm.recipeId,
          recipeCategory: rcm.recipeCategory.recipeCategory,
        });
      });
    }
    if (item.recipeCuisineMappings && item.recipeCuisineMappings.length > 0) {
      item.recipeCuisineMappings.forEach((rcm: MstRecipeCuisineMapping) => {
        cuisines.push({
          recipeCuisineId: rcm.recipeCuisineId,
          recipeId: rcm.recipeId,
          recipeCuisine: rcm.recipeCuisine.recipeCuisine,
        });
      });
    }
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
      imagePath: CommonFunctionsUtil.buildImageUrl(item.imagePath),
      servingCount: item.servingCount,
      downloadPath: item.downloadPath,
      seo: {
        url: item.url,
      },
      visitedCount: item.visitedCount,
      shareCount: item.shareCount,
      isVisibleToAll: item.isVisibleToAll,
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
      recipeCategoryMappings: categories,
      recipeCuisineMappings: cuisines,
    };
  }

  public async fetchById(id: number): Promise<IRecipe> {
    const find = await this.recipeRepository.scope('details').findOne({
      where: { recipeId: id },
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Recipe not found');
    }
    return this.convertToModel(find.get({ plain: true }));
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
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      servingCount: obj.servingCount,
      downloadPath: obj.downloadPath || null,
      url: obj.seo
        ? obj.seo.url
        : CommonFunctionsUtil.removeSpecialChar(obj.name.toString().toLowerCase(), '-'),
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
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      servingCount: obj.servingCount,
      downloadPath: obj.downloadPath || null,
      url: obj.seo
        ? obj.seo.url
        : CommonFunctionsUtil.removeSpecialChar(obj.name.toString().toLowerCase(), '-'),
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

  public async downloadRecipePdf(recipeId: number): Promise<IFileModel> {
    const recipe = await this.recipeRepository.scope('details').findOne({
      where: { recipeId },
      nest: true,
    });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    const recipeData = recipe.get({ plain: true });
    // Fetch primary franchise for header information
    let franchise = null;
    try {
      const franchiseList = await this.franchiseService.findAll({ page: 0, limit: 100 });
      franchise = franchiseList.tableData.find((f: any) => f.isPrimary) || franchiseList.tableData[0];
    } catch (error) {
      console.warn('Could not fetch franchise information', error);
    }
    // Prepare recipe data for PDF template
    const recipeObj = {
      id: recipeData.recipeId,
      name: recipeData.name,
      howToMake: recipeData.howToMake || recipeData.preparationMethod || '',
      ingredient: recipeData.ingredient || '',
      imagePath: recipeData.imagePath || [],
      serving: recipeData.servingCount || 0,
      recipeType: recipeData.recipeType?.recipeType || '',
      franchise: franchise,
    };
    // Generate PDF using the PdfService
    const fileName = `${recipeData.name
      .replace(/[^\w\s]/gi, '')
      .replace(/ /g, '_')}_${recipeId}`;
    return await this.pdfService.generatePDF(
      'recipe',
      MediaForEnum.RECIPE,
      fileName,
      recipeObj,
    );
  }

  /**
   * Lightweight search for dropdown options
   * Searches only on recipe name and recipe type
   * Returns minimal data: id, title (recipe name), subtitle (recipe type)
   */
  public async searchForDropdown(searchDto: IBasicSearch): Promise<Array<{ id: number; title: string; subtitle: string }>> {
    const whereCondition: any = {
      active: true, // Only return active recipes
    };

    // Build search condition for recipe name and recipe type
    const searchTerm = searchDto.search || searchDto.name;
    if (searchTerm) {
      whereCondition[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { '$recipeType.recipeType$': { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }

    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 10;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows } = await this.recipeRepository.findAndCountAll({
      attributes: ['recipeId', 'name'],
      include: [
        {
          model: MstRecipeType,
          as: 'recipeType',
          required: false,
          attributes: ['recipeType'],
        },
      ],
      where: whereCondition,
      order: [['name', 'ASC']],
      offset: offset,
      limit: pageSize,
      nest: true,
      raw: false,
    });

    return rows.map((item: any) => {
      const plain = item.get({ plain: true });
      return {
        id: plain.recipeId,
        title: plain.name,
        subtitle: plain.recipeType?.recipeType || '',
      };
    });
  }
}

