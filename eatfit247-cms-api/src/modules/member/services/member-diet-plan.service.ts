import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { ExceptionService } from "../../common/exception.service";
import { Sequelize } from "sequelize-typescript";
import { IServerResponse } from "../../../common-dto/response-interface";
import { MstAdminUser } from "../../../core/database/models/mst-admin-user.model";
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DB_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
  IS_DEV
} from "../../../constants/config-constants";
import { ServerResponseEnum } from "../../../enums/server-response-enum";
import { StringResource } from "../../../enums/string-resource";
import * as moment from "moment";
import * as _ from "lodash";
import { CommonFunctionsUtil } from "../../../util/common-functions-util";
import { TxnMemberPayment } from "../../../core/database/models/txn-member-payment.model";
import { ICreateUpdate } from "../../../response-interface/lov.interface";
import { TxnMemberDietPlan } from "../../../core/database/models/txn-member-diet-plan.model";
import {
  ICyclePlan,
  IDietPlanDetail,
  IMemberDietDetail,
  IMemberDietPlan
} from "../../../response-interface/member-diet-plan.interface";
import { RecipeCategoryService } from "../../lov/services/recipe-category.service";
import { TxnMemberDietPlanDetail } from "../../../core/database/models/txn-member-diet-plan-detail.model";
import { RecipeService } from "../../recipe/recipe.service";
import { DietPlanStatusEnum } from "../../../enums/diet-plan-status-enum";
import { DietPlanDetailDto, MemberDietPlanDetailDto, MemberDietTemplateDto } from "../dto/member-diet-plan-detail.dto";
import { DietTypeEnum } from "../../../enums/diet-type-enum";
import { DropdownListInterface } from "../../../response-interface/dropdown-list.interface";
import { MstRecipeCategory } from "../../../core/database/models/mst-recipe-category.model";
import { MstProgram } from "../../../core/database/models/mst-program.model";
import { MstProgramCategory } from "../../../core/database/models/mst-program-category.model";
import { MstPaymentMode } from "../../../core/database/models/mst-payment-mode.model";
import { MstPaymentStatus } from "../../../core/database/models/mst-payment-status.model";
import { TxnAddress } from "../../../core/database/models/txn-address.model";
import { PdfService } from "src/core/pdf/pdf.service";
import { EmailService } from "src/core/mail/email.service";
import { IAttachment, IEmailParams } from "src/core/mail/email-params.interface";
import { MediaFolderEnum } from "src/enums/media-folder-enum";
import { PDFTemplateEnum } from "src/enums/pdf-template-enum";
import { IFileModel } from "src/core/pdf/file-model.interface";
import { EmailTypeEnum } from "src/enums/email-type-enum";
import { MemberService } from "./member.service";
import { DietTemplateService } from "src/modules/diet-template/diet-template.service";
import { TxnDietTemplateDietDetail } from "src/core/database/models/txn-diet-template-diet-detail.model";
import { TxnDietTemplate } from "src/core/database/models/txn-diet-template.model";

@Injectable()
export class MemberDietPlanService {
  constructor(
    @InjectModel(TxnMemberDietPlan) private readonly memberDietPlanRepository: typeof TxnMemberDietPlan,
    @InjectModel(TxnMemberDietPlanDetail)
    private readonly memberDietPlanDetailRepository: typeof TxnMemberDietPlanDetail,
    private recipeCategory: RecipeCategoryService,
    private recipeService: RecipeService,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
    private memberService: MemberService,
    private dietTemplateService: DietTemplateService,
    private pdfService: PdfService,
    private emailService: EmailService
  ) {
  }

