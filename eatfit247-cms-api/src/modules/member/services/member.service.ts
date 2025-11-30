import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { CommonFunctionsUtil } from "../../../util/common-functions-util";
import moment from "moment";
import { Sequelize } from "sequelize-typescript";
import { MstFranchise } from "../../../core/database/models/mst-franchise.model";
import { TxnMember } from "../../../core/database/models/txn-member.model";
import { MstReferrer } from "../../../core/database/models/mst-referrer.model";
import { IBasicSearch, IMemberDetails, IMemberFranchise, IMemberList, IMemberReferrer, ITableList } from 'shared-lib';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from "../../../constants/config-constants";
import { StringResource } from 'shared-lib';
import { CreateMemberDto } from "../dto/member.dto";
import { CryptoUtil } from "../../../util/crypto-util";
import { MstAdminUser } from "../../../core/database/models/mst-admin-user.model";
import { MstCountries } from "../../../core/database/models/mst-countries.model";
import { BasicSearchDto, UpdateUserStatusDto } from "../../../common-dto/basic-input.dto";
import { UserStatusEnum } from 'shared-lib';
import { TxnAssessment } from "../../../core/database/models/txn-assessment.model";
import { MemberPocketGuideService } from "./member-pocket-guide.service";
import { MemberCallScheduleService } from "./member-call-schedule.service";
import { MemberHealthIssueService } from "./member-health-issue.service";
import { AssessmentService } from "./assessment.service";
import { MemberBodyStatsService } from "./member-body-stats.service";
import { MemberPaymentService } from "./member-payment.service";
import { IBaseUser } from "../interfaces/member.interface";
import { IEmailParams } from "src/core/mail/email-params.interface";
import { EmailTypeEnum } from 'shared-lib';
import { EmailService } from "src/core/mail/email.service";
import { Op } from "sequelize";
import { SearchUtil } from "src/util/search-util";
import { MemberDashboardService } from "./member-dashboard.service";

