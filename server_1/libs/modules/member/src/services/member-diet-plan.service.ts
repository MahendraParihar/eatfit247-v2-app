import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { TxnMember, TxnMemberDietDetail, TxnMemberDietPlan, TxnMemberPayment } from '../models';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DietPlanStatusEnum,
  DietTypeEnum,
  ICyclePlan,
  IDietPlanDetail,
  IDietPlanRecipes,
  IDropdownItem,
  IMemberDietDetail,
  IMemberDietPlan,
  MediaForEnum,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, Env, MstAdminUser } from '@server_1/core';
import { MstProgram, MstProgramCategory } from '@server_1/modules/program-plan';
import { RecipeCategoryService, RecipeService } from '@server_1/modules/recipe';
import { DietTemplateService, TxnDietTemplateDietDetail } from '@server_1/modules/diet';
import { DietPlanPdfService, IFileModel } from '@server_1/platform';
import { FranchiseService } from '@server_1/modules/franchise';
import { MemberDietPlanDetailDto, MemberDietTemplateDto } from '../dto';
import * as _ from 'lodash';
import moment from 'moment';
import { Transaction } from 'sequelize';
import fs from 'fs';

@Injectable()
export class MemberDietPlanService {
  private readonly logger = new Logger(MemberDietPlanService.name);

