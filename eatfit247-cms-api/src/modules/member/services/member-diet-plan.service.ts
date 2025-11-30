import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DB_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
} from '../../../constants/config-constants';
import { StringResource, ITableList, IDietPlanRecipes } from 'shared-lib';
import moment from 'moment';
import * as _ from 'lodash';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import { TxnMemberPayment } from '../../../core/database/models/txn-member-payment.model';
import { ICreateUpdate } from 'shared-lib';
import { TxnMemberDietPlan } from '../../../core/database/models/txn-member-diet-plan.model';
import {
  ICyclePlan,
  IDietPlanDetail,
  IMemberDietDetail,
  IMemberDietPlan,
} from 'shared-lib';
import { RecipeCategoryService } from '../../lov/services/recipe-category.service';
import { TxnMemberDietPlanDetail } from '../../../core/database/models/txn-member-diet-plan-detail.model';
import { RecipeService } from '../../recipe/recipe.service';
import { DietPlanStatusEnum } from 'shared-lib';
import { DietPlanDetailDto, MemberDietPlanDetailDto, MemberDietTemplateDto } from '../dto/member-diet-plan-detail.dto';
import { DietTypeEnum } from 'shared-lib';
import { IDropdownItem } from 'shared-lib';
import { MstRecipeCategory } from '../../../core/database/models/mst-recipe-category.model';
import { MstProgram } from '../../../core/database/models/mst-program.model';
import { MstProgramCategory } from '../../../core/database/models/mst-program-category.model';
import { MstPaymentMode } from '../../../core/database/models/mst-payment-mode.model';
import { MstPaymentStatus } from '../../../core/database/models/mst-payment-status.model';
import { TxnAddress } from '../../../core/database/models/txn-address.model';
import { PdfService } from 'src/core/pdf/pdf.service';
import { EmailService } from 'src/core/mail/email.service';
import { IAttachment, IEmailParams } from 'src/core/mail/email-params.interface';
import { MediaFolderEnum } from 'shared-lib';
import { PDFTemplateEnum } from 'shared-lib';
import { IFileModel } from 'src/core/pdf/file-model.interface';
import { EmailTypeEnum } from 'shared-lib';
import { MemberService } from './member.service';
import { DietTemplateService } from 'src/modules/diet-template/diet-template.service';
import { TxnDietTemplateDietDetail } from 'src/core/database/models/txn-diet-template-diet-detail.model';
import { TxnDietTemplate } from 'src/core/database/models/txn-diet-template.model';

@Injectable()
export class MemberDietPlanService {
  constructor(
    @InjectModel(TxnMemberDietPlan) private readonly memberDietPlanRepository: typeof TxnMemberDietPlan,
    @InjectModel(TxnMemberDietPlanDetail)
    private readonly memberDietPlanDetailRepository: typeof TxnMemberDietPlanDetail,
    private recipeCategory: RecipeCategoryService,
    private recipeService: RecipeService,
    private sequelize: Sequelize,
    private memberService: MemberService,
    private dietTemplateService: DietTemplateService,
    private pdfService: PdfService,
    private emailService: EmailService,
  ) {
  }

