import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DB_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
  IN_COUNTRY_ID,
  PRIMARY_FRANCHISE,
} from '../../../constants/config-constants';
import { StringResource, ITableList, IFileModel, IManageMemberPayment } from 'shared-lib';
import moment from 'moment';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import { TxnMemberPayment } from '../../../core/database/models/txn-member-payment.model';
import { IMemberPayment } from 'shared-lib';
import { MstPaymentMode } from '../../../core/database/models/mst-payment-mode.model';
import { TxnAddress } from '../../../core/database/models/txn-address.model';
import { ICreateUpdate } from 'shared-lib';
import { CreateMemberPaymentDto, PaymentReportDto } from '../dto/member-payment.dto';
import { MstPaymentStatus } from '../../../core/database/models/mst-payment-status.model';
import { CommonService } from '../../common/common.service';
import { TableEnum } from 'shared-lib';
import { AddressTypeEnum } from 'shared-lib';
import { TxnMemberDietPlan } from '../../../core/database/models/txn-member-diet-plan.model';
import { PlanService } from '../../program-and-plan/services/plan.service';
import { ConfigParameterService } from '../../config-parameter/config-parameter.service';
import { CurrencyService } from '../../lov/services/currency.service';
import * as _ from 'lodash';
import { PdfService } from 'src/core/pdf/pdf.service';
import { MediaFolderEnum, ConfigParam, PDFTemplateEnum } from 'shared-lib';
import { MstProgramPlan } from 'src/core/database/models/mst-program-plan.model';
import { MstProgram } from 'src/core/database/models/mst-program.model';
import { TxnMember } from 'src/core/database/models/txn-member.model';
import { TxnMemberDietPlanDetail } from 'src/core/database/models/txn-member-diet-plan-detail.model';
import { IAttachment, IEmailParams } from 'src/core/mail/email-params.interface';
import { EmailTypeEnum } from 'shared-lib';
import { EmailService } from 'src/core/mail/email.service';
import { IBaseUser } from '../interfaces/member.interface';
import { Op, Transaction } from 'sequelize';

@Injectable()
export class MemberPaymentService {
  constructor(
    @InjectModel(TxnMemberPayment)
    private readonly memberPaymentRepository: typeof TxnMemberPayment,
    @InjectModel(TxnMemberDietPlan)
    private readonly memberDietPlanRepository: typeof TxnMemberDietPlan,
    @InjectModel(TxnMemberDietPlanDetail)
    private readonly memberDietPlanDetailRepository: typeof TxnMemberDietPlanDetail,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    private planService: PlanService,
    private currencyConfigService: CurrencyService,
    private commonService: CommonService,
    private configParameterService: ConfigParameterService,
    private sequelize: Sequelize,
    private pdfService: PdfService,
    private readonly emailService: EmailService,
  ) { }

