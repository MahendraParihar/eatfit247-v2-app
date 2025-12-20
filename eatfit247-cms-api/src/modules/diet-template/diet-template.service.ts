import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnDietTemplateDietDetail } from '../../core/database/models/txn-diet-template-diet-detail.model';
import { BasicSearchDto, UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch, IDropdownItem } from 'shared-lib';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import moment from 'moment';
import * as _ from 'lodash';
import { TxnDietTemplate } from '../../core/database/models/txn-diet-template.model';
import { IDietDetailTemplate, IDietTemplate } from 'shared-lib';
import { CreateDietTemplateDto } from './dto/diet-template.dto';
import { IDietDetail } from 'shared-lib';
import { SearchUtil } from 'src/util/search-util';
import { RecipeCategoryService } from '../lov/services/recipe-category.service';
import { RecipeService } from '../recipe/recipe.service';
import { IDietPlanDetail } from 'shared-lib';
import { MstRecipeCategory } from 'src/core/database/models/mst-recipe-category.model';
import { IDietTemplateDetail } from 'shared-lib';
import { DietTemplateDetailDto } from './dto/diet-template-detail.dto';
import { Sequelize } from 'sequelize-typescript';
import { DietPlanDetailDto } from '../member/dto/member-diet-plan-detail.dto';

