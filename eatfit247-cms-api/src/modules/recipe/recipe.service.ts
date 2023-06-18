import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../common/exception.service';
import { UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { IServerResponse } from '../../common-dto/response-interface';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../constants/config-constants';
import { ServerResponseEnum } from '../../enums/server-response-enum';
import { StringResource } from '../../enums/string-resource';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import * as moment from 'moment/moment';
import { MstRecipe } from '../../core/database/models/mst-recipe.model';
import { CreateRecipeDto, RecipeFilterDto } from './dto/recipe.dto';
import { IRecipe, IRecipeCategoryMapped, IRecipeCuisineMapped } from '../../response-interface/recipe.interface';
import { MstRecipeType } from '../../core/database/models/mst-recipe-type.model';
import { MstRecipeCategoryMapping } from '../../core/database/models/mst-recipe-category-mapping.model';
import { MstRecipeCuisineMapping } from '../../core/database/models/mst-recipe-cuisine-mapping.model';
import { MstRecipeCategory } from '../../core/database/models/mst-recipe-category.model';
import { Sequelize } from 'sequelize-typescript';
import { MstRecipeCuisine } from '../../core/database/models/mst-recipe-cuisine.model';
import { DropdownListInterface } from '../../response-interface/dropdown-list.interface';
import { Op } from 'sequelize';
import { SearchUtil } from 'src/util/search-util';
import { PDFTemplateEnum } from 'src/enums/pdf-template-enum';
import { MediaFolderEnum } from 'src/enums/media-folder-enum';
import { PdfService } from 'src/core/pdf/pdf.service';
import { intersection, uniq } from 'lodash';

@Injectable()
export class RecipeService {
  constructor(
    @InjectModel(MstRecipe) private readonly recipeRepository: typeof MstRecipe,
    @InjectModel(MstRecipeCategoryMapping)
    private readonly recipeCategoryMappingRepository: typeof MstRecipeCategoryMapping,
    @InjectModel(MstRecipeCuisineMapping)
    private readonly recipeCuisineMappingRepository: typeof MstRecipeCuisineMapping,
    private exceptionService: ExceptionService,
    private pdfService: PdfService,
    private sequelize: Sequelize,
  ) {}

  public async findAll(searchDto: RecipeFilterDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const whereCondition: any = {};
      if (searchDto.name) {
        whereCondition['name'] = { [Op.iLike]: `%${searchDto.name}%` };
      }
      if (searchDto.active) {
        whereCondition['active'] = searchDto.active;
      }
      const dateFilter = SearchUtil.filterDateRange(searchDto.createdFrom, searchDto.createdTo);
      if (dateFilter) {
        whereCondition['createdAt'] = dateFilter;
      }
      if (searchDto.recipeTypeId && searchDto.recipeTypeId > 0) {
        whereCondition['recipeTypeId'] = searchDto.recipeTypeId;
      }
      let recipeIdList = [];
      let loopCount = 0;
      //CUISINE IDS
      if (searchDto.recipeCuisineIds && searchDto.recipeCuisineIds.length > 0) {
        const cuisineResult = await this.recipeCuisineMappingRepository.findAll({
          attributes: ['recipeId'],
          where: {
            recipeCuisineId: {
              [Op.in]: searchDto.recipeCuisineIds.split(','),
            },
          },
        });
        recipeIdList = uniq(cuisineResult.map((x) => x.recipeId));
        loopCount = loopCount + 1;
      }
      //CATEGORIES
      if (searchDto.recipeCategoryIds && searchDto.recipeCategoryIds.length > 0) {
        const categoryResult = await this.recipeCategoryMappingRepository.findAll({
          attributes: ['recipeId'],
          where: {
            recipeCategoryId: {
              [Op.in]: searchDto.recipeCategoryIds.split(','),
            },
          },
        });
        const recipeIds = uniq(categoryResult.map((x) => x.recipeId));
        if (loopCount > 0) {
          recipeIdList = intersection(recipeIdList, recipeIds);
        } else {
          recipeIdList = recipeIds;
        }
        loopCount = loopCount + 1;
      }
      if (loopCount > 0) {
        whereCondition['recipeId'] = {
          [Op.in]: recipeIdList,
        };
      }
      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
      const { rows, count } = await this.recipeRepository.findAndCountAll<MstRecipe>({
        include: [
          {
            model: MstRecipeType,
            required: true,
          },
          {
            model: MstAdminUser,
            required: false,
            as: 'CreatedBy',
            attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
          },
          {
            model: MstAdminUser,
            required: false,
            as: 'ModifiedBy',
            attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
          },
        ],
        where: whereCondition,
        order: [['name', 'ASC']],
        offset: offset,
        limit: pageSize,
        raw: true,
        nest: true,
      });
      if (!rows || rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      }
      const resList: IRecipe[] = [];
      for (const s of rows) {
        const iEvent: IRecipe = {
          id: s.recipeId,
          title: s.name,
          details: s.details,
          recipeTypeId: s.recipeTypeId,
          recipeType: s.recipeType.recipeType,
          preparationMethod: s.howToMake,
          ingredients: s.ingredient,
          benefits: s.benefits,
          shareCount: s.shareCount,
          servingCount: s.servingCount,
          visitedCount: s.visitedCount,
          isVisibleToAll: s.isVisibleToAll,
          tags: s.tags ? s.tags.split(', ') : null,
          url: s.url,
          active: s.active,
          downloadPath: s.downloadPath,
          imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
          createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
          createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
          recipeCategoryList: null, // await this.getRecipeCategoryList(s.recipeId),
          recipeCuisineList: null, //await this.getRecipeCuisineList(s.recipeId)
        };
        resList.push(iEvent);
      }
      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
          list: resList,
          count: count,
        },
      };
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async fetchById(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.recipeRepository.findOne({
        where: {
          recipeId: id,
        },
      });
      if (find) {
        const dataObj = <IRecipe>{
          id: find.recipeId,
          title: find.name,
          details: find.details,
          recipeTypeId: find.recipeTypeId,
          preparationMethod: find.howToMake,
          ingredients: find.ingredient,
          benefits: find.benefits,
          shareCount: find.shareCount,
          servingCount: find.servingCount,
          visitedCount: find.visitedCount,
          isVisibleToAll: find.isVisibleToAll,
          tags: find.tags ? find.tags.split(', ') : null,
          url: find.url,
          active: find.active,
          imagePath: CommonFunctionsUtil.getImagesObj(find.imagePath),
          createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
          createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
          recipeCategoryList: await this.getRecipeCategoryList(find.recipeId),
          recipeCuisineList: await this.getRecipeCuisineList(find.recipeId),
        };
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: dataObj,
        };
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async create(obj: CreateRecipeDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    const t = await this.sequelize.transaction();
    try {
      const createObj = {
        name: obj.title,
        details: obj.details,
        recipeTypeId: obj.recipeTypeId,
        ingredient: obj.ingredients,
        howToMake: obj.preparationMethod,
        benefits: obj.benefits,
        visitedCount: 0,
        servingCount: obj.servingCount,
        shareCount: 0,
        url: CommonFunctionsUtil.removeSpecialChar(obj.title.toString().toLowerCase(), '-'),
        tags: obj.tags,
        active: obj.active,
        imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const createdObj = await this.createInDB(createObj);
      const createCuisineObj = await this.createRecipeCuisineMapping(
        createdObj['recipeId'],
        obj.recipeCuisineIds,
        adminId,
        cIp,
      );
      const createCategoryObj = await this.createRecipeCategoryMapping(
        createdObj['recipeId'],
        obj.recipeCategoryIds,
        adminId,
        cIp,
      );
      if (createdObj && createCuisineObj && createCategoryObj) {
        await t.commit();
        //GENERATE PDF
        this.generateRecipePdf(createdObj['recipeId'], createObj);
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS_DATA_UPDATE,
          data: null,
        };
      } else {
        await t.rollback();
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null,
        };
      }
      return res;
    } catch (e) {
      await t.rollback();
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async update(id: number, obj: CreateRecipeDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.recipeRepository.findOne({
        where: {
          recipeId: id,
        },
      });
      if (find) {
        const t = await this.sequelize.transaction();
        const updateObj = {
          name: obj.title,
          details: obj.details,
          recipeTypeId: obj.recipeTypeId,
          ingredient: obj.ingredients,
          howToMake: obj.preparationMethod,
          benefits: obj.benefits,
          visitedCount: 0,
          servingCount: obj.servingCount,
          shareCount: 0,
          tags: obj.tags,
          imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
          active: obj.active != null ? obj.active : find.active,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObjResult = await this.updateInDB(id, updateObj);
        const createCuisineObj = await this.createRecipeCuisineMapping(id, obj.recipeCuisineIds, adminId, cIp);
        const createCategoryObj = await this.createRecipeCategoryMapping(id, obj.recipeCategoryIds, adminId, cIp);
        if (updatedObjResult && createCuisineObj && createCategoryObj) {
          await t.commit();
          //GENERATE PDF
          this.generateRecipePdf(id, updateObj);
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_UPDATE,
            data: null,
          };
        } else {
          await t.rollback();
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.recipeRepository.findOne({
        where: {
          recipeId: id,
        },
      });
      if (find) {
        const updateObj = {
          active: obj.active,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_STATUS_CHANGE,
            data: null,
          };
        } else {
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async getAllRecipeDD(): Promise<DropdownListInterface[]> {
    const list: DropdownListInterface[] = [];
    const temp = await this.recipeRepository.findAll({ where: { active: true }, order: [['name', 'ASC']] });
    for (const s of temp) {
      list.push(<DropdownListInterface>{
        id: s.recipeId,
        name: s.name,
        selected: false,
      });
    }
    return list;
  }

  public async fetchByIds(ids: number[]) {
    const records = await this.recipeRepository.findAll({
      include: [
        {
          model: MstRecipeType,
          required: true,
        },
      ],
      where: {
        recipeId: {
          [Op.in]: ids,
        },
      },
    });
    const recipes = records.map((x) => {
      return {
        id: x.recipeId,
        title: x.name,
        preparationMethod: x.howToMake,
        ingredients: x.ingredient,
        imagePath: x.imagePath,
        serving: x.servingCount,
        recipeType: x.recipeType.recipeType,
      };
    });
    return recipes;
  }

  async generateRecipePdf(recipeId: number, recipeObj: any) {
    const name = `${recipeObj.name
      .replace(/[^\w\s]/gi, '')
      .replace(/ /g, '_')}_${recipeId}`;
    const fileModel = await this.pdfService.generatePDF(
      `${PDFTemplateEnum.RECIPE}`,
      `${MediaFolderEnum.RECIPES}`,
      name,
      recipeObj
    );
    if (fileModel) {
      await this.updateDownloadPath(recipeId, {
        downloadPath: fileModel.filePath,
      });
    }
    return fileModel;
  }

  private async createInDB(obj: any) {
    return await this.recipeRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.recipeRepository
      .update(obj, { where: { recipeId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async getRecipeCategoryList(recipeId: number): Promise<IRecipeCategoryMapped[]> {
    const tempList = await this.recipeCategoryMappingRepository.findAll({
      include: [
        {
          model: MstRecipeCategory,
          required: true,
        },
      ],
      where: { recipeId: recipeId, active: true },
      raw: true,
      nest: true,
    });
    const list: IRecipeCategoryMapped[] = [];
    for (const s of tempList) {
      list.push(<IRecipeCategoryMapped>{
        recipeCategoryId: s.recipeCategoryId,
        recipeCategory: s.recipeCategory.recipeCategory,
        recipeId: s.recipeId,
      });
    }
    return list;
  }

  private async getRecipeCuisineList(recipeId: number): Promise<IRecipeCuisineMapped[]> {
    const tempList = await this.recipeCuisineMappingRepository.findAll({
      include: [
        {
          model: MstRecipeCuisine,
          required: true
        },
      ],
      where: { recipeId: recipeId, active: true },
      raw: true,
      nest: true,
    });
    const list: IRecipeCuisineMapped[] = [];
    for (const s of tempList) {
      list.push(<IRecipeCuisineMapped>{
        recipeCuisineId: s.recipeCuisineId,
        recipeCuisine: s.recipeCuisine.recipeCuisine,
        recipeId: s.recipeId,
      });
    }
    return list;
  }

  private async createRecipeCuisineMapping(
    recipeId: number,
    recipeCuisineIds: number[],
    adminId: number,
    cIp: string,
  ): Promise<boolean> {
    try {
      await this.recipeCuisineMappingRepository.destroy({
        where: {
          recipeId: recipeId,
        },
      });
      const tempList = [];
      for (const s of recipeCuisineIds) {
        tempList.push({
          recipeId: recipeId,
          recipeCuisineId: s,
          active: true,
          createdBy: adminId,
          modifiedBy: adminId,
          createdIp: cIp,
          modifiedIp: cIp,
        });
      }
      await this.recipeCuisineMappingRepository.bulkCreate(tempList);
      return true;
    } catch (e) {
      this.exceptionService.logException(e);
      return false;
    }
  }

  private async createRecipeCategoryMapping(
    recipeId: number,
    recipeCategoryIds: number[],
    adminId: number,
    cIp: string,
  ): Promise<boolean> {
    try {
      await this.recipeCategoryMappingRepository.destroy({
        where: {
          recipeId: recipeId,
        },
      });
      const tempList = [];
      for (const s of recipeCategoryIds) {
        tempList.push({
          recipeId: recipeId,
          recipeCategoryId: s,
          active: true,
          createdBy: adminId,
          modifiedBy: adminId,
          createdIp: cIp,
          modifiedIp: cIp,
        });
      }
      await this.recipeCategoryMappingRepository.bulkCreate(tempList);
      return true;
    } catch (e) {
      this.exceptionService.logException(e);
      return false;
    }
  }

  private async updateDownloadPath(id: number, obj: any) {
    return await this.recipeRepository
      .update(obj, { where: { recipeId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