  public async findAll(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      TxnMemberDietPlan.belongsTo(TxnMemberPayment, {
        targetKey: "memberPaymentId",
        foreignKey: "memberPaymentId"
      });
      const { rows, count } = await this.memberDietPlanRepository.findAndCountAll<TxnMemberDietPlan>({
        include: [
          {
            model: TxnMemberPayment,
            include: [
              {
                model: MstPaymentMode,
                required: true,
                as: "MemberPaymentMode"
              },
              {
                model: MstPaymentStatus,
                required: true,
                as: "MemberPaymentStatus"
              },
              {
                model: TxnAddress,
                required: false,
                as: "MemberAddress"
              },
              {
                attributes: ["program"],
                model: MstProgram,
                required: true,
                as: "MemberPaymentProgram",
                include: [
                  {
                    attributes: ["programCategory"],
                    model: MstProgramCategory,
                    required: true,
                    as: "ProgramCategory"
                  }
                ]
              }
            ],
            where: {
              active: true,
              memberId: id
            },
            required: true
          },
          {
            model: MstAdminUser,
            required: false,
            as: "CreatedBy",
            attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE
          },
          {
            model: MstAdminUser,
            required: false,
            as: "ModifiedBy",
            attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE
          }
        ],
        where: {
          memberId: id,
          active: true
        },
        order: [
          ["memberPaymentId", "asc"],
          ["startDate", "ASC"]
        ],
        raw: true,
        nest: true
      });
      if (!rows || rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null
        };
        return res;
      }
      const planList: IMemberDietPlan[] = [];
      for (const s of rows) {
        planList.push(this.convertDBObject(s));
      }
      const promiseAll = await Promise.all([
        this.recipeCategory.fetchAllRecipeCategory(),
        this.recipeService.getAllRecipeDD(),
        this.memberDietPlanDetailRepository.findAll({
          attributes: [
            "memberDietPlanDetailId",
            "cycleNo",
            "dayNo",
            "dietPlan",
            "type",
            "startDate",
            "endDate",
            "memberDietPlanId"
          ],
          where: {
            memberDietPlanId: _.map(planList, "id")
          },
          order: [
            ["memberDietPlanId", "asc"],
            ["cycleNo", "asc"],
            ["dayNo", "asc"]
          ],
          raw: true,
          nest: true
        }),
        this.dietTemplateService.getAllDietTemplateDD()
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
          startDate: s.startDate ? moment(s.startDate) : null,
          endDate: s.endDate ? moment(s.endDate) : null,
          type: s.type,
          noOfCycle: 0,
          noOfDaysInCycle: 0,
          dietPlan: this.convertDietDetail(categoryList, recipeList, s)
        });
      }
      for (let i = 0; i < planList.length; i++) {
        const cyclePlanList = [];
        const tempCycleList: IMemberDietDetail[] = _.filter(dietPlanDetailList, { dietPlanId: planList[i].id });
        const cycleNos = _.uniqWith(_.map(tempCycleList, "cycleNo"), _.isEqual);
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
            type: cS && cS.length > 0 ? cS[0].type : null
          });
        }
        planList[i].cyclePlans = cyclePlanList;
      }
      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
          list: planList,
          count: count,
          dietTemplateList: dietTemplateList
        }
      };
      return res;
    } catch (e) {
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e["message"] : StringResource.SOMETHING_WENT_WRONG,
        data: null
      };
      return res;
    }
  }

  public async fetchDietDetail(
    memberId: number,
    dietPlanId: number,
    cycleNo: number,
    dayNo: number = null,
    copyFromCycleNo: number = null,
    copyFromDayNo: number = null
  ): Promise<IServerResponse> {
    let res: IServerResponse;
    cycleNo = cycleNo ? Number(cycleNo) : cycleNo;
    dayNo = dayNo ? Number(dayNo) : dayNo;
    dietPlanId = dietPlanId ? Number(dietPlanId) : dietPlanId;
    const where = {
      memberDietPlanId: dietPlanId,
      cycleNo: cycleNo
    };
    if (dayNo) {
      where["dayNo"] = dayNo;
    }
    if (copyFromCycleNo) {
      where.cycleNo = copyFromCycleNo;
    }
    if (copyFromDayNo) {
      where["dayNo"] = copyFromDayNo;
    }
    console.log('Where', where);
    try {
      let dietPlanStartDate = null;
      let dietPlanEndDate = null;
      let dietCategory: IDietPlanDetail[] = [];
      const [categoryList,
        planDetail,
        dietDetail,
        recipeList] = await Promise.all([
        this.recipeCategory.fetchAllRecipeCategory(),
        this.memberDietPlanRepository.findOne({
          include: [
            {
              model: TxnMemberPayment,
              where: {
                active: true,
                memberId: memberId
              },
              required: true
            }
          ],
          where: {
            memberDietPlanId: dietPlanId,
            active: true
          },
          raw: true,
          nest: true
        }),
        this.memberDietPlanDetailRepository.findOne({
          include: [
            {
              model: TxnMemberDietPlan,
              as: "MemberDietDetailDietPlan",
              required: true,
              where: {
                memberId: memberId,
                active: true
              }
            }
          ],
          where: where,
          nest: true,
          raw: true
        }),
        this.recipeService.getAllRecipeDD()
      ]);
      dietCategory = this.convertDietDetail(categoryList, recipeList, dietDetail);
      // calculate start and end date
      if (cycleNo && cycleNo === 1 && (!dayNo || dayNo === 0)) {
        // cycle plan
        dietPlanStartDate = moment().format(DB_DATE_FORMAT);
      } else {
        const lastDietPlan = await this.memberDietPlanDetailRepository.findOne({
          where: {
            memberDietPlanId: dietPlanId
          },
          order: [
            ["cycleNo", "DESC"],
            ["dayNo", "DESC"]
          ]
        });
        if (lastDietPlan) {
          dietPlanStartDate = moment(lastDietPlan.endDate).add(1, "day").format(DB_DATE_FORMAT);
        } else {
          dietPlanStartDate = moment().format(DB_DATE_FORMAT);
        }
      }
      if (!dayNo || dayNo === 0) {
        dietPlanEndDate = moment(dietPlanStartDate)
          .add(planDetail.noOfDaysInCycle - 1, "day")
          .format(DB_DATE_FORMAT);
      } else {
        dietPlanEndDate = dietPlanStartDate;
      }
      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
          recipes: recipeList,
          diet: <IMemberDietDetail>{
            dayNo: dayNo,
            cycleNo: cycleNo,
            dietPlanId: dietPlanId,
            noOfCycle: planDetail.noOfCycle,
            noOfDaysInCycle: planDetail.noOfDaysInCycle,
            startDate: dietPlanStartDate,
            endDate: dietPlanEndDate,
            id: dietDetail ? dietDetail.id : null,
            dietPlan: dietCategory
          }
        }
      };
      return res;
    } catch (e) {
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e["message"] : StringResource.SOMETHING_WENT_WRONG,
        data: null
      };
      return res;
    }
  }

  public async createDietPlanDetail(memberId: number, body: MemberDietPlanDetailDto, cIp: string, adminId: number) {
    let res: IServerResponse;
    const t = await this.sequelize.transaction();
    try {
      const dietPlanDetail = await this.memberDietPlanRepository.findOne({
        where: {
          memberDietPlanId: body.dietPlanId,
          memberId: memberId
        }
      });
      if (!dietPlanDetail) {
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.NO_DIET_PLAN_FOUND,
          data: null
        };
        return res;
      }
      const condition = {
        cycleNo: body.cycleNo,
        memberDietPlanId: body.dietPlanId
      };
      if (body.dayNo && body.dayNo > 0) {
        condition["dayNo"] = body.dayNo;
      }
      const planArray: DietPlanDetailDto[] = [];
      for (const s of body.dietPlan) {
        if (s.dietDetail || s.recipeIds) {
          planArray.push(s);
        }
      }
      const findD = await this.memberDietPlanDetailRepository.findOne({
        where: condition
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
        modifiedBy: adminId
      };
      let createUpdateDP;
      if (findD) {
        createUpdateDP = await this.memberDietPlanDetailRepository.update(dietDObj, {
          where: condition
        });
      } else {
        dietDObj["createdBy"] = adminId;
        dietDObj["createdIp"] = cIp;
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
          if (dietEndDate && moment(dietEndDate, "YYYY-MM-DD").isBefore(moment(moment(), "YYYY-MM-DD"), "date")) {
            isEnd = true;
          }
        } else if (body.dayNo === dietPlanDetail.noOfDaysInCycle) {
          // day plan
          dietEndDate = body.endDate ? moment(body.endDate) : null;
          if (dietEndDate && moment(dietEndDate, "YYYY-MM-DD").isBefore(moment(moment(), "YYYY-MM-DD"), "date")) {
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
        modifiedBy: adminId
      };
      const updateD = await this.memberDietPlanRepository.update(updateObj, {
        where: {
          memberDietPlanId: body.dietPlanId
        }
      });
      if (createUpdateDP && updateD) {
        await t.commit();
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: null
        };
      } else {
        await t.rollback();
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null
        };
      }
      return res;
    } catch (e) {
      await t.rollback();
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e["message"] : StringResource.SOMETHING_WENT_WRONG,
        data: null
      };
      return res;
    }
  }

  async downloadDietPlan(memberId: number, dietPlanId: number, cycleNo: number, dayNo: number = null) {
    let res: IServerResponse;
    try {
      const filePath = await this.generateDietPlan(memberId, dietPlanId, cycleNo, dayNo);
      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: filePath
      };
    } catch (e) {
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e["message"] : StringResource.SOMETHING_WENT_WRONG,
        data: null
      };
    }
    return res;
  }

  async sendDietPlan(memberId: number, dietPlanId: number, cycleNo: number, dayNo: number = null) {
    let res: IServerResponse;
    try {
      const fileModel: IFileModel = await this.generateDietPlan(memberId, dietPlanId, cycleNo, dayNo);
      const emailParams: IEmailParams = {
        emailType: EmailTypeEnum.DIET_PLAN,
        toUserInfo: await this.memberService.getMemberBasicDetails(memberId),
        attachments: [
          {
            name: fileModel.fileName,
            path: `${CommonFunctionsUtil.getMediaFolderPath()}/${MediaFolderEnum.DOWNLOADS}/${fileModel.filePath}`
          } as IAttachment
        ] as IAttachment[]
      };
      this.emailService.sendEmail(emailParams);
      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: null
      };
    } catch (e) {
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e["message"] : StringResource.SOMETHING_WENT_WRONG,
        data: null
      };
    }
    return res;
  }

  async generateDietPlan(memberId: number, dietPlanId: number, cycleNo: number, dayNo: number = null) {
    const data = await this.fetchDietDetail(memberId, dietPlanId, cycleNo, dayNo);
    const memberData = await this.memberService.loadBasicInfo(memberId);
    const tempDietPlanDetails = [];
    for (const d of data.data.diet.dietPlan) {
      if (d.dietDetail || (d.recipeIds && d.recipeIds.length > 0)) {
        tempDietPlanDetails.push(d);
      }
    }
    data.data.diet.dietPlan = tempDietPlanDetails;
    const recipeIdArr = data.data.diet.dietPlan.map((a) => a.recipeIds);
    const recipeIds = recipeIdArr.flat();
    data.data.recipes = [];
    if (recipeIds) {
      data.data.recipes = await this.recipeService.fetchByIds(recipeIds);
    }
    data.data.memberName = await this.memberService.getMemberName(memberId);
    return await this.pdfService.generatePDF(
      `${PDFTemplateEnum.DIET_PLAN}`,
      `${MediaFolderEnum.DIET_PLAN}/${memberId}`,
      `${memberData.firstName}_${memberData.lastName}_Diet_Plan_${data.data.diet.cycleNo}_${dietPlanId}`,
      data
    );
  }

  async applyDietTemplate(memberId: number, body: MemberDietTemplateDto, cIp: string, adminId: number) {
    let res: IServerResponse;
    const t = await this.sequelize.transaction();
    try {
      const promiseAll = await Promise.all([
        //this.recipeCategory.fetchAllRecipeCategory(),
        this.dietTemplateService.getDietTemplate(body.dietTemplateId),
        this.dietTemplateService.getAllDietDetailsByTemplateId(body.dietTemplateId)
      ]);
      //const categoryList: MstRecipeCategory[] = promiseAll[0];
      const dietTemplate: TxnDietTemplate = promiseAll[0];
      const dietTemplateDetails: TxnDietTemplateDietDetail[] = promiseAll[1];
      const emptyDietList = []; //this.getEmptyDietPlan(categoryList)
      if (dietTemplateDetails) {
        let dietObject: any;
        const dietPlanList = [];
        let startDate, endDate;
        let item: TxnDietTemplateDietDetail;
        for (let cycle = 1; cycle <= dietTemplate.noOfCycle; cycle++) {
          if (dietTemplate.isWeekly) {
            item = dietTemplateDetails.find((x) => x.cycleNumber === cycle && x.dayNumber === null);
            startDate = !startDate ? moment() : moment(endDate).add(1, "day");
            endDate = moment(startDate).add(dietTemplate.noOfDaysInCycle, "day");
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
              modifiedBy: adminId
            };
            dietPlanList.push(dietObject);
          } else {
            for (let day = 1; day <= dietTemplate.noOfDaysInCycle; day++) {
              item = dietTemplateDetails.find((x) => x.cycleNumber === cycle && x.dayNumber === day);
              startDate = !startDate ? moment() : moment(endDate).add(1, "day");
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
                modifiedBy: adminId
              };
              dietPlanList.push(dietObject);
            }
          }
        }
        const createDP = await this.memberDietPlanDetailRepository.bulkCreate(dietPlanList);
        const updateObj = {
          currentCycleNo: 1,
          currentDayNo: 1,
          startDate: moment(),
          endDate: moment(endDate).add(dietTemplate.noOfCycle * dietTemplate.noOfDaysInCycle, "day"),
          modifiedIp: cIp,
          modifiedBy: adminId
        };
        const updateDP = await this.memberDietPlanRepository.update(updateObj, {
          where: {
            memberDietPlanId: body.memberDietPlanId
          }
        });
        if (createDP && updateDP) {
          await t.commit();
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS,
            data: null
          };
        } else {
          await t.rollback();
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null
          };
        }
      }
    } catch (e) {
      await t.rollback();
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e["message"] : StringResource.SOMETHING_WENT_WRONG,
        data: null
      };
    }
    return res;
  }

  async deleteDietPlan(
    dietPlanId: number,
    cycleNo: number,
    ip: string,
    adminId: number,
    dayNo?: number
  ): Promise<IServerResponse> {
    let res: IServerResponse;
    const t = await this.sequelize.transaction();
    try {
      const dietDetails = await this.memberDietPlanDetailRepository.findAll({
        where: {
          memberDietPlanId: dietPlanId
        },
        order: [
          ["cycleNo", "asc"],
          ["dayNo", "asc"]
        ],
        raw: true,
        nest: true
      });
      const indexCheckCondition = { cycleNo: Number(cycleNo) };
      if (dayNo) {
        indexCheckCondition["dayNo"] = Number(dayNo);
      }
      const cIndex = _.findIndex(dietDetails, indexCheckCondition);
      await this.memberDietPlanDetailRepository.destroy({
        where: {
          ...indexCheckCondition,
          memberDietPlanId: dietPlanId
        }
      });
      await this.memberDietPlanRepository.update(
        {
          currentCycleNo: cIndex === 0 ? null : dietDetails[cIndex - 1].cycleNo,
          currentDayNo: cIndex === 0 ? null : dietDetails[cIndex - 1].dayNo,
          isCompleted: false,
          endDate: cIndex === 0 ? null : dietDetails[cIndex - 1].endDate,
          modifiedIp: ip,
          modifiedBy: adminId
        },
        {
          where: {
            memberDietPlanId: dietPlanId
          }
        }
      );
      await t.commit();
      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: null
      };
    } catch (e) {
      await t.rollback();
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e["message"] : StringResource.SOMETHING_WENT_WRONG,
        data: null
      };
    }
    return res;
  }

  async updateStatus(memberId: number, dietPlanId: number, adminId: number, ip: string): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const dietPlan = await this.memberDietPlanRepository.findOne({
        where: {
          memberDietPlanId: dietPlanId,
          memberId: memberId
        }
      });
      if (dietPlan) {
        await this.memberDietPlanRepository.update(
          {
            isCompleted: !dietPlan.isCompleted,
            modifiedBy: adminId,
            modifiedIp: ip
          },
          {
            where: {
              memberDietPlanId: dietPlanId
            }
          }
        );
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.DIET_PLAN_UPDATE_STATUS,
          data: null
        };
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.WARNING_DIET_PLAN_NOT_FOUND,
          data: null
        };
      }
    } catch (error) {
      this.exceptionService.logError(error);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? error["message"] : StringResource.SOMETHING_WENT_WRONG,
        data: null
      };
    }
    return res;
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
        sequence: c.sequence
      });
    }
    return dietCategoryList;
  }

  private convertDBObject(obj: TxnMemberDietPlan): IMemberDietPlan {
    return <IMemberDietPlan>(<ICreateUpdate>{
      program: obj["MemberPayment"]["MemberPaymentProgram"]["program"],
      programCategory:
        obj["MemberPayment"]["MemberPaymentProgram"]["ProgramCategory"]["programCateg"] ||
        obj["MemberPayment"]["MemberPaymentProgram"]["ProgramCategory"]["programCategory"],
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
        ? "Completed"
        : obj.currentCycleNo && obj.currentCycleNo > 0
          ? "In Progress"
          : "Not Started",
      startDate: obj.startDate ? moment(obj.startDate, DB_DATE_FORMAT) : null,
      endDate: obj.endDate ? moment(obj.endDate, DB_DATE_FORMAT) : null,
      active: obj.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(obj["CreatedBy"], "CreatedBy"),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(obj["ModifiedBy"], "ModifiedBy"),
      createdAt: moment(obj.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(obj.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      ...this.findUpcomingDiet(obj)
    });
  }

  private findUpcomingDiet(obj) {
    if (obj.isCompleted) {
      return {
        upcomingDay: null,
        upcomingCycle: null,
        showActionBtn: false,
        showDaily: false,
        showWeekly: false
      };
    }
    // diet plan not started yet
    if ((!obj.currentCycleNo || obj.currentCycleNo === 0) && !(obj.currentDayNo || obj.currentDayNo === 0)) {
      return {
        upcomingDay: 1,
        upcomingCycle: 1,
        showActionBtn: true,
        showDaily: true,
        showWeekly: true
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
          showWeekly: true
        };
      } else {
        // daily plan
        if (obj.currentDayNo < obj.noOfDaysInCycle) {
          return {
            upcomingDay: obj.currentDayNo + 1,
            upcomingCycle: obj.currentCycleNo,
            showActionBtn: true,
            showDaily: true,
            showWeekly: false
          };
        } else if (obj.currentDayNo === obj.noOfDaysInCycle) {
          return {
            upcomingDay: 1,
            upcomingCycle: obj.currentCycleNo + 1,
            showActionBtn: true,
            showDaily: true,
            showWeekly: true
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
          showWeekly: false
        };
      } else {
        // daily plan
        if (obj.currentDayNo < obj.noOfDaysInCycle) {
          return {
            upcomingDay: obj.currentDayNo + 1,
            upcomingCycle: obj.currentCycleNo,
            showActionBtn: true,
            showDaily: true,
            showWeekly: false
          };
        } else if (obj.currentDayNo === obj.noOfDaysInCycle) {
          return {
            upcomingDay: null,
            upcomingCycle: null,
            showActionBtn: !(moment(obj.endDate, "YYYY-MM-DD").isBefore(moment(moment(), "YYYY-MM-DD"), "date")),
            showDaily: false,
            showWeekly: false
          };
        }
      }
    }
    return {
      upcomingDay: null,
      upcomingCycle: null,
      showActionBtn: false,
      showDaily: false,
      showWeekly: false
    };
  }

  private convertDietDetail(
    categoryList: MstRecipeCategory[],
    recipeList: DropdownListInterface[],
    dietDetail: any
  ): IDietPlanDetail[] {
    const dietCategory: IDietPlanDetail[] = [];
    for (const c of categoryList) {
      const f = dietDetail ? _.find(dietDetail.dietPlan, { recipeCategoryId: c.recipeCategoryId }) : null;
      const dietRecipeList = [];
      if (f) {
        for (const r of f["recipeIds"]) {
          const tR = _.find(recipeList, { id: r });
          if (tR) {
            dietRecipeList.push(tR);
          }
        }
      }
      dietCategory.push(<IDietPlanDetail>{
        dietDetail: f ? f["dietDetail"] : null,
        recipeIds: f ? f["recipeIds"] : [],
        recipeList: dietRecipeList,
        recipeCategory: c.recipeCategory,
        recipeCategoryId: c.recipeCategoryId,
        sequence: c.sequence
      });
    }
    return dietCategory;
  }
}