@Injectable()
export class DietTemplateService {
  constructor(
    @InjectModel(TxnDietTemplate) private readonly dietTemplateRepository: typeof TxnDietTemplate,
    @InjectModel(TxnDietTemplateDietDetail) private readonly dietPlanDetailRepository: typeof TxnDietTemplateDietDetail,
    private sequelize: Sequelize,
    private recipeCategory: RecipeCategoryService,
    private recipeService: RecipeService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IDietTemplate>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'dietTemplate');
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.dietTemplateRepository.findAndCountAll<TxnDietTemplate>({
      include: [
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
      order: [['dietTemplate', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IDietTemplate[] = [];
    for (const s of rows) {
      const iEvent: IDietTemplate = {
        id: s.dietTemplateId,
        name: s.dietTemplate,
        noOfCycle: s.noOfCycle,
        noOfDaysInCycle: s.noOfDaysInCycle,
        isWeekly: s.isWeekly,
        active: s.active,
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }
    return <ITableList<IDietTemplate>>{
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IDietTemplate> {
    const find = await this.dietTemplateRepository.findOne({
      where: {
        dietTemplateId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <IDietTemplate>{
      id: find.dietTemplateId,
      name: find.dietTemplate,
      noOfCycle: find.noOfCycle,
      noOfDaysInCycle: find.noOfDaysInCycle,
      isWeekly: find.isWeekly,
      active: find.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  public async create(obj: CreateDietTemplateDto, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      dietTemplate: obj.name,
      noOfCycle: obj.noOfCycle,
      noOfDaysInCycle: obj.noOfDaysInCycle,
      isWeekly: obj.isWeekly,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(id: number, obj: CreateDietTemplateDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.dietTemplateRepository.findOne({
      where: {
        dietTemplateId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      dietTemplate: obj.name,
      noOfCycle: obj.noOfCycle,
      noOfDaysInCycle: obj.noOfDaysInCycle,
      isWeekly: obj.isWeekly,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.dietTemplateRepository.findOne({
      where: {
        dietTemplateId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async fetchDietDetail(id: number): Promise<IDietDetailTemplate[]> {
    const dietPlan = await this.dietTemplateRepository.findOne<TxnDietTemplate>({
      where: {
        dietTemplateId: id,
      },
      raw: true,
    });
    if (!dietPlan) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const dietPlanDetails = await this.dietPlanDetailRepository.findAll({
      where: {
        dietTemplateId: id,
      },
      raw: true,
      nest: true,
    });
    const tempList = [];
    if (dietPlan.isWeekly) {
      for (let i = 1; i <= dietPlan.noOfCycle; i++) {
        const tempDetail = _.find(dietPlanDetails, { cycleNumber: i });
        const dietDetails: IDietDetail[] = [];
        if (tempDetail) {
        }
        tempList.push(<IDietDetailTemplate>{
          id: null,
          cycleNo: i,
          dayNo: null,
          dietPlanId: id,
          dietDetail: null,
        });
      }
    } else {
    }
    return tempList;
  }

  public async fetchDietPlanDetail(
    dietTemplateId: number,
    cycleNo: number,
    dayNo: number = null,
  ): Promise<{ recipes: IDropdownItem[]; diet: IDietTemplateDetail }> {
    cycleNo = cycleNo ? Number(cycleNo) : cycleNo;
    dayNo = dayNo ? Number(dayNo) : dayNo;
    dietTemplateId = dietTemplateId ? Number(dietTemplateId) : dietTemplateId;
    const templateDetail = await this.dietTemplateRepository.findOne({
      where: {
        dietTemplateId: dietTemplateId,
      },
      raw: true,
      nest: true,
    });
    if (!templateDetail) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    //IF TEMPLATE IS DAILY AND DAY NUMBER NOT PASSED FROM FRONT END THEN CONSIDER IT AS 1
    if (!templateDetail.isWeekly && !(dayNo && dayNo > 0)) {
      dayNo = 1;
    }
    const whereCondition = {
      dietTemplateId: dietTemplateId,
      cycleNumber: cycleNo,
    };
    if (dayNo) {
      whereCondition['dayNumber'] = dayNo;
    }
    let dietCategory: IDietPlanDetail[] = [];
    const [categoryList, dietDetail, recipeList] = await Promise.all([
      this.recipeCategory.fetchAllRecipeCategory(),
      this.dietPlanDetailRepository.findOne({
        where: whereCondition,
        raw: true,
        nest: true,
      }),
      this.recipeService.getAllRecipeDD(),
    ]);
    dietCategory = this.convertDietDetail(categoryList, recipeList, dietDetail);
    return {
      recipes: recipeList,
      diet: <IDietTemplateDetail>{
        dayNo: dayNo,
        cycleNo: cycleNo,
        isWeekly: templateDetail.isWeekly,
        dietTemplateId: dietTemplateId,
        noOfCycle: templateDetail.noOfCycle,
        noOfDaysInCycle: templateDetail.noOfDaysInCycle,
        id: dietDetail ? dietDetail.id : null,
        dietPlan: dietCategory,
      },
    };
  }

  public async updateDietTemplatePlanDetail(body: DietTemplateDetailDto, cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const dietPlanDetail = await this.dietTemplateRepository.findOne({
        where: {
          dietTemplateId: body.dietTemplateId,
        },
      });
      if (!dietPlanDetail) {
        throw new NotFoundException(StringResource.NO_DIET_PLAN_FOUND);
      }
      const condition = {
        cycleNumber: body.cycleNo,
        dietTemplateId: body.dietTemplateId,
      };
      if (body.dayNo && body.dayNo > 0) {
        condition['dayNumber'] = body.dayNo;
      }
      const planArray: DietPlanDetailDto[] = [];
      for (const s of body.dietPlan) {
        if (s.dietDetail || s.recipeIds) {
          planArray.push(s);
        }
      }
      const dietDObj: any = {
        cycleNumber: body.cycleNo,
        dietTemplateId: body.dietTemplateId,
        dayNumber: body.dayNo && body.dayNo > 0 ? body.dayNo : null,
        dietDetail: planArray,
        // modifiedIp: cIp,
        // modifiedBy: adminId
      };
      const findD = await this.dietPlanDetailRepository.findOne({
        where: condition,
      });
      if (findD) {
        await this.dietPlanDetailRepository.update(dietDObj, {
          where: condition,
        });
      } else {
        // dietDObj["createdBy"] = adminId;
        //dietDObj["createdIp"] = cIp;
        await this.dietPlanDetailRepository.create(dietDObj);
      }
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async getAllDietTemplateDD(): Promise<IDropdownItem[]> {
    const list: IDropdownItem[] = [];
    const temp = await this.dietTemplateRepository.findAll({
      where: { active: true },
      attributes: ['dietTemplateId', 'dietTemplate'],
    });
    for (const s of temp) {
      list.push(<IDropdownItem>{
        id: s.dietTemplateId,
        label: s.dietTemplate,
        selected: false,
      });
    }
    return list;
  }

  public async getAllDietDetailsByTemplateId(dietTemplateId: number): Promise<TxnDietTemplateDietDetail[]> {
    const list = await this.dietPlanDetailRepository.findAll({
      where: {
        dietTemplateId: dietTemplateId,
      },
    });
    return list;
  }

  public async getDietTemplate(dietTemplateId: number): Promise<TxnDietTemplate> {
    const dietTemplate = await this.dietTemplateRepository.findOne({
      where: {
        dietTemplateId: dietTemplateId,
      },
    });
    return dietTemplate;
  }

  private async createInDB(obj: any) {
    return await this.dietTemplateRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.dietTemplateRepository.update(obj, { where: { dietTemplateId: id } });
  }

  private convertDietDetail(
    categoryList: MstRecipeCategory[],
    recipeList: IDropdownItem[],
    dietDetail: any,
  ): IDietPlanDetail[] {
    const dietCategory: IDietPlanDetail[] = [];
    for (const c of categoryList) {
      const f = dietDetail ? _.find(dietDetail.dietDetail, { recipeCategoryId: c.recipeCategoryId }) : null;
      const dietRecipeList = [];
      if (f) {
        for (const r of f['recipeIds']) {
          const tR = _.find(recipeList, { id: r });
          if (tR) {
            dietRecipeList.push(tR);
          }
        }
      }
      dietCategory.push(<IDietPlanDetail>{
        dietDetail: f ? f['dietDetail'] : null,
        recipeIds: f ? f['recipeIds'] : [],
        recipeList: dietRecipeList,
        recipeCategory: c.recipeCategory,
        recipeCategoryId: c.recipeCategoryId,
        sequence: c.sequence,
      });
    }
    return dietCategory;
  }
}