  public async findAll(id: number): Promise<{
    list: IMemberDietPlan[];
    count: number;
    dietTemplateList: IDropdownItem[]
  }> {
    TxnMemberDietPlan.belongsTo(TxnMemberPayment, {
      targetKey: 'memberPaymentId',
      foreignKey: 'memberPaymentId',
    });
    const { rows, count } = await this.memberDietPlanRepository.findAndCountAll<TxnMemberDietPlan>({
      include: [
        {
          model: TxnMemberPayment,
          include: [
            {
              model: MstPaymentMode,
              required: true,
              as: 'MemberPaymentMode',
            },
            {
              model: MstPaymentStatus,
              required: true,
              as: 'MemberPaymentStatus',
            },
            {
              model: TxnAddress,
              required: false,
              as: 'MemberAddress',
            },
            {
              attributes: ['program'],
              model: MstProgram,
              required: true,
              as: 'MemberPaymentProgram',
              include: [
                {
                  attributes: ['programCategory'],
                  model: MstProgramCategory,
                  required: true,
                  as: 'ProgramCategory',
                },
              ],
            },
          ],
          where: {
            active: true,
            memberId: id,
          },
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
      where: {
        memberId: id,
        active: true,
      },
      order: [
        ['memberPaymentId', 'asc'],
        ['startDate', 'ASC'],
      ],
      raw: true,
      nest: true,
    });
    const planList: IMemberDietPlan[] = [];
    for (const s of rows) {
      planList.push(this.convertDBObject(s));
    }
    const promiseAll = await Promise.all([
      this.recipeCategory.fetchAllRecipeCategory(),
      this.recipeService.getAllRecipeDD(),
      this.memberDietPlanDetailRepository.findAll({
        attributes: [
          'memberDietPlanDetailId',
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
          ['memberDietPlanId', 'asc'],
          ['cycleNo', 'asc'],
          ['dayNo', 'asc'],
        ],
        raw: true,
        nest: true,
      }),
      this.dietTemplateService.getAllDietTemplateDD(),
    ]);
    const categoryList = promiseAll[0];
    const recipeList = promiseAll[1];
    const dpDetails = promiseAll[2];
    const dietTemplateList = promiseAll[3];
    const dietPlanDetailList: IMemberDietDetail[] = [];
    for (const s of dpDetails) {
      dietPlanDetailList.push(<IMemberDietDetail>{
        id: s.memberDietPlanDetailId,
        dayNo: s.dayNo,
        cycleNo: s.cycleNo,
        dietPlanId: s.memberDietPlanId,
        startDate: s.startDate ? moment(s.startDate).toDate() : null,
        endDate: s.endDate ? moment(s.endDate).toDate() : null,
        type: s.type,
        noOfCycle: 0,
        noOfDaysInCycle: 0,
        dietPlan: this.convertDietDetail(categoryList, recipeList, s),
      });
    }
    for (let i = 0; i < planList.length; i++) {
      const cyclePlanList = [];
      const tempCycleList: IMemberDietDetail[] = _.filter(dietPlanDetailList, { dietPlanId: planList[i].id });
      const cycleNos = _.uniqWith(_.map(tempCycleList, 'cycleNo'), _.isEqual);
      for (let j = 0; j < cycleNos.length; j++) {
        const cS = _.filter(tempCycleList, { cycleNo: cycleNos[j] });
        for (let k = 0; k < cS.length; k++) {
          cS[k].isDeletable = (k === cS.length - 1 && j === cycleNos.length - 1) && planList[i].showActionBtn;
        }
        cyclePlanList.push(<ICyclePlan>{
          cycleNo: cycleNos[j],
          dietPlans: cS,
          startDate: cS && cS.length > 0 ? cS[0].startDate : null,
          endDate: cS && cS.length > 0 ? cS[cS.length - 1].endDate : null,
          type: cS && cS.length > 0 ? cS[0].type : null,
        });
      }
      planList[i].cyclePlans = cyclePlanList;
    }
    return {
      list: planList,
      count: count,
      dietTemplateList: dietTemplateList,
    };
  }

  public async fetchDietDetail(
    memberId: number,
    dietPlanId: number,
    cycleNo: number,
    dayNo: number = null,
    copyFromCycleNo: number = null,
    copyFromDayNo: number = null,
  ): Promise<{ recipes: IDietPlanRecipes[] | IDropdownItem[]; diet: IMemberDietDetail, memberName: string }> {
    cycleNo = cycleNo ? Number(cycleNo) : cycleNo;
    dayNo = dayNo ? Number(dayNo) : dayNo;
    dietPlanId = dietPlanId ? Number(dietPlanId) : dietPlanId;
    const where = {
      memberDietPlanId: dietPlanId,
      cycleNo: cycleNo,
    };
    if (dayNo) {
      where['dayNo'] = dayNo;
    }
    if (copyFromCycleNo) {
      where.cycleNo = copyFromCycleNo;
    }
    if (copyFromDayNo) {
      where['dayNo'] = copyFromDayNo;
    }
    let dietPlanStartDate = null;
    let dietPlanEndDate = null;
    let dietCategory: IDietPlanDetail[] = [];
    const [
      categoryList,
      planDetail,
      dietDetail,
      recipeList,
    ] = await Promise.all([
      this.recipeCategory.fetchAllRecipeCategory(),
      this.memberDietPlanRepository.findOne({
        include: [
          {
            model: TxnMemberPayment,
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
            as: 'MemberDietDetailDietPlan',
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
      this.recipeService.getAllRecipeDD(),
    ]);
    if (!planDetail) {
      throw new NotFoundException(StringResource.NO_DIET_PLAN_FOUND);
    }
    dietCategory = this.convertDietDetail(categoryList, recipeList, dietDetail);
    // calculate start and end date
    if (cycleNo && cycleNo === 1 && (!dayNo || dayNo === 0)) {
      // cycle plan
      dietPlanStartDate = moment().format(DB_DATE_FORMAT);
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
        dietPlanStartDate = moment(lastDietPlan.endDate).add(1, 'day').format(DB_DATE_FORMAT);
      } else {
        dietPlanStartDate = moment().format(DB_DATE_FORMAT);
      }
    }
    if (!dayNo || dayNo === 0) {
      dietPlanEndDate = moment(dietPlanStartDate)
        .add(planDetail.noOfDaysInCycle - 1, 'day')
        .format(DB_DATE_FORMAT);
    } else {
      dietPlanEndDate = dietPlanStartDate;
    }
    return {
      memberName: '',
      recipes: recipeList as IDropdownItem[],
      diet: <IMemberDietDetail>{
        dayNo: dayNo,
        cycleNo: cycleNo,
        dietPlanId: dietPlanId,
        noOfCycle: planDetail.noOfCycle,
        noOfDaysInCycle: planDetail.noOfDaysInCycle,
        startDate: dietPlanStartDate,
        endDate: dietPlanEndDate,
        id: dietDetail ? dietDetail.id : null,
        dietPlan: dietCategory,
      },
    };
  }

  public async createDietPlanDetail(memberId: number, body: MemberDietPlanDetailDto, cIp: string, adminId: number): Promise<void> {
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
        throw new NotFoundException(StringResource.NO_DIET_PLAN_FOUND);
      }
      const condition = {
        cycleNo: body.cycleNo,
        memberDietPlanId: body.dietPlanId,
      };
      if (body.dayNo && body.dayNo > 0) {
        condition['dayNo'] = body.dayNo;
      }
      const planArray: DietPlanDetailDto[] = [];
      for (const s of body.dietPlan) {
        if (s.dietDetail || s.recipeIds) {
          planArray.push(s);
        }
      }
      const findD = await this.memberDietPlanDetailRepository.findOne({
        where: condition,
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
      let createUpdateDP;
      if (findD) {
        createUpdateDP = await this.memberDietPlanDetailRepository.update(dietDObj, {
          where: condition,
        });
      } else {
        dietDObj['createdBy'] = adminId;
        dietDObj['createdIp'] = cIp;
        createUpdateDP = await this.memberDietPlanDetailRepository.create(dietDObj);
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
          if (dietEndDate && moment(dietEndDate, 'YYYY-MM-DD').isBefore(moment(moment(), 'YYYY-MM-DD'), 'date')) {
            isEnd = true;
          }
        } else if (body.dayNo === dietPlanDetail.noOfDaysInCycle) {
          // day plan
          dietEndDate = body.endDate ? moment(body.endDate) : null;
          if (dietEndDate && moment(dietEndDate, 'YYYY-MM-DD').isBefore(moment(moment(), 'YYYY-MM-DD'), 'date')) {
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
      });
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  async downloadDietPlan(memberId: number, dietPlanId: number, cycleNo: number, dayNo: number = null): Promise<IFileModel> {
    return await this.generateDietPlan(memberId, dietPlanId, cycleNo, dayNo);
  }

  async sendDietPlan(memberId: number, dietPlanId: number, cycleNo: number, dayNo: number = null): Promise<void> {
    const fileModel: IFileModel = await this.generateDietPlan(memberId, dietPlanId, cycleNo, dayNo);
    const emailParams: IEmailParams = {
      emailType: EmailTypeEnum.DIET_PLAN,
      toUserInfo: await this.memberService.getMemberBasicDetails(memberId),
      attachments: [
        {
          name: fileModel.fileName,
          path: `${CommonFunctionsUtil.getMediaFolderPath()}/${MediaFolderEnum.DOWNLOADS}/${fileModel.filePath}`,
        } as IAttachment,
      ] as IAttachment[],
    };
    await this.emailService.sendEmail(emailParams);
  }

  async generateDietPlan(memberId: number, dietPlanId: number, cycleNo: number, dayNo: number = null) {
    const data = await this.fetchDietDetail(memberId, dietPlanId, cycleNo, dayNo);
    const memberData = await this.memberService.loadBasicInfo(memberId);
    const tempDietPlanDetails = [];
    for (const d of data.diet.dietPlan) {
      if (d.dietDetail || (d.recipeIds && d.recipeIds.length > 0)) {
        tempDietPlanDetails.push(d);
      }
    }
    data.diet.dietPlan = tempDietPlanDetails;
    const recipeIdArr = data.diet.dietPlan.map((a) => a.recipeIds);
    const recipeIds = recipeIdArr.flat();
    data.recipes = [];
    if (recipeIds) {
      data.recipes = await this.recipeService.fetchByIds(recipeIds);
    }
    data.memberName = await this.memberService.getMemberName(memberId);
    return await this.pdfService.generatePDF(
      `${PDFTemplateEnum.DIET_PLAN}`,
      `${MediaFolderEnum.DIET_PLAN}/${memberId}`,
      `${memberData.firstName}_${memberData.lastName}_Diet_Plan_${data.diet.cycleNo}_${dietPlanId}`,
      { data },
    );
  }

  async applyDietTemplate(memberId: number, body: MemberDietTemplateDto, cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const promiseAll = await Promise.all([
        //this.recipeCategory.fetchAllRecipeCategory(),
        this.dietTemplateService.getDietTemplate(body.dietTemplateId),
        this.dietTemplateService.getAllDietDetailsByTemplateId(body.dietTemplateId),
      ]);
      //const categoryList: MstRecipeCategory[] = promiseAll[0];
      const dietTemplate: TxnDietTemplate = promiseAll[0];
      const dietTemplateDetails: TxnDietTemplateDietDetail[] = promiseAll[1];
      const emptyDietList = []; //this.getEmptyDietPlan(categoryList)
      if (!dietTemplateDetails) {
        await t.rollback();
        throw new NotFoundException(StringResource.NO_DATA_FOUND);
      }
      let dietObject: any;
      const dietPlanList = [];
      let startDate, endDate;
      let item: TxnDietTemplateDietDetail;
      for (let cycle = 1; cycle <= dietTemplate.noOfCycle; cycle++) {
        if (dietTemplate.isWeekly) {
          item = dietTemplateDetails.find((x) => x.cycleNumber === cycle && x.dayNumber === null);
          startDate = !startDate ? moment() : moment(endDate).add(1, 'day');
          endDate = moment(startDate).add(dietTemplate.noOfDaysInCycle, 'day');
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
            item = dietTemplateDetails.find((x) => x.cycleNumber === cycle && x.dayNumber === day);
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
      await this.memberDietPlanDetailRepository.bulkCreate(dietPlanList);
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
      });
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

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
          ['cycleNo', 'asc'],
          ['dayNo', 'asc'],
        ],
        raw: true,
        nest: true,
      });
      const indexCheckCondition = { cycleNo: Number(cycleNo) };
      if (dayNo) {
        indexCheckCondition['dayNo'] = Number(dayNo);
      }
      const cIndex = _.findIndex(dietDetails, indexCheckCondition);
      await this.memberDietPlanDetailRepository.destroy({
        where: {
          ...indexCheckCondition,
          memberDietPlanId: dietPlanId,
        },
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
        },
      );
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  async updateStatus(memberId: number, dietPlanId: number, adminId: number, ip: string): Promise<void> {
    const dietPlan = await this.memberDietPlanRepository.findOne({
      where: {
        memberDietPlanId: dietPlanId,
        memberId: memberId,
      },
    });
    if (!dietPlan) {
      throw new NotFoundException(StringResource.WARNING_DIET_PLAN_NOT_FOUND);
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

  private getEmptyDietPlan(categoryList: MstRecipeCategory[]) {
    const dietCategoryList = [];
    for (const c of categoryList) {
      dietCategoryList.push(<IDietPlanDetail>{
        dietDetail: null,
        recipeIds: [],
        recipeList: [],
        recipeCategory: c.recipeCategory,
        recipeCategoryId: c.recipeCategoryId,
        sequence: c.sequence,
      });
    }
    return dietCategoryList;
  }

  private convertDBObject(obj: TxnMemberDietPlan): IMemberDietPlan {
    return <IMemberDietPlan>(<ICreateUpdate>{
      program: obj['MemberPayment']['MemberPaymentProgram']['program'],
      programCategory:
        obj['MemberPayment']['MemberPaymentProgram']['ProgramCategory']['programCateg'] ||
        obj['MemberPayment']['MemberPaymentProgram']['ProgramCategory']['programCategory'],
      id: obj.memberDietPlanId,
      memberId: obj.memberId,
      noOfCycle: obj.noOfCycle,
      noOfDaysInCycle: obj.noOfDaysInCycle,
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
      startDate: obj.startDate ? moment(obj.startDate, DB_DATE_FORMAT) : null,
      endDate: obj.endDate ? moment(obj.endDate, DB_DATE_FORMAT) : null,
      active: obj.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(obj['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(obj['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(obj.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(obj.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      ...this.findUpcomingDiet(obj),
    });
  }

  private findUpcomingDiet(obj) {
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
        if (obj.currentDayNo < obj.noOfDaysInCycle) {
          return {
            upcomingDay: obj.currentDayNo + 1,
            upcomingCycle: obj.currentCycleNo,
            showActionBtn: true,
            showDaily: true,
            showWeekly: false,
          };
        } else if (obj.currentDayNo === obj.noOfDaysInCycle) {
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
        if (obj.currentDayNo < obj.noOfDaysInCycle) {
          return {
            upcomingDay: obj.currentDayNo + 1,
            upcomingCycle: obj.currentCycleNo,
            showActionBtn: true,
            showDaily: true,
            showWeekly: false,
          };
        } else if (obj.currentDayNo === obj.noOfDaysInCycle) {
          return {
            upcomingDay: null,
            upcomingCycle: null,
            showActionBtn: !(moment(obj.endDate, 'YYYY-MM-DD').isBefore(moment(moment(), 'YYYY-MM-DD'), 'date')),
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
    categoryList: MstRecipeCategory[],
    recipeList: IDropdownItem[],
    dietDetail: any,
  ): IDietPlanDetail[] {
    const dietCategory: IDietPlanDetail[] = [];
    for (const c of categoryList) {
      const f = dietDetail ? _.find(dietDetail.dietPlan, { recipeCategoryId: c.recipeCategoryId }) : null;
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
