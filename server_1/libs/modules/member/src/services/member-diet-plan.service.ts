import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMemberDietPlan, TxnMemberDietDetail, TxnMemberPayment } from '../models';
import { Sequelize } from 'sequelize-typescript';
import {
  IMemberDietPlan,
  IMemberDietDetail,
  ICyclePlan,
  IDropdownItem,
} from '@eatfit247-shared-lib';
import { MstAdminUser, CommonFunctionsUtil, ADMIN_USER_SHORT_INFO_ATTRIBUTE } from '@server_1/core';
import { MstProgram, MstProgramCategory } from '@server_1/modules/program-plan';
import { RecipeCategoryService } from '@server_1/modules/recipe';
import { RecipeService } from '@server_1/modules/recipe';
import { DietTemplateService } from '@server_1/modules/diet';
import * as _ from 'lodash';
import moment from 'moment';

// Diet plan status enum (matching shared-lib)
enum DietPlanStatusEnum {
  NOT_STARTED = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
}

@Injectable()
export class MemberDietPlanService {
  constructor(
    @InjectModel(TxnMemberDietPlan)
    private readonly memberDietPlanRepository: typeof TxnMemberDietPlan,
    @InjectModel(TxnMemberDietDetail)
    private readonly memberDietPlanDetailRepository: typeof TxnMemberDietDetail,
    @InjectModel(TxnMemberPayment)
    private readonly memberPaymentRepository: typeof TxnMemberPayment,
    private sequelize: Sequelize,
    private readonly recipeCategoryService: RecipeCategoryService,
    private readonly recipeService: RecipeService,
    private readonly dietTemplateService: DietTemplateService,
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
    adminId: number,
    transaction?: any,
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
        createdBy: adminId,
        modifiedBy: adminId,
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
          memberDietPlanId: _.map(planList, 'id'),
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
      id: s.memberDietDetailId,
      dayNo: s.dayNo,
      cycleNo: s.cycleNo,
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
        dietPlanId: planList[i].id,
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
      memberName: '',
      program: program.program || '',
      programCategory: programCategory.programCategory || '',
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
      deletable: false, // Set based on business logic if needed
      createdBy: obj.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(obj.createdByUser, 'createdByUser')
        : undefined,
      updatedBy: obj.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(obj.updatedByUser, 'updatedByUser')
        : undefined,
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
    if ((!obj.currentCycleNo || obj.currentCycleNo === 0) && !(obj.currentDayNo || obj.currentDayNo === 0)) {
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
            showActionBtn: !(moment(obj.endDate).isBefore(moment(), 'date')),
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
    dietDetail: any,
  ): any[] {
    const dietCategory: any[] = [];
    for (const c of categoryList) {
      const f = dietDetail ? _.find(dietDetail.dietPlan, { recipeCategoryId: c.id }) : null;
      const dietRecipeList = [];
      if (f) {
        for (const r of f['recipeIds'] || []) {
          const tR = _.find(recipeList, { id: r });
          if (tR) {
            dietRecipeList.push(tR);
          }
        }
      }
      dietCategory.push({
        dietDetail: f ? f['dietDetail'] : null,
        recipeIds: f ? f['recipeIds'] : [],
        recipeList: dietRecipeList,
        recipeCategory: c.label,
        recipeCategoryId: c.id,
        sequence: 0, // Will need to get from category if available
      });
    }
    return dietCategory;
  }

  private async getRecipeDropdownList(): Promise<IDropdownItem[]> {
    // This is a placeholder - you may need to implement a proper method in RecipeService
    // For now, return empty array or implement based on your RecipeService API
    try {
      const result = await this.recipeService.findAll({ page: 0, limit: 1000 });
      return result.tableData.map((recipe: any) => ({
        id: recipe.recipeId || recipe.id,
        label: recipe.name,
        isActive: recipe.active,
      }));
    } catch (error) {
      console.error('Error fetching recipe dropdown:', error);
      return [];
    }
  }

  private async getDietTemplateDropdownList(): Promise<IDropdownItem[]> {
    try {
      const result = await this.dietTemplateService.findAll({ page: 0, limit: 1000 });
      return result.tableData.map((template: any) => ({
        id: template.dietTemplateId || template.id,
        label: template.dietTemplate,
        isActive: template.active,
      }));
    } catch (error) {
      console.error('Error fetching diet template dropdown:', error);
      return [];
    }
  }
}