@Injectable()
export class MemberService {
  constructor(
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    private memberPocketGuideService: MemberPocketGuideService,
    private memberCallScheduleService: MemberCallScheduleService,
    private memberHealthIssueService: MemberHealthIssueService,
    private memberHealthParameterService: MemberBodyStatsService,
    private memberPaymentService: MemberPaymentService,
    private assessmentService: AssessmentService,
    private dashboardService: MemberDashboardService,
    private sequelize: Sequelize,
    private emailService: EmailService
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IMemberList>> {
    let whereCondition: any = {};
    if (searchDto.name) {
      whereCondition = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchDto.name}%` } },
          { lastName: { [Op.iLike]: `%${searchDto.name}%` } }
        ]
      };
    }
    const dateFilter = SearchUtil.filterDateRange(searchDto.createdFrom, searchDto.createdTo);
    if (dateFilter) {
      whereCondition["createdAt"] = dateFilter;
    }
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    TxnMember.belongsTo(TxnAssessment, {
      targetKey: "memberId",
      foreignKey: "memberId"
    });
    const { rows, count } = await this.memberRepository.findAndCountAll<TxnMember>({
      include: [
        {
          model: TxnAssessment,
          required: false,
          attributes: ["assessmentId"]
        },
        {
          model: MstAdminUser,
          required: false,
          as: "MemberNutritionist",
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE
        },
        {
          model: MstCountries,
          required: true,
          as: "MemberCountry",
          attributes: ["country", "countryId"]
        },
        {
          model: MstFranchise,
          required: false,
          as: "MemberFranchise",
          attributes: ["franchiseId", "firstName", "lastName", "companyName", "logo", "emailId", "contactNumber"]
        },
        {
          model: MstReferrer,
          required: false,
          as: "MemberReferrer",
          attributes: ["referrerId", "name", "companyName", "logo", "emailId", "contactNumber"]
        }
      ],
      where: whereCondition,
      order: [
        ["firstName", "ASC"],
        ["lastName", "ASC"]
      ],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true
    });
    const resList: IMemberList[] = [];
    for (const s of rows) {
      resList.push(this.convertDBToInterface(s));
    }
    return <ITableList<IMemberList>>{
      data: resList,
      count: count
    };
  }

  public async fetchById(id: number): Promise<IMemberList> {
    const find = await this.loadBasicInfo(id);
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return find;
  }

  public async fetchDetailById(id: number): Promise<IMemberDetails> {
    const find = await this.loadBasicInfo(id);
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
      const [
        memberPocketGuide,
        memberCallSchedule,
        memberHealthIssues,
        memberAssessment,
        memberHealthParameters,
        memberPayment
      ] = await Promise.all([
        this.memberPocketGuideService.findAllById(id),
        this.memberCallScheduleService.findAllById(id),
        this.memberHealthIssueService.findAllById(id),
        this.assessmentService.fetchById(id),
        this.memberHealthParameterService.findAllById(id),
        this.memberPaymentService.findAllById(id)
      ]);
      const assessment = memberAssessment;
    const healthIssueCsv = [];
    for (const s of memberHealthIssues) {
      healthIssueCsv.push(s["HealthIssueMemberMap"]["healthIssue"]);
    }
    const pocketGuideCsv = [];
    for (const s of memberPocketGuide) {
      pocketGuideCsv.push(s["MemberPocketGuidePocketGuide"]["pocketGuide"]);
    }
    return <IMemberDetails>{
      basicInfo: find,
      pocketGuideCount: memberPocketGuide.length,
      callScheduleCount: memberCallSchedule.length,
      healthIssueCount: memberHealthIssues.length,
      healthParameterCount: memberHealthParameters.length,
      paymentCount: memberPayment.length,
      healthIssues: healthIssueCsv,
      pocketGuides: pocketGuideCsv,
      assessment: assessment
    };
  }

  public async create(obj: CreateMemberDto, cIp: string, adminId: number): Promise<void> {
    const checkUser = await this.findOneByEmail(obj.emailId);
    if (checkUser) {
      throw new BadRequestException(StringResource.ACCOUNT_ALREADY_PRESENT);
    }
    const t = await this.sequelize.transaction();
    try {
      const createObj = {
        firstName: obj.firstName,
        lastName: obj.lastName,
        countryCode: obj.countryCode,
        contactNumber: obj.contactNumber,
        emailId: obj.emailId,
        password: await CryptoUtil.generateHash(`${CommonFunctionsUtil.removeSpecialChar(obj.firstName)}@123456`),
        passwordTemp: await CryptoUtil.generateHash(`${CommonFunctionsUtil.removeSpecialChar(obj.firstName)}@123456`),
        franchiseId: obj.franchiseId,
        nutritionistId: obj.nutritionistId ? obj.nutritionistId : null,
        countryId: obj.countryId,
        referrerId: obj.franchiseId ? obj.referrerId : null,
        userStatusId: obj.userStatusId,
        deactivationReason: obj.reason ? obj.reason : null,
        profilePicture: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp
      };
      await this.createInDB(createObj);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async update(id: number, obj: CreateMemberDto, cIp: string, adminId: number): Promise<void> {
    const checkUser = await this.findOneByEmail(obj.emailId);
    if (checkUser && Number(checkUser.memberId) !== Number(id)) {
      throw new BadRequestException(StringResource.ACCOUNT_ALREADY_PRESENT);
    }
    const find = await this.memberRepository.findOne({
      where: {
        memberId: id
      }
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const t = await this.sequelize.transaction();
    try {
      const updateObj = {
        firstName: obj.firstName,
        lastName: obj.lastName,
        countryCode: obj.countryCode,
        contactNumber: obj.contactNumber,
        emailId: obj.emailId,
        franchiseId: obj.franchiseId,
        nutritionistId: obj.nutritionistId ? obj.nutritionistId : null,
        countryId: obj.countryId,
        referrerId: obj.franchiseId ? obj.referrerId : null,
        userStatusId: obj.userStatusId,
        deactivationReason: obj.reason ? obj.reason : null,
        profilePicture: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        modifiedBy: adminId,
        modifiedIp: cIp
      };
      await this.updateInDB(id, updateObj);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async changeStatus(
    id: number,
    obj: UpdateUserStatusDto,
    cIp: string,
    memberId: number
  ): Promise<void> {
    const find = await this.memberRepository.findOne({
      where: {
        memberId: id
      }
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      userStatusId: obj.statusId,
      deactivationReason: obj.reason,
      modifiedBy: memberId,
      modifiedIp: cIp
    };
    await this.updateInDB(id, updateObj);
  }

  public async resetPassword(id: number, cIp: string, adminId: number): Promise<void> {
    const find = await this.memberRepository.findOne({
      where: {
        memberId: id
      },
      raw: true
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    if (find.userStatusId === UserStatusEnum.IN_ACTIVE) {
      throw new BadRequestException(StringResource.INACTIVE_USER);
    }
    const newPassword = CommonFunctionsUtil.generateRandomString(12);
    const updateObj = {
      password: newPassword,
      modifiedBy: adminId,
      modifiedIp: cIp
    };
    await this.updateInDB(id, updateObj);
    const emailParams: IEmailParams = {
      emailType: EmailTypeEnum.PASSWORD_RESET,
      toUserInfo: await this.getMemberBasicDetails(id),
      message: newPassword
    };
    this.emailService.sendEmail(emailParams);
  }

  async getMemberName(id: number): Promise<string> {
    const member = await this.memberRepository.findOne({
      where: { memberId: id },
      raw: true,
      attributes: ["firstName", "lastName"]
    });
    return member ? member.firstName + " " + member.lastName || "" : "";
  }

  async getMemberBasicDetails(id: number): Promise<IBaseUser> {
    const member = await this.memberRepository.findOne({
      where: { memberId: id },
      raw: true,
      attributes: ["firstName", "lastName", "emailId"]
    });
    return {
      name: member ? member.firstName + " " + member.lastName || "" : "",
      emailId: member.emailId
    } as IBaseUser;
  }

  private async createInDB(obj: any) {
    return await this.memberRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.memberRepository.update(obj, { where: { memberId: id } });
  }

  private async findOneByEmail(emailId: string): Promise<TxnMember | null> {
    return await this.memberRepository.findOne<TxnMember>({ where: { emailId: emailId }, raw: true, nest: true });
  }

  public async loadBasicInfo(memberId: number): Promise<IMemberList> {
    TxnMember.belongsTo(TxnAssessment, {
      targetKey: "memberId",
      foreignKey: "memberId"
    });
    const find = await this.memberRepository.findOne({
      include: [
        {
          model: TxnAssessment,
          required: false,
          attributes: ["assessmentId"]
        },
        {
          model: MstAdminUser,
          required: false,
          as: "MemberNutritionist",
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE
        },
        {
          model: MstCountries,
          required: true,
          as: "MemberCountry",
          attributes: ["country", "countryId"]
        },
        {
          model: MstFranchise,
          required: false,
          as: "MemberFranchise",
          attributes: ["franchiseId", "firstName", "lastName", "companyName", "logo", "emailId", "contactNumber"]
        },
        {
          model: MstReferrer,
          required: false,
          as: "MemberReferrer",
          attributes: ["referrerId", "name", "companyName", "logo", "emailId", "contactNumber"]
        }
      ],
      where: {
        memberId: memberId
      },
      raw: true,
      nest: true
    });
    if (find) {
      return this.convertDBToInterface(find);
    } else {
      return null;
    }
  }

  private convertDBToInterface(dbObj): IMemberList {
    const temp = <IMemberList>{
      memberId: dbObj.memberId,
      firstName: dbObj.firstName,
      lastName: dbObj.lastName,
      imagePath: CommonFunctionsUtil.getImagesObj(dbObj.profilePicture),
      emailId: dbObj.emailId,
      franchiseId: dbObj.franchiseId,
      referrerId: dbObj.referrerId,
      nutritionistId: dbObj.nutritionistId,
      countryId: dbObj.countryId,
      countryName: dbObj["MemberCountry"]["country"],
      countryCode: dbObj.countryCode,
      contactNumber: dbObj.contactNumber,
      userStatusId: dbObj.userStatusId,
      hasAnyPlan: dbObj.hasAnyPlan,
      deactivationReason: dbObj.deactivationReason,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(dbObj["CreatedBy"], "CreatedBy"),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(dbObj["ModifiedBy"], "ModifiedBy"),
      nutritionist: CommonFunctionsUtil.getAdminShortInfo(dbObj["MemberNutritionist"], "MemberNutritionist"),
      createdAt: moment(dbObj.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(dbObj.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      memberFranchise: dbObj["MemberFranchise"]
        ? <IMemberFranchise>{
          franchiseId: dbObj["MemberFranchise"]["franchiseId"],
          companyName: dbObj["MemberFranchise"]["companyName"],
          imagePath: CommonFunctionsUtil.getImagesObj(dbObj["MemberFranchise"]["logo"]),
          emailId: dbObj["MemberFranchise"]["emailId"],
          contactNumber: dbObj["MemberFranchise"]["contactNumber"],
          firstName: dbObj["MemberFranchise"]["firstName"],
          lastName: dbObj["MemberFranchise"]["lastName"]
        }
        : null,
      memberReferrer: dbObj["MemberReferrer"]
        ? <IMemberReferrer>{
          referrerId: dbObj["MemberReferrer"]["referrerId"],
          name: dbObj["MemberReferrer"]["name"],
          companyName: dbObj["MemberReferrer"]["companyName"],
          imagePath: CommonFunctionsUtil.getImagesObj(dbObj["MemberReferrer"]["logo"]),
          emailId: dbObj["MemberReferrer"]["emailId"],
          contactNumber: dbObj["MemberReferrer"]["contactNumber"]
        }
        : null,
      isAssessmentSubmitted: !!dbObj["txn_assessment"]["assessmentId"]
    };
    return temp;
  }
}
