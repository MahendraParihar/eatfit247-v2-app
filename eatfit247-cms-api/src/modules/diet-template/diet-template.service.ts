import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnDietTemplateDietDetail } from '../../core/database/models/txn-diet-template-diet-detail.model';
import { BasicSearchDto, UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { IServerResponse } from '../../common-dto/response-interface';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../constants/config-constants';
import { ServerResponseEnum } from '../../enums/server-response-enum';
import { StringResource } from '../../enums/string-resource';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import * as moment from 'moment';
import * as _ from 'lodash';
import { TxnDietTemplate } from '../../core/database/models/txn-diet-template.model';
import { ExceptionService } from '../common/exception.service';
import { IDietDetailTemplate, IDietTemplate } from '../../response-interface/diet-template.interface';
import { CreateDietTemplateDto } from './dto/diet-template.dto';
import { IDietDetail } from '../../response-interface/diet-detail.interface';
import { SearchUtil } from 'src/util/search-util';
import { RecipeCategoryService } from '../lov/services/recipe-category.service';
import { RecipeService } from '../recipe/recipe.service';
import { DropdownListInterface } from 'src/response-interface/dropdown-list.interface';
import { IDietPlanDetail } from 'src/response-interface/member-diet-plan.interface';
import { MstRecipeCategory } from 'src/core/database/models/mst-recipe-category.model';
import { IDietTemplateDetail } from 'src/response-interface/diet-template-detail.interface';
import { DietTemplateDetailDto } from './dto/diet-template-detail.dto';
import { Sequelize } from 'sequelize-typescript';
import { DietPlanDetailDto } from '../member/dto/member-diet-plan-detail.dto';

@Injectable()
export class DietTemplateService {
  constructor(
    @InjectModel(TxnDietTemplate) private readonly dietTemplateRepository: typeof TxnDietTemplate,
    @InjectModel(TxnDietTemplateDietDetail) private readonly dietPlanDetailRepository: typeof TxnDietTemplateDietDetail,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
    private recipeCategory: RecipeCategoryService,
    private recipeService: RecipeService,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'dietTemplate');

      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      let offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

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
      if (!rows || rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      }

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
      this.exceptionService.logError(e);
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
      const find = await this.dietTemplateRepository.findOne({
        where: {
          dietTemplateId: id,
        },
      });
      if (find) {
        const dataObj = <IDietTemplate>{
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
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async create(obj: CreateDietTemplateDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
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
      const createdObj = await this.createInDB(createObj);
      if (createdObj) {
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS_DATA_UPDATE,
          data: null,
        };
      } else {
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async update(id: number, obj: CreateDietTemplateDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.dietTemplateRepository.findOne({
        where: {
          dietTemplateId: id,
        },
      });
      if (find) {
        const updateObj = {
          dietTemplate: obj.name,
          noOfCycle: obj.noOfCycle,
          noOfDaysInCycle: obj.noOfDaysInCycle,
          isWeekly: obj.isWeekly,
          active: obj.active != null ? obj.active : find.active,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_UPDATE,
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
      this.exceptionService.logError(e);
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
      const find = await this.dietTemplateRepository.findOne({
        where: {
          dietTemplateId: id,
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
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async fetchDietDetail(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const dietPlan = await this.dietTemplateRepository.findOne<TxnDietTemplate>({
        where: {
          dietTemplateId: id,
        },
        raw: true,
      });
      if (dietPlan) {
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
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
    } catch (e) {
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async fetchDietPlanDetail(
    dietTemplateId: number,
    cycleNo: number,
    dayNo: number = null,
  ): Promise<IServerResponse> {
    let res: IServerResponse;

    cycleNo = cycleNo ? Number(cycleNo) : cycleNo;
    dayNo = dayNo ? Number(dayNo) : dayNo;
    dietTemplateId = dietTemplateId ? Number(dietTemplateId) : dietTemplateId;

    try {
      const templateDetail = await this.dietTemplateRepository.findOne({
        where: {
          dietTemplateId: dietTemplateId,
        },
        raw: true,
        nest: true,
      });

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

      const promiseAll = await Promise.all([
        this.recipeCategory.fetchAllRecipeCategory(),

        this.dietPlanDetailRepository.findOne({
          where: whereCondition,
          raw: true,
          nest: true,
        }),

        this.recipeService.getAllRecipeDD(),
      ]);

      const categoryList = promiseAll[0];
      const dietDetail = promiseAll[1];
      const recipeList = promiseAll[2];

      dietCategory = this.convertDietDetail(categoryList, recipeList, dietDetail);

      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
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
        },
      };
      return res;
    } catch (e) {
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async updateDietTemplatePlanDetail(body: DietTemplateDetailDto, cIp: string, adminId: number) {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const dietPlanDetail = await this.dietTemplateRepository.findOne({
        where: {
          dietTemplateId: body.dietTemplateId,
        },
      });

      if (!dietPlanDetail) {
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.NO_DIET_PLAN_FOUND,
          data: null,
        };
        return res;
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

      let createUpdateDP;

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
        createUpdateDP = await this.dietPlanDetailRepository.update(dietDObj, {
          where: condition,
        });
      } else {
        // dietDObj["createdBy"] = adminId;
        //dietDObj["createdIp"] = cIp;
        createUpdateDP = await this.dietPlanDetailRepository.create(dietDObj);
      }

      if (createUpdateDP) {
        await t.commit();
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
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
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async getAllDietTemplateDD(): Promise<DropdownListInterface[]> {
    const list: DropdownListInterface[] = [];
    const temp = await this.dietTemplateRepository.findAll({
      where: { active: true },
      attributes: ['dietTemplateId', 'dietTemplate'],
    });
    for (const s of temp) {
      list.push(<DropdownListInterface>{
        id: s.dietTemplateId,
        name: s.dietTemplate,
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
    return await this.dietTemplateRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.dietTemplateRepository
      .update(obj, { where: { dietTemplateId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private convertDietDetail(
    categoryList: MstRecipeCategory[],
    recipeList: DropdownListInterface[],
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
