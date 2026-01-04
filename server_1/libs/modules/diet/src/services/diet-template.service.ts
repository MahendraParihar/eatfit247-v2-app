import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { TxnDietTemplate, TxnDietTemplateDietDetail } from '../models';
import {
  ITableList,
  IBasicSearch,
  IDietTemplate,
  IManageDietTemplate,
  IDietTemplateDetail,
  IDietPlanDetail,
  IDropdownItem,
} from '@eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil } from '@server_1/core';
import { RecipeCategoryService, RecipeService } from '@server_1/modules/recipe';
import { DietTemplateDetailDto } from '../dto';
import * as _ from 'lodash';

@Injectable()
export class DietTemplateService {
  constructor(
    @InjectModel(TxnDietTemplate)
    private readonly dietTemplateRepository: typeof TxnDietTemplate,
    @InjectModel(TxnDietTemplateDietDetail)
    private readonly dietTemplateDetailRepository: typeof TxnDietTemplateDietDetail,
    private readonly recipeCategoryService: RecipeCategoryService,
    private readonly recipeService: RecipeService,
    private readonly sequelize: Sequelize,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IDietTemplate>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'dietTemplate');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.dietTemplateRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['dietTemplate', 'ASC'], ['cycleNo', 'ASC'], ['dayNo', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: false,
      nest: true,
    });
    const resList: IDietTemplate[] = rows.map((item: TxnDietTemplate) => {
      return this.convertToModel(item.toJSON());
    });
    return {
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IDietTemplate> {
    const find = await this.dietTemplateRepository.scope('details').findOne({
      where: { dietTemplateId: id },
      raw: false,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Diet template not found');
    }
    const template = find.toJSON();
    const dietDetails = await this.dietTemplateDetailRepository.findAll({
      where: { dietTemplateId: id },
      raw: false,
      nest: true,
    });
    const dietDetail = dietDetails.length > 0 ? this.convertDetailToModel(dietDetails[0].toJSON()) : undefined;
    return {
      ...this.convertToModel(template),
      dietDetail: dietDetail || {} as IDietTemplateDetail,
    };
  }

  public async create(obj: IManageDietTemplate, cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const createObj: any = {
        dietTemplate: obj.dietTemplate,
        cycleNo: obj.cycleNo,
        dayNo: obj.dayNo,
        noOfCycle: obj.noOfCycle || null,
        daysInCycle: obj.noOfDaysInCycle || null,
        active: true,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      await this.dietTemplateRepository.create(createObj, { transaction: t });
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async update(id: number, obj: IManageDietTemplate, cIp: string, adminId: number): Promise<void> {
    const find = await this.dietTemplateRepository.findOne({
      where: { dietTemplateId: id },
    });
    if (!find) {
      throw new NotFoundException('Diet template not found');
    }
    const t = await this.sequelize.transaction();
    try {
      const updateObj: any = {
        dietTemplate: obj.dietTemplate,
        cycleNo: obj.cycleNo,
        dayNo: obj.dayNo,
        noOfCycle: obj.noOfCycle || null,
        daysInCycle: obj.noOfDaysInCycle || null,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };
      await this.dietTemplateRepository.update(updateObj, {
        where: { dietTemplateId: id },
        transaction: t,
      });
      // Update or create diet detail
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.dietTemplateRepository.findOne({
      where: { dietTemplateId: id },
    });
    if (!find) {
      throw new NotFoundException('Diet template not found');
    }
    await this.dietTemplateRepository.update(
      {
        active,
        modifiedBy: adminId,
        modifiedIp: cIp,
      },
      { where: { dietTemplateId: id } },
    );
  }

  private convertToModel(item: any): IDietTemplate {
    return {
      dietTemplateId: item.dietTemplateId,
      dietTemplate: item.dietTemplate,
      cycleNo: item.cycleNo,
      dayNo: item.dayNo,
      noOfCycle: item.noOfCycle,
      noOfDaysInCycle: item.daysInCycle,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
      dietDetail: {} as IDietTemplateDetail, // Will be populated separately
    };
  }

  private convertDetailToModel(item: any): IDietTemplateDetail {
    return {
      dietTemplateDietDetailId: item.dietTemplateDietDetailId,
      dietTemplateId: item.dietTemplateId,
      cycleNo: item.cycleNo,
      dayNo: item.dayNo,
      dietDetail: item.dietDetail,
    };
  }

  /**
   * Fetch diet template detail for a specific cycle/day
   * @param dietTemplateId - Diet template ID
   * @param cycleNo - Cycle number
   * @param dayNo - Day number (optional)
   * @param copyFromCycleNo - Copy from cycle number (optional)
   * @param copyFromDayNo - Copy from day number (optional)
   * @returns Diet detail with recipes
   */
  public async fetchDietTemplateDetail(
    dietTemplateId: number,
    cycleNo: number,
    dayNo: number = null,
    copyFromCycleNo: number = null,
    copyFromDayNo: number = null,
  ): Promise<{
    recipes: IDropdownItem[];
    diet: {
      dietTemplateId: number;
      cycleNo: number;
      dayNo?: number;
      noOfCycle: number;
      noOfDaysInCycle: number;
      dietPlan: IDietPlanDetail[];
    };
  }> {
    cycleNo = cycleNo ? Number(cycleNo) : cycleNo;
    dayNo = dayNo ? Number(dayNo) : dayNo;
    dietTemplateId = dietTemplateId ? Number(dietTemplateId) : dietTemplateId;

    const where: any = {
      dietTemplateId: dietTemplateId,
      cycleNo: cycleNo,
    };
    if (dayNo) {
      where.dayNo = dayNo;
    }
    if (copyFromCycleNo) {
      where.cycleNo = copyFromCycleNo;
    }
    if (copyFromDayNo) {
      where.dayNo = copyFromDayNo;
    }

    let dietCategory: IDietPlanDetail[] = [];
    const [categoryList, templateDetail, dietDetail, recipeList] = await Promise.all([
      this.recipeCategoryService.getRecipeCategoryList(),
      this.dietTemplateRepository.findOne({
        where: {
          dietTemplateId: dietTemplateId,
          active: true,
        },
        raw: true,
        nest: true,
      }),
      this.dietTemplateDetailRepository.findOne({
        where: where,
        nest: true,
        raw: true,
      }),
      this.getRecipeDropdownList(),
    ]);

    if (!templateDetail) {
      throw new NotFoundException('Diet template not found');
    }

    dietCategory = this.convertDietDetail(categoryList, recipeList, dietDetail);

    return {
      recipes: recipeList as IDropdownItem[],
      diet: {
        dietTemplateId: templateDetail.dietTemplateId,
        dayNo: dayNo,
        cycleNo: cycleNo,
        noOfCycle: templateDetail.noOfCycle,
        noOfDaysInCycle: templateDetail.daysInCycle,
        dietPlan: dietCategory,
      },
    };
  }

  /**
   * Create or update diet template detail
   * @param dietTemplateId - Diet template ID
   * @param body - Diet template detail DTO
   * @param cIp - Client IP
   * @param adminId - Admin ID
   */
  public async createDietTemplateDetail(
    dietTemplateId: number,
    body: DietTemplateDetailDto,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const template = await this.dietTemplateRepository.findOne({
        where: {
          dietTemplateId: dietTemplateId,
        },
      });
      if (!template) {
        await t.rollback();
        throw new NotFoundException('Diet template not found');
      }

      const condition: any = {
        cycleNo: body.cycleNo,
        dietTemplateId: body.dietTemplateId,
      };
      if (body.dayNo && body.dayNo > 0) {
        condition.dayNo = body.dayNo;
      }

      const planArray: any[] = [];
      for (const s of body.dietPlan) {
        if (s.dietDetail || s.recipeIds) {
          planArray.push({
            recipeCategoryId: s.recipeCategoryId,
            recipeCategory: s.recipeCategory,
            dietDetail: s.dietDetail || '',
            sequence: s.sequence || 0,
            recipeIds: s.recipeIds || [],
          });
        }
      }

      const findD = await this.dietTemplateDetailRepository.findOne({
        where: condition,
        transaction: t,
      });

      const dietDObj: any = {
        cycleNo: body.cycleNo,
        dietTemplateId: body.dietTemplateId,
        dayNo: body.dayNo && body.dayNo > 0 ? body.dayNo : null,
        dietDetail: planArray,
      };

      if (findD) {
        await this.dietTemplateDetailRepository.update(dietDObj, {
          where: condition,
          transaction: t,
        });
      } else {
        await this.dietTemplateDetailRepository.create(dietDObj, { transaction: t });
      }

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  private convertDietDetail(
    categoryList: IDropdownItem[],
    recipeList: IDropdownItem[],
    dietDetail: TxnDietTemplateDietDetail,
  ): IDietPlanDetail[] {
    const dietCategory: IDietPlanDetail[] = [];
    const existingDietPlan = dietDetail && dietDetail.dietDetail ? (dietDetail.dietDetail as any) : [];

    for (const c of categoryList) {
      const f = existingDietPlan.find((x: any) => x.recipeCategoryId === c.id);
      const dietRecipeList = [];
      if (f) {
        for (const r of f.recipeIds || []) {
          const tR = _.find(recipeList, { id: r });
          if (tR) {
            dietRecipeList.push(tR);
          }
        }
      }
      dietCategory.push({
        dietDetail: f ? f.dietDetail : null,
        recipeIds: f ? f.recipeIds : [],
        recipeList: dietRecipeList,
        recipeCategory: c.label,
        recipeCategoryId: c.id,
        sequence: f ? f.sequence : 0,
      });
    }
    return dietCategory;
  }

  private async getRecipeDropdownList(): Promise<IDropdownItem[]> {
    const result = await this.recipeService.findAll({ page: 0, limit: 1000 });
    return result.tableData.map((recipe: any) => ({
      id: recipe.recipeId,
      label: recipe.name,
      isActive: recipe.active,
    }));
  }
}