  constructor(
    @InjectModel(TxnMemberDietPlan)
    private readonly memberDietPlanRepository: typeof TxnMemberDietPlan,
    @InjectModel(TxnMemberDietDetail)
    private readonly memberDietPlanDetailRepository: typeof TxnMemberDietDetail,
    @InjectModel(TxnDietTemplateDietDetail)
    private readonly dietTemplateDietDetailRepository: typeof TxnDietTemplateDietDetail,
    @InjectModel(TxnMember)
    private readonly memberRepository: typeof TxnMember,
    private readonly recipeCategoryService: RecipeCategoryService,
    private readonly recipeService: RecipeService,
    private readonly dietTemplateService: DietTemplateService,
    private readonly dietPlanPdfService: DietPlanPdfService,
    private readonly franchiseService: FranchiseService,
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Check if a diet plan entry exists for a payment
   * @param memberId - Member ID
   * @param memberPaymentId - Payment ID
   * @param transaction - Optional database transaction
   * @returns True if entry exists, false otherwise
   */
  public async exists(
    memberId: number,
    memberPaymentId: number,
    transaction?: any,
  ): Promise<boolean> {
    const existingDietPlan = await this.memberDietPlanRepository.findOne({
      where: {
        memberId,
        memberPaymentId,
      },
      transaction,
    });
    return !!existingDietPlan;
  }

  /**
   * Create a new member diet plan entry
   * @param memberId - Member ID
   * @param memberPaymentId - Payment ID
   * @param noOfCycle - Number of cycles
   * @param daysInCycle - Days in each cycle
   * @param requestedIp - Request IP
   * @param adminId - Admin user ID
   * @param transaction - Optional database transaction
   * @returns Created diet plan entry
   */
  public async create(
    memberId: number,
    memberPaymentId: number,
    noOfCycle: number,
    daysInCycle: number,
    requestedIp: string,
    adminId: number,
    transaction?: any,
  ): Promise<TxnMemberDietPlan> {
    // Check if entry already exists
    const exists = await this.exists(memberId, memberPaymentId, transaction);
    if (exists) {
      throw new NotFoundException(
        `Diet plan entry already exists for member ${memberId} and payment ${memberPaymentId}`,
      );
    }
    return await this.memberDietPlanRepository.create(
      {
        memberId,
        memberPaymentId,
        noOfCycle,
        daysInCycle,
        currentCycleNo: null,
        currentDayNo: null,
        startDate: null,
        endDate: null,
        isCompleted: false,
        active: true,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: requestedIp,
        modifiedIp: requestedIp,
      },
      { transaction },
    );
  }

  /**
   * Create a member diet plan entry if it doesn't exist
   * This is a safe method that won't throw if entry already exists
   * @param memberId - Member ID
   * @param memberPaymentId - Payment ID
   * @param noOfCycle - Number of cycles
   * @param daysInCycle - Days in each cycle
   * @param requestedIp - Request IP
   * @param adminId - Admin user ID
   * @param transaction - Optional database transaction
   * @returns Created diet plan entry or existing entry
   */
  public async createIfNotExists(
    memberId: number,
    memberPaymentId: number,
    noOfCycle: number,
    daysInCycle: number,
    requestedIp: string,
    adminId: number = null,
    transaction?: Transaction,
  ): Promise<TxnMemberDietPlan | null> {
    // Check if entry already exists
    const existing = await this.memberDietPlanRepository.findOne({
      where: {
        memberId,
        memberPaymentId,
      },
      transaction,
    });
    if (existing) {
      return existing;
    }
    return await this.memberDietPlanRepository.create(
      {
        memberId,
        memberPaymentId,
        noOfCycle,
        daysInCycle,
        currentCycleNo: null,
        currentDayNo: null,
        startDate: null,
        endDate: null,
        isCompleted: false,
        active: true,
        createdBy: adminId ? adminId : 1,
        modifiedBy: adminId ? adminId : 1,
        createdIp: requestedIp,
        modifiedIp: requestedIp,
      },
      { transaction },
    );
  }

  /**
   * Get list of diet plans for a member
   * @param memberId - Member ID
   * @returns List of diet plans with details
   */
  public async getList(memberId: number): Promise<{
    list: IMemberDietPlan[];
    count: number;
    dietTemplateList: IDropdownItem[];
  }> {
    // Fetch diet plans with related data
    const { rows, count } = await this.memberDietPlanRepository.findAndCountAll({
      include: [
        {
          model: TxnMemberPayment,
          as: 'memberPayment',
          required: true,
          where: {
            active: true,
            memberId: memberId,
          },
          include: [
            {
              model: MstProgram,
              as: 'program',
              required: true,
              include: [
                {
                  model: MstProgramCategory,
                  as: 'programCategory',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          model: MstAdminUser,
          as: 'createdByUser',
          required: false,
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
        },
        {
          model: MstAdminUser,
          as: 'updatedByUser',
          required: false,
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
        },
      ],
      where: {
        memberId: memberId,
        active: true,
      },
      order: [
        ['memberPaymentId', 'ASC'],
        ['startDate', 'ASC'],
      ],
      raw: true,
      nest: true,
    });
    // Convert to IMemberDietPlan format
    const planList: IMemberDietPlan[] = rows.map((s: any) => this.convertDBObject(s));
    // Fetch diet plan details and related data in parallel
    const [categoryList, recipeList, dpDetails, dietTemplateList] = await Promise.all([
      this.recipeCategoryService.getRecipeCategoryList(),
      this.getRecipeDropdownList(),
      this.memberDietPlanDetailRepository.findAll({
        attributes: [
          'memberDietDetailId',
          'cycleNo',
          'dayNo',
          'dietPlan',
          'type',
          'startDate',
          'endDate',
          'memberDietPlanId',
        ],
        where: {
          memberDietPlanId: _.map(planList, 'memberDietPlanId'),
        },
        order: [
          ['memberDietPlanId', 'ASC'],
          ['cycleNo', 'ASC'],
          ['dayNo', 'ASC'],
        ],
        raw: true,
        nest: true,
      }),
      this.getDietTemplateDropdownList(),
    ]);
    // Convert diet plan details
    const dietPlanDetailList: IMemberDietDetail[] = dpDetails.map((s: any) => ({
      memberDietDetailId: s.memberDietDetailId,
      dayNo: s.dayNo,
      cycleNo: s.cycleNo,
      memberDietPlanId: s.memberDietPlanId,
      dietPlanId: s.memberDietPlanId,
      startDate: s.startDate ? moment(s.startDate).toDate() : null,
      endDate: s.endDate ? moment(s.endDate).toDate() : null,
      type: s.type,
      noOfCycle: 0,
      noOfDaysInCycle: 0,
      dietPlan: this.convertDietDetail(categoryList, recipeList, s),
      isDeletable: false, // Will be set later based on conditions
    }));
    // Group diet plan details by cycle
    for (let i = 0; i < planList.length; i++) {
      const cyclePlanList: ICyclePlan[] = [];
      const tempCycleList: IMemberDietDetail[] = _.filter(dietPlanDetailList, {
        dietPlanId: planList[i].memberDietPlanId,
      });
      const cycleNos = _.uniqWith(_.map(tempCycleList, 'cycleNo'), _.isEqual);
      for (let j = 0; j < cycleNos.length; j++) {
        const cS = _.filter(tempCycleList, { cycleNo: cycleNos[j] });
        for (let k = 0; k < cS.length; k++) {
          cS[k].isDeletable =
            k === cS.length - 1 && j === cycleNos.length - 1 && planList[i].showActionBtn;
        }
        cyclePlanList.push({
          cycleNo: cycleNos[j],
          dietPlans: cS,
          startDate: cS && cS.length > 0 ? cS[0].startDate : null,
          endDate: cS && cS.length > 0 ? cS[cS.length - 1].endDate : null,
          type: cS && cS.length > 0 ? cS[0].type : null,
        } as ICyclePlan);
      }
      planList[i].cyclePlans = cyclePlanList;
    }
    return {
      list: planList,
      count: count,
      dietTemplateList: dietTemplateList,
    };
  }

  private convertDBObject(obj: any): IMemberDietPlan {
    const payment = obj.memberPayment || {};
    const program = payment.program || {};
    const programCategory = program.programCategory || {};
    return {
      program: program.program,
      programCategory: programCategory.programCategory,
      memberDietPlanId: obj.memberDietPlanId,
      memberPaymentId: obj.memberPaymentId,
      memberId: obj.memberId,
      noOfCycle: obj.noOfCycle,
      noOfDaysInCycle: obj.daysInCycle,
      currentCycleNo: obj.currentCycleNo,
      currentDayNo: obj.currentDayNo,
      dietPlanStatusId: obj.isCompleted
        ? DietPlanStatusEnum.COMPLETED
        : obj.currentCycleNo && obj.currentCycleNo > 0
          ? DietPlanStatusEnum.IN_PROGRESS
          : DietPlanStatusEnum.NOT_STARTED,
      dietPlanStatus: obj.isCompleted
        ? 'Completed'
        : obj.currentCycleNo && obj.currentCycleNo > 0
          ? 'In Progress'
          : 'Not Started',
      startDate: obj.startDate ? moment(obj.startDate).toDate() : null,
      endDate: obj.endDate ? moment(obj.endDate).toDate() : null,
      active: obj.active,
      deletable: false,
      createdBy: obj.createdBy,
      modifiedBy: obj.updatedBy,
      createdByUser: CommonFunctionsUtil.getAdminShortInfo(obj.createdByUser, 'createdByUser'),
      updatedByUser: CommonFunctionsUtil.getAdminShortInfo(obj.updatedByUser, 'updatedByUser'),
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      daysInCycle: obj.daysInCycle,
      isCompleted: obj.isCompleted,
      ...this.findUpcomingDiet(obj),
      cyclePlans: [],
    } as IMemberDietPlan;
  }

  private findUpcomingDiet(obj: any) {
    if (obj.isCompleted) {
      return {
        upcomingDay: null,
        upcomingCycle: null,
        showActionBtn: false,
        showDaily: false,
        showWeekly: false,
      };
    }
    // diet plan not started yet
    if (
      (!obj.currentCycleNo || obj.currentCycleNo === 0) &&
      !(obj.currentDayNo || obj.currentDayNo === 0)
    ) {
      return {
        upcomingDay: 1,
        upcomingCycle: 1,
        showActionBtn: true,
        showDaily: true,
        showWeekly: true,
      };
    }
    if (obj.currentCycleNo < obj.noOfCycle) {
      if (!obj.currentDayNo || obj.currentDayNo === 0) {
        // weekly plan
        return {
          upcomingDay: 1,
          upcomingCycle: obj.currentCycleNo + 1,
          showActionBtn: true,
          showDaily: true,
          showWeekly: true,
        };
      } else {
        // daily plan
        if (obj.currentDayNo < obj.daysInCycle) {
          return {
            upcomingDay: obj.currentDayNo + 1,
            upcomingCycle: obj.currentCycleNo,
            showActionBtn: true,
            showDaily: true,
            showWeekly: false,
          };
        } else if (obj.currentDayNo === obj.daysInCycle) {
          return {
            upcomingDay: 1,
            upcomingCycle: obj.currentCycleNo + 1,
            showActionBtn: true,
            showDaily: true,
            showWeekly: true,
          };
        }
      }
    } else if (obj.currentCycleNo === obj.noOfCycle) {
      // last cycle of diet plan
      if (!obj.currentDayNo || obj.currentDayNo === 0) {
        // weekly plan
        return {
          upcomingDay: null,
          upcomingCycle: null,
          showActionBtn: true,
          showDaily: false,
          showWeekly: false,
        };
      } else {
        // daily plan
        if (obj.currentDayNo < obj.daysInCycle) {
          return {
            upcomingDay: obj.currentDayNo + 1,
            upcomingCycle: obj.currentCycleNo,
            showActionBtn: true,
            showDaily: true,
            showWeekly: false,
          };
        } else if (obj.currentDayNo === obj.daysInCycle) {
          return {
            upcomingDay: null,
            upcomingCycle: null,
            showActionBtn: !moment(obj.endDate).isBefore(moment(), 'date'),
            showDaily: false,
            showWeekly: false,
          };
        }
      }
    }
    return {
      upcomingDay: null,
      upcomingCycle: null,
      showActionBtn: false,
      showDaily: false,
      showWeekly: false,
    };
  }

  private convertDietDetail(
    categoryList: IDropdownItem[],
    recipeList: IDropdownItem[],
    dietDetail: TxnMemberDietDetail,
  ): any[] {
    const dietCategory: any[] = [];
    for (const c of categoryList) {
      const f = dietDetail ? _.find(dietDetail.dietPlan, { recipeCategoryId: c.id }) : null;
      const dietRecipeList = [];
      if (f) {
        for (const r of f.recipeIds) {
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
        sequence: 0, // Will need to get from category if available
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

  private async getDietTemplateDropdownList(): Promise<IDropdownItem[]> {
    const result = await this.dietTemplateService.findAll({ page: 0, limit: 1000 });
    return result.tableData.map((template: any) => ({
      id: template.dietTemplateId || template.id,
      label: template.dietTemplate,
      isActive: template.active,
    }));
  }

  /**
   * Fetch diet detail for a specific cycle/day
   * @param memberId - Member ID
   * @param dietPlanId - Diet plan ID
   * @param cycleNo - Cycle number
   * @param dayNo - Day number (optional)
   * @param copyFromCycleNo - Copy from cycle number (optional)
   * @param copyFromDayNo - Copy from day number (optional)
   * @returns Diet detail with recipes and member name
   */
  public async fetchDietDetail(
    memberId: number,
    dietPlanId: number,
    cycleNo: number,
    dayNo: number = null,
    copyFromCycleNo: number = null,
    copyFromDayNo: number = null,
  ): Promise<{
    recipes: IDietPlanRecipes[] | IDropdownItem[];
    diet: IMemberDietDetail;
    memberName: string;
  }> {
    cycleNo = cycleNo ? Number(cycleNo) : cycleNo;
    dayNo = dayNo ? Number(dayNo) : dayNo;
    dietPlanId = dietPlanId ? Number(dietPlanId) : dietPlanId;
    const where: any = {
      memberDietPlanId: dietPlanId,
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
    let dietPlanStartDate = null;
    let dietPlanEndDate = null;
    let dietCategory: IDietPlanDetail[] = [];
    const [categoryList, planDetail, dietDetail, recipeList] = await Promise.all([
      this.recipeCategoryService.getRecipeCategoryList(),
      this.memberDietPlanRepository.findOne({
        include: [
          {
            model: TxnMemberPayment,
            as: 'memberPayment',
            where: {
              active: true,
              memberId: memberId,
            },
            required: true,
          },
        ],
        where: {
          memberDietPlanId: dietPlanId,
          active: true,
        },
        raw: true,
        nest: true,
      }),
      this.memberDietPlanDetailRepository.findOne({
        include: [
          {
            model: TxnMemberDietPlan,
            as: 'memberDietPlan',
            required: true,
            where: {
              memberId: memberId,
              active: true,
            },
          },
        ],
        where: where,
        nest: true,
        raw: true,
      }),
      this.getRecipeDropdownList(),
    ]);
    if (!planDetail) {
      throw new NotFoundException('Diet plan not found');
    }
    dietCategory = this.convertDietDetail(categoryList, recipeList, dietDetail);
    // Calculate start and end date
    if (cycleNo && cycleNo === 1 && (!dayNo || dayNo === 0)) {
      // cycle plan
      dietPlanStartDate = moment().format('YYYY-MM-DD');
    } else {
      const lastDietPlan = await this.memberDietPlanDetailRepository.findOne({
        where: {
          memberDietPlanId: dietPlanId,
        },
        order: [
          ['cycleNo', 'DESC'],
          ['dayNo', 'DESC'],
        ],
      });
      if (lastDietPlan) {
        dietPlanStartDate = moment(lastDietPlan.endDate).add(1, 'day').format('YYYY-MM-DD');
      } else {
        dietPlanStartDate = moment().format('YYYY-MM-DD');
      }
    }
    if (!dayNo || dayNo === 0) {
      dietPlanEndDate = moment(dietPlanStartDate)
        .add(planDetail.daysInCycle - 1, 'day')
        .format('YYYY-MM-DD');
    } else {
      dietPlanEndDate = dietPlanStartDate;
    }
    return {
      memberName: '',
      recipes: recipeList as IDropdownItem[],
      diet: <IMemberDietDetail>{
        memberDietPlanId: planDetail.memberDietPlanId,
        dayNo: dayNo,
        cycleNo: cycleNo,
        dietPlanId: dietPlanId,
        noOfCycle: planDetail.noOfCycle,
        noOfDaysInCycle: planDetail.daysInCycle,
        startDate: dietPlanStartDate ? new Date(dietPlanStartDate) : null,
        endDate: dietPlanEndDate ? new Date(dietPlanEndDate) : null,
        dietPlan: dietCategory,
        type: DietTypeEnum.CYCLE,
        isDeletable: false,
      },
    };
  }

  /**
   * Create or update diet plan detail
   * @param memberId - Member ID
   * @param body - Diet plan detail DTO
   * @param cIp - Client IP
   * @param adminId - Admin ID
   */
  public async createDietPlanDetail(
    memberId: number,
    body: MemberDietPlanDetailDto,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const dietPlanDetail = await this.memberDietPlanRepository.findOne({
        where: {
          memberDietPlanId: body.dietPlanId,
          memberId: memberId,
        },
      });
      if (!dietPlanDetail) {
        await t.rollback();
        throw new NotFoundException('Diet plan not found');
      }
      const condition: any = {
        cycleNo: body.cycleNo,
        memberDietPlanId: body.dietPlanId,
      };
      if (body.dayNo && body.dayNo > 0) {
        condition.dayNo = body.dayNo;
      }
      const planArray: any[] = [];
      for (const s of body.dietPlan) {
        if (s.dietDetail || s.recipeIds) {
          planArray.push(s);
        }
      }
      const findD = await this.memberDietPlanDetailRepository.findOne({
        where: condition,
        transaction: t,
      });
      const dietDObj: any = {
        cycleNo: body.cycleNo,
        memberDietPlanId: body.dietPlanId,
        startDate: moment(body.startDate),
        endDate: body.endDate ? moment(body.endDate) : null,
        dayNo: body.dayNo && body.dayNo > 0 ? body.dayNo : null,
        type: body.dayNo && body.dayNo > 0 ? DietTypeEnum.DAY : DietTypeEnum.CYCLE,
        dietPlan: planArray,
        modifiedIp: cIp,
        modifiedBy: adminId,
      };
      if (findD) {
        await this.memberDietPlanDetailRepository.update(dietDObj, {
          where: condition,
          transaction: t,
        });
      } else {
        dietDObj.createdBy = adminId;
        dietDObj.createdIp = cIp;
        await this.memberDietPlanDetailRepository.create(dietDObj, { transaction: t });
      }
      let dietStartDate;
      let dietEndDate;
      let isEnd = false;
      if (body.cycleNo === 1) {
        if (!body.dayNo || body.dayNo === 0) {
          // weekly start date
          dietStartDate = moment(body.startDate);
        } else if (body.dayNo && body.dayNo === 1) {
          // daily diet plan start date
          dietStartDate = moment(body.startDate);
        }
      }
      if (body.cycleNo === dietPlanDetail.noOfCycle) {
        if (!body.dayNo || body.dayNo === 0) {
          // cycle plan
          dietEndDate = body.endDate ? moment(body.endDate) : null;
          if (
            dietEndDate &&
            moment(dietEndDate, 'YYYY-MM-DD').isBefore(moment(moment(), 'YYYY-MM-DD'), 'date')
          ) {
            isEnd = true;
          }
        } else if (body.dayNo === dietPlanDetail.daysInCycle) {
          // day plan
          dietEndDate = body.endDate ? moment(body.endDate) : null;
          if (
            dietEndDate &&
            moment(dietEndDate, 'YYYY-MM-DD').isBefore(moment(moment(), 'YYYY-MM-DD'), 'date')
          ) {
            isEnd = true;
          }
        }
      }
      const updateObj = {
        startDate: dietStartDate,
        endDate: dietEndDate,
        currentCycleNo: body.cycleNo,
        currentDayNo: body.dayNo && body.dayNo > 0 ? body.dayNo : null,
        isCompleted: isEnd,
        modifiedIp: cIp,
        modifiedBy: adminId,
      };
      await this.memberDietPlanRepository.update(updateObj, {
        where: {
          memberDietPlanId: body.dietPlanId,
        },
        transaction: t,
      });
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  /**
   * Delete diet plan (cycle or day)
   * @param dietPlanId - Diet plan ID
   * @param cycleNo - Cycle number
   * @param ip - Client IP
   * @param adminId - Admin ID
   * @param dayNo - Day number (optional)
   */
  async deleteDietPlan(
    dietPlanId: number,
    cycleNo: number,
    ip: string,
    adminId: number,
    dayNo?: number,
  ): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const dietDetails = await this.memberDietPlanDetailRepository.findAll({
        where: {
          memberDietPlanId: dietPlanId,
        },
        order: [
          ['cycleNo', 'ASC'],
          ['dayNo', 'ASC'],
        ],
        raw: true,
        nest: true,
        transaction: t,
      });
      const indexCheckCondition: any = { cycleNo: Number(cycleNo) };
      if (dayNo) {
        indexCheckCondition.dayNo = Number(dayNo);
      }
      const cIndex = _.findIndex(dietDetails, indexCheckCondition);
      await this.memberDietPlanDetailRepository.destroy({
        where: {
          ...indexCheckCondition,
          memberDietPlanId: dietPlanId,
        },
        transaction: t,
      });
      await this.memberDietPlanRepository.update(
        {
          currentCycleNo: cIndex === 0 ? null : dietDetails[cIndex - 1].cycleNo,
          currentDayNo: cIndex === 0 ? null : dietDetails[cIndex - 1].dayNo,
          isCompleted: false,
          endDate: cIndex === 0 ? null : dietDetails[cIndex - 1].endDate,
          modifiedIp: ip,
          modifiedBy: adminId,
        },
        {
          where: {
            memberDietPlanId: dietPlanId,
          },
          transaction: t,
        },
      );
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  /**
   * Apply diet template to member diet plan
   * @param memberId - Member ID
   * @param body - Diet template DTO
   * @param cIp - Client IP
   * @param adminId - Admin ID
   */
  async applyDietTemplate(
    memberId: number,
    body: MemberDietTemplateDto,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const promiseAll = await Promise.all([
        this.dietTemplateService.fetchById(body.dietTemplateId),
        this.getAllDietDetailsByTemplateId(body.dietTemplateId),
      ]);
      const dietTemplate: any = promiseAll[0];
      const dietTemplateDetails: any[] = promiseAll[1];
      const emptyDietList: any[] = [];
      if (!dietTemplateDetails || dietTemplateDetails.length === 0) {
        await t.rollback();
        throw new NotFoundException('No data found');
      }
      let dietObject: any;
      const dietPlanList = [];
      let startDate, endDate;
      let item: any;
      const isWeekly = !dietTemplate.dayNo || dietTemplate.dayNo === 0;
      for (let cycle = 1; cycle <= dietTemplate.noOfCycle; cycle++) {
        if (isWeekly) {
          item = dietTemplateDetails.find((x) => x.cycleNo === cycle && x.dayNo === null);
          startDate = !startDate ? moment() : moment(endDate).add(1, 'day');
          endDate = moment(startDate).add(dietTemplate.noOfDaysInCycle - 1, 'day');
          dietObject = {
            cycleNo: cycle,
            memberDietPlanId: body.memberDietPlanId,
            startDate: startDate,
            endDate: endDate,
            dayNo: null,
            type: DietTypeEnum.CYCLE,
            dietPlan: item && item.dietDetail ? item.dietDetail : emptyDietList,
            createdIp: cIp,
            createdBy: adminId,
            modifiedIp: cIp,
            modifiedBy: adminId,
          };
          dietPlanList.push(dietObject);
        } else {
          for (let day = 1; day <= dietTemplate.noOfDaysInCycle; day++) {
            item = dietTemplateDetails.find((x) => x.cycleNo === cycle && x.dayNo === day);
            startDate = !startDate ? moment() : moment(endDate).add(1, 'day');
            endDate = startDate;
            dietObject = {
              cycleNo: cycle,
              memberDietPlanId: body.memberDietPlanId,
              startDate: startDate,
              endDate: endDate,
              dayNo: day,
              type: DietTypeEnum.DAY,
              dietPlan: item && item.dietDetail ? item.dietDetail : emptyDietList,
              createdIp: cIp,
              createdBy: adminId,
              modifiedIp: cIp,
              modifiedBy: adminId,
            };
            dietPlanList.push(dietObject);
          }
        }
      }
      await this.memberDietPlanDetailRepository.bulkCreate(dietPlanList, { transaction: t });
      const updateObj = {
        currentCycleNo: 1,
        currentDayNo: 1,
        startDate: moment(),
        endDate: moment(endDate).add(dietTemplate.noOfCycle * dietTemplate.noOfDaysInCycle, 'day'),
        modifiedIp: cIp,
        modifiedBy: adminId,
      };
      await this.memberDietPlanRepository.update(updateObj, {
        where: {
          memberDietPlanId: body.memberDietPlanId,
        },
        transaction: t,
      });
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  /**
   * Update diet plan status (completed/not completed)
   * @param memberId - Member ID
   * @param dietPlanId - Diet plan ID
   * @param adminId - Admin ID
   * @param ip - Client IP
   */
  async updateStatus(
    memberId: number,
    dietPlanId: number,
    adminId: number,
    ip: string,
  ): Promise<void> {
    const dietPlan = await this.memberDietPlanRepository.findOne({
      where: {
        memberDietPlanId: dietPlanId,
        memberId: memberId,
      },
    });
    if (!dietPlan) {
      throw new NotFoundException('Diet plan not found');
    }
    await this.memberDietPlanRepository.update(
      {
        isCompleted: !dietPlan.isCompleted,
        modifiedBy: adminId,
        modifiedIp: ip,
      },
      {
        where: {
          memberDietPlanId: dietPlanId,
        },
      },
    );
  }

  /**
   * Download diet plan as PDF
   * @param memberId - Member ID
   * @param dietPlanId - Diet plan ID
   * @param cycleNo - Cycle number
   * @param dayNo - Day number (optional)
   * @returns File model with PDF details
   */
  async downloadDietPlan(
    memberId: number,
    dietPlanId: number,
    cycleNo: number,
    dayNo: number = null,
  ): Promise<IFileModel> {
    // Fetch diet plan detail
    const dietDetailData = await this.fetchDietDetail(memberId, dietPlanId, cycleNo, dayNo);
    // Fetch member information to get name and franchiseId
    const member = await this.memberRepository.findOne({
      where: { memberId: memberId },
      attributes: ['memberId', 'firstName', 'lastName', 'franchiseId'],
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }
    const memberName = `${member.firstName} ${member.lastName}`.trim();
    // Collect all recipe IDs from the diet plan
    const recipeIds: number[] = [];
    if (dietDetailData.diet.dietPlan) {
      for (const planItem of dietDetailData.diet.dietPlan) {
        if (planItem.recipeIds && planItem.recipeIds.length > 0) {
          recipeIds.push(...planItem.recipeIds);
        }
      }
    }
    // Fetch full recipe details for all recipes
    const recipes = [];
    if (recipeIds.length > 0) {
      const uniqueRecipeIds = [...new Set(recipeIds)];
      for (const recipeId of uniqueRecipeIds) {
        try {
          const recipe = await this.recipeService.fetchById(recipeId);
          recipes.push(recipe);
        } catch (error) {
          // Skip if recipe not found
          this.logger.warn(`Recipe ${recipeId} not found, skipping`, { error });
        }
      }
    }
    // Fetch franchise for header information using member's franchiseId
    let franchise = null;
    try {
      if (member.franchiseId) {
        franchise = await this.franchiseService.fetchById(member.franchiseId);
      } else {
        // Fallback to primary franchise if member doesn't have franchiseId
        const franchiseList = await this.franchiseService.findAll({ page: 0, limit: 100 });
        franchise = franchiseList.tableData.find((f: any) => f.isPrimary) || franchiseList.tableData[0];
      }
    } catch (error) {
      this.logger.warn('Could not fetch franchise information', { error });
    }
    // Format start date for plan display
    const startDate = dietDetailData.diet.startDate
      ? moment(dietDetailData.diet.startDate).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');
    // Prepare PDF data
    const pdfData = {
      memberName: memberName,
      diet: dietDetailData.diet,
      cycleNo: cycleNo,
      dayNo: dayNo,
      type: dayNo ? 'DAY' : 'CYCLE' as 'CYCLE' | 'DAY',
      recipes: recipes,
      franchise: franchise,
      planStartDate: startDate,
    };
    // Generate PDF
    const pdfBuffer = await this.dietPlanPdfService.generateDietPlanPdf(pdfData);
    // Prepare file name and path
    const fileName = `Session-${CommonFunctionsUtil.removeSpecialChar(
      memberName,
      '-',
      false,
    )}-Cycle-${cycleNo}${dayNo ? `-Day-${dayNo}` : ''}.pdf`;
    const relativePath = `${MediaForEnum.DOWNLOADS}/${memberId}/diet-plans`;
    const destinationFolderPath = `${Env.persistentStorageAssetPath}/${relativePath}`;
    // Create a directory if not exists
    if (!fs.existsSync(destinationFolderPath)) {
      fs.mkdirSync(destinationFolderPath, { recursive: true });
    }
    const destinationPath = `${destinationFolderPath}/${fileName}`;
    // Write PDF buffer to destination folder
    fs.writeFileSync(destinationPath, Uint8Array.from(pdfBuffer));
    // Convert to base64 for response
    const base64Buffer = pdfBuffer.toString('base64');
    return {
      filePath: relativePath,
      fileName: fileName,
      buffer: base64Buffer,
    } as IFileModel;
  }

  /**
   * Send diet plan via email
   * @param memberId - Member ID
   * @param dietPlanId - Diet plan ID
   * @param cycleNo - Cycle number
   * @param dayNo - Day number (optional)
   */
  async sendDietPlan(
    memberId: number,
    dietPlanId: number,
    cycleNo: number,
    dayNo: number = null,
  ): Promise<void> {
    await this.fetchDietDetail(memberId, dietPlanId, cycleNo, dayNo);
  }

  /**
   * Get all diet details by template ID
   * @param dietTemplateId - Diet template ID
   * @returns Array of diet template details
   */
  private async getAllDietDetailsByTemplateId(dietTemplateId: number): Promise<any[]> {
    const details = await this.dietTemplateDietDetailRepository.findAll({
      where: { dietTemplateId: dietTemplateId },
      raw: true,
      nest: true,
    });
    return details.map((d: any) => ({
      cycleNo: d.cycleNo,
      dayNo: d.dayNo,
      dietDetail: d.dietDetail,
    }));
  }
}