  public async findAll(id: number): Promise<ITableList<IMemberPayment>> {
    const whereCondition: any = {
      memberId: id,
      active: true,
    };
    TxnMemberPayment.belongsTo(TxnMemberDietPlan, {
      targetKey: 'memberPaymentId',
      foreignKey: 'memberPaymentId',
    });
    const { rows, count } = await this.memberPaymentRepository.findAndCountAll<TxnMemberPayment>({
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
          model: TxnMemberDietPlan,
          attributes: ['noOfCycle', 'noOfDaysInCycle', 'currentCycleNo', 'currentDayNo'],
          required: false,
        },
        {
          model: TxnAddress,
          required: false,
          as: 'MemberAddress',
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
      order: [['createdAt', 'ASC']],
      raw: true,
      nest: true,
    });
    const resList: IMemberPayment[] = [];
    for (const s of rows) {
      resList.push(this.convertDBObject(s));
    }
    return <ITableList<IMemberPayment>>{
      data: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IMemberPayment> {
    TxnMemberPayment.belongsTo(TxnMemberDietPlan, {
      targetKey: 'memberPaymentId',
      foreignKey: 'memberPaymentId',
    });
    const find = await this.memberPaymentRepository.findOne({
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
          model: MstProgramPlan,
          required: true,
          attributes: ['plan'],
        },
        {
          model: MstProgram,
          required: true,
          attributes: ['program'],
        },
        {
          model: TxnMemberDietPlan,
          attributes: ['noOfCycle', 'noOfDaysInCycle', 'currentCycleNo', 'currentDayNo'],
          required: false,
        },
        {
          model: TxnAddress,
          required: false,
          as: 'MemberAddress',
        },
        {
          model: TxnAddress,
          required: false,
          as: 'MemberBillingAddress',
        },
        {
          model: TxnMember,
          required: true,
          attributes: ['firstName', 'lastName'],
        },
      ],
      where: {
        memberPaymentId: id,
      },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    find['address'] = find['MemberAddress'] ? find['MemberAddress'] : null;
    find['billingAddress'] = find['MemberBillingAddress'] ? find['MemberBillingAddress'] : null;
    return this.convertDBObject(find);
  }

  public async create(
    memberId: number,
    obj: IManageMemberPayment,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const t = await this.sequelize.transaction();
    let addressId = null;
    try {
      if (obj.address) {
        if (obj.address.addressId && obj.address.addressId > 0) addressId = obj.address.addressId;
        else {
          const insertedAddress = await this.commonService.addAddress({
            tableId: TableEnum.TXN_MEMBER,
            pkOfTable: memberId,
            addressTypeId: AddressTypeEnum.PERMANENT_ADDRESS,
            postalAddress: obj.address.postalAddress,
            pinCode: obj.address.pinCode,
            cityVillage: obj.address.cityVillage,
            stateId: obj.address.stateId,
            countryId: obj.address.countryId,
            latitude: obj.address.latitude,
            longitude: obj.address.longitude,
            createdBy: adminId,
            modifiedBy: adminId,
            createdIp: cIp,
            modifiedIp: cIp,
          }, t);
          if (insertedAddress) {
            addressId = insertedAddress['addressId'];
          }
        }
      }
      const createObj = {
        memberId: memberId,
        paymentDate: moment(obj.paymentDate),
        paymentModeId: obj.paymentModeId,
        programId: obj.programId,
        programPlanId: obj.planId,
        addressId: addressId,
        transactionId: obj.transactionId ? obj.transactionId : null,
        invoiceId: null,
        paymentStatusId: obj.paymentStatusId,
        promoCode: obj.systemDiscountAmount && obj.systemDiscountAmount > 0 ? `OFF${obj.systemDiscountAmount}` : null,
        isTaxApplicable: obj.isTaxApplicable,
        paymentObj: await this.calculateFees(obj),
        refundObject: null,
        paymentGatewayResponse: null,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const createdObj = await this.createInDB(createObj, t);
      await this.memberPaymentRepository.update(
        {
          invoiceId: CommonFunctionsUtil.getInvoiceNumber(createdObj['memberPaymentId']),
        },
        {
          where: {
            memberPaymentId: createdObj['memberPaymentId'],
          },
          transaction: t,
        },
      );
      await this.createDietPlanDB({
        memberId: memberId,
        memberPaymentId: createdObj['memberPaymentId'],
        noOfCycle: obj.noOfCycle,
        noOfDaysInCycle: obj.daysInCycle,
        currentCycleNo: null,
        currentDayNo: null,
        startDate: null,
        endDate: null,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      }, t);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async update(id: number, obj: IManageMemberPayment, cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const find = await this.memberPaymentRepository.findOne({
        where: {
          memberPaymentId: id,
        },
      });
      if (!find) {
        await t.rollback();
        throw new NotFoundException(StringResource.NO_DATA_FOUND);
      }
      const updateObj = {
        memberId: obj.memberId,
        date: moment(obj.paymentDate),
        active: obj.active != null ? obj.active : find.active,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };
      await this.updateInDB(id, updateObj);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      const find = await this.memberPaymentRepository.findOne({
        where: {
          memberPaymentId: id,
        },
      });
      if (!find) {
        await transaction.rollback();
        throw new NotFoundException(StringResource.NO_DATA_FOUND);
      }
      const updateObj = {
        active: obj.active,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };
      await this.updateInDB(id, updateObj);
      if (!obj.active) {
        const memberDietPlan = await this.memberDietPlanRepository.findOne({
          attributes: ['memberDietPlanId'],
          where: {
            memberPaymentId: id,
          },
        });
        if (memberDietPlan) {
          await this.memberDietPlanDetailRepository.destroy({
            where: {
              memberDietPlanId: memberDietPlan.memberDietPlanId,
            },
          });
          const updateDietPlanObj = {
            active: obj.active,
            modifiedBy: adminId,
          };
          await this.memberDietPlanRepository.update(updateDietPlanObj, { where: { memberDietPlanId: memberDietPlan.memberDietPlanId } });
        }
      }
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  public async findAllById(memberId: number): Promise<TxnMemberPayment[]> {
    return await this.memberPaymentRepository.findAll<TxnMemberPayment>({
      where: { memberId: memberId },
      raw: true,
      nest: true,
    });
  }

  async generateInvoice(memberPaymentId: number): Promise<IFileModel> {
    const result = await this.generateInvoicePdf(memberPaymentId);
    if (!result || !result.fileModel) {
      throw new NotFoundException(StringResource.SOMETHING_WENT_WRONG);
    }
    return result.fileModel;
  }

  async sendInvoice(memberPaymentId: number): Promise<void> {
    const result = await this.generateInvoicePdf(memberPaymentId);
    if (!result || !result.fileModel) {
      throw new NotFoundException(StringResource.SOMETHING_WENT_WRONG);
    }
    const emailParams: IEmailParams = {
      emailType: EmailTypeEnum.SEND_INVOICE,
      toUserInfo: await this.getMemberBasicDetails(result.memberId),
      attachments: [
        {
          name: result.fileModel.fileName,
          path: `${CommonFunctionsUtil.getMediaFolderPath()}/${MediaFolderEnum.DOWNLOADS}/${
            result.fileModel.filePath
          }`,
        } as IAttachment,
      ] as IAttachment[],
    };
    await this.emailService.sendEmail(emailParams);
  }

  async getMemberBasicDetails(id: number): Promise<IBaseUser> {
    const member = await this.memberRepository.findOne({
      where: { memberId: id },
      raw: true,
      attributes: ['firstName', 'lastName', 'emailId'],
    });
    return {
      name: member ? member.firstName + ' ' + member.lastName || '' : '',
      emailId: member.emailId,
    } as IBaseUser;
  }

  async generateInvoicePdf(memberPaymentId: number) {
    const paymentData = await this.fetchById(memberPaymentId);
    const memberId = paymentData.memberId;
    const parts = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: paymentData.paymentObj.user.currency,
    }).formatToParts(10000);
    const symbol = parts.find((p) => p.type === 'currency').value;
    paymentData.paymentObj.user.currency = symbol;
    paymentData.date = moment(paymentData.date).format('DD-MM-YYYY');
    const fileModel = await this.pdfService.generatePDF(
      `${PDFTemplateEnum.INVOICE}`,
      `${MediaFolderEnum.INVOICE}`,
      `Invoice_${paymentData.invoiceId}_${paymentData.date}_${memberPaymentId}`,
      { data: paymentData },
    );
    return { fileModel: fileModel, memberId: memberId };
  }

  async generatePaymentReport(body: PaymentReportDto): Promise<void> {
    const list = await this.memberPaymentRepository.findAll({
      where: {
        paymentDate: {
          [Op.between]: [body.fromDate, body.toDate],
        },
      },
      raw: true,
      nest: true,
    });
    for (const s of list) {
      await this.generateInvoicePdf(s.memberPaymentId);
    }
  }

  private convertDBObject(obj: TxnMemberPayment): IMemberPayment {
    return <IMemberPayment>(<ICreateUpdate>{
      id: obj.memberPaymentId,
      memberId: obj.memberId,
      memberName: obj['MemberPayment']
        ? obj['MemberPayment']['firstName'] +
        (obj['MemberPayment']['lastName'] ? ' ' + obj['MemberPayment']['lastName'] : '')
        : null,
      programId: obj.programId,
      programPlanId: obj.programPlanId,
      paymentModeId: obj.paymentModeId,
      paymentMode: obj['MemberPaymentMode'] ? obj['MemberPaymentMode']['paymentMode'] : null,
      paymentStatus: obj['MemberPaymentStatus'] ? obj['MemberPaymentStatus']['paymentStatus'] : null,
      addressId: obj.addressId ? obj.addressId : null,
      transactionId: obj.transactionId,
      invoiceId: obj.invoiceId,
      paymentStatusId: obj.paymentStatusId,
      paymentObj: obj.paymentObj,
      refundObj: obj.refundObject,
      promoCode: obj.promoCode,
      isTaxApplicable: obj.isTaxApplicable,
      paymentGatewayResponse: obj.paymentGatewayResponse,
      program: obj['MemberPaymentProgram'] ? obj['MemberPaymentProgram']['program'] : null,
      plan: obj['MemberPaymentProgramPlan'] ? obj['MemberPaymentProgramPlan']['plan'] : null,
      noOfCycle: obj['txn_member_diet_plan']['noOfCycle'],
      noOfDaysInCycle: obj['txn_member_diet_plan']['noOfDaysInCycle'],
      currentCycleNo: obj['txn_member_diet_plan']['currentCycleNo'] ? obj['MemberPaymentMode']['currentCycleNo'] : null,
      currentDayNo: obj['txn_member_diet_plan']['currentDayNo'] ? obj['MemberPaymentMode']['currentDayNo'] : null,
      deletable:
        (!obj['txn_member_diet_plan']['currentCycleNo'] || obj['txn_member_diet_plan']['currentCycleNo'] === 0) &&
        (!obj['txn_member_diet_plan']['currentDayNo'] || obj['txn_member_diet_plan']['currentDayNo'] === 0),
      date: obj.paymentDate ? moment(obj.paymentDate, DB_DATE_FORMAT) : null,
      address: obj['address'] ? obj['address'] : null,
      billingAddress: obj['billingAddress'] ? obj['billingAddress'] : null,
      gstNumber: obj['gstNumber'] ? obj['gstNumber'] : null,
      active: obj.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(obj['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(obj['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(obj.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(obj.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    });
  }

  private async createInDB(obj: any, transaction: Transaction) {
    return await this.memberPaymentRepository.create(obj, { transaction: transaction });
  }

  private async createDietPlanDB(obj: any, transaction: Transaction) {
    return await this.memberDietPlanRepository.create(obj, { transaction: transaction });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.memberPaymentRepository.update(obj, { where: { memberPaymentId: id } });
  }

  private async updateDietPlanStatusInDB(id: number, obj: any) {
    return await this.memberDietPlanRepository.update(obj, { where: { memberDietPlanId: id } });
  }

  private calcTaxObj(clientCountryId, clientStateId, businessCountryId, businessStateId, amount, taxPercentage) {
    if (businessCountryId === IN_COUNTRY_ID && clientCountryId === IN_COUNTRY_ID) {
      if (clientStateId === businessStateId) {
        // SGST and CGST
        return {
          SGST: { taxPercentage: taxPercentage / 2, amount: amount / 2 },
          CGST: { taxPercentage: taxPercentage / 2, amount: amount / 2 },
        };
      } else {
        // IGST
        return {
          IGST: { taxPercentage: taxPercentage, amount: amount },
        };
      }
    } else {
      // IGST
      return {
        IGST: { taxPercentage: taxPercentage, amount: amount },
      };
    }
  }

  private async calculateFees(obj: CreateMemberPaymentDto) {
    try {
      const planFees = await this.planService.findById(obj.planId);
      if (!planFees) {
        throw Error('Plan not exists');
      }
      const configParameters = CommonFunctionsUtil.getConfigArray((await this.configParameterService.findAll()));
      const currencyConfigList = await this.currencyConfigService.getCurrencyConfigList();
      const franchiseAddresses = await this.commonService.findAddresses(TableEnum.MST_FRANCHISE, PRIMARY_FRANCHISE);
      let franchiseAddress;
      if (franchiseAddresses && franchiseAddresses.length > 0) {
        franchiseAddress = franchiseAddresses[0];
      }
      const userCurrency = obj.userCurrency ? obj.userCurrency : configParameters[ConfigParam.DEFAULT_CURRENCY];
      const systemCurrency = configParameters[ConfigParam.DEFAULT_CURRENCY];
      const taxApplicable = obj.isTaxApplicable;
      const taxPercentage = Number(configParameters[ConfigParam.TAX_PERCENTAGE]);
      const targetCurrencyConfig = _.find(currencyConfigList, {
        sourceCurrencyCode: userCurrency,
      });
      const systemCurrencyOrderAmount = Number(planFees.inrAmount);
      const systemCurrencyDiscountAmount = Number(obj.systemDiscountAmount ? obj.systemDiscountAmount : 0);
      const systemCurrencyTaxAmount = Number(taxApplicable
        ? ((systemCurrencyOrderAmount - systemCurrencyDiscountAmount) * taxPercentage) / 100
        : 0);
      const systemCurrencyTotalAmount =
        Number(systemCurrencyOrderAmount - systemCurrencyDiscountAmount + systemCurrencyTaxAmount);
      const userCurrencyOrderAmount = this.convertAmount(
        systemCurrencyOrderAmount,
        targetCurrencyConfig.conversionRate,
        targetCurrencyConfig.conversionRateFeesInPercent,
      );
      const userCurrencyDiscountAmount = this.convertAmount(
        systemCurrencyDiscountAmount,
        targetCurrencyConfig.conversionRate,
        targetCurrencyConfig.conversionRateFeesInPercent,
      );
      const userCurrencyTaxAmount = Number(taxApplicable
        ? ((userCurrencyOrderAmount - userCurrencyDiscountAmount) * taxPercentage) / 100
        : 0);
      const userCurrencyTotalAmount = Number(userCurrencyOrderAmount - userCurrencyDiscountAmount + userCurrencyTaxAmount);
      let userTaxObj = null;
      let systemTaxObj = null;
      if (obj.isTaxApplicable) {
        if (!franchiseAddress) {
          throw new NotFoundException('Franchise address not found for tax calculation');
        }
        systemTaxObj = this.calcTaxObj(
          obj.address.countryId,
          obj.address.stateId,
          franchiseAddress.countryId,
          franchiseAddress.stateId,
          systemCurrencyTaxAmount,
          taxPercentage,
        );
        userTaxObj = this.calcTaxObj(
          obj.address.countryId,
          obj.address.stateId,
          franchiseAddress.countryId,
          franchiseAddress.stateId,
          userCurrencyTaxAmount,
          taxPercentage,
        );
      }
      return {
        user: {
          orderAmount: userCurrencyOrderAmount,
          discountAmount: userCurrencyDiscountAmount,
          taxAmount: userCurrencyTaxAmount,
          totalAmount: userCurrencyTotalAmount,
          currency: userCurrency,
          taxObj: userTaxObj,
        },
        system: {
          orderAmount: systemCurrencyOrderAmount,
          discountAmount: systemCurrencyDiscountAmount,
          taxAmount: systemCurrencyTaxAmount,
          totalAmount: systemCurrencyTotalAmount,
          currency: systemCurrency,
          taxObj: systemTaxObj,
        },
        taxPercentage: taxPercentage,
      };
    } catch (e) {
      throw e;
    }
  }

  private convertAmount(primaryAmount: number, conversionRate: number, conversionFees: number): number {
    return Number(primaryAmount / conversionRate);
  }
}
