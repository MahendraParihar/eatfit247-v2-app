import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../../common/exception.service';
import { Sequelize } from 'sequelize-typescript';
import { UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { IServerResponse } from '../../../common-dto/response-interface';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DB_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
  IN_COUNTRY_ID,
  IS_DEV,
  PRIMARY_FRANCHISE,
} from '../../../constants/config-constants';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import * as moment from 'moment';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import { TxnMemberPayment } from '../../../core/database/models/txn-member-payment.model';
import { IMemberPayment } from '../../../response-interface/member-payment.interface';
import { MstPaymentMode } from '../../../core/database/models/mst-payment-mode.model';
import { TxnAddress } from '../../../core/database/models/txn-address.model';
import { ICreateUpdate } from '../../../response-interface/lov.interface';
import { CreateMemberPaymentDto } from '../dto/member-payment.dto';
import { MstPaymentStatus } from '../../../core/database/models/mst-payment-status.model';
import { CommonService } from '../../common/common.service';
import { TableEnum } from '../../../enums/table-enum';
import { AddressTypeEnum } from '../../../enums/address-type-enum';
import { TxnMemberDietPlan } from '../../../core/database/models/txn-member-diet-plan.model';
import { PlanService } from '../../program-and-plan/services/plan.service';
import { ConfigParameterService } from '../../config-parameter/config-parameter.service';
import { DEFAULT_CURRENCY, TAX_PERCENTAGE } from '../../../constants/config-parameters';
import { CurrencyService } from '../../lov/services/currency.service';
import * as _ from 'lodash';
import { PdfService } from 'src/core/pdf/pdf.service';
import { MediaFolderEnum } from 'src/enums/media-folder-enum';
import { PDFTemplateEnum } from 'src/enums/pdf-template-enum';
import { MstProgramPlan } from 'src/core/database/models/mst-program-plan.model';
import { MstProgram } from 'src/core/database/models/mst-program.model';
import { TxnMember } from 'src/core/database/models/txn-member.model';
import { TxnMemberDietPlanDetail } from 'src/core/database/models/txn-member-diet-plan-detail.model';
import { IAttachment, IEmailParams } from 'src/core/mail/email-params.interface';
import { EmailTypeEnum } from 'src/enums/email-type-enum';
import { EmailService } from 'src/core/mail/email.service';
import { IBaseUser } from '../interfaces/member.interface';

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
    private exceptionService: ExceptionService,
    private commonService: CommonService,
    private configParameterService: ConfigParameterService,
    private sequelize: Sequelize,
    private pdfService: PdfService,
    private readonly emailService: EmailService,
  ) {}

  public async findAll(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
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
        order: [['paymentDate', 'ASC']],
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

      const resList: IMemberPayment[] = [];
      for (const s of rows) {
        resList.push(this.convertDBObject(s));
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

      if (find) {
        find['address'] = await this.commonService.findAddressById(find.addressId);
        const dataObj = this.convertDBObject(find);

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

  public async create(
    memberId: number,
    obj: CreateMemberPaymentDto,
    cIp: string,
    adminId: number,
  ): Promise<IServerResponse> {
    let res: IServerResponse;

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
            createdIp: cIp,
            modifiedIp: cIp,
          });
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
      const createdObj = await this.createInDB(createObj);

      const update = this.memberPaymentRepository.update(
        {
          invoiceId: CommonFunctionsUtil.getInvoiceNumber(createdObj['memberPaymentId']),
        },
        {
          where: {
            memberPaymentId: createdObj['memberPaymentId'],
          },
        },
      );

      const dietPlan = this.createDietPlanDB({
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
      });

      if (createdObj && update && dietPlan) {
        await t.commit();
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

  public async update(id: number, obj: CreateMemberPaymentDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const find = await this.memberPaymentRepository.findOne({
        where: {
          memberPaymentId: id,
        },
      });
      if (find) {
        const updateObj = {
          memberId: obj.memberId,
          date: moment(obj.paymentDate),
          active: obj.active != null ? obj.active : find.active,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);

        if (updatedObj) {
          await t.commit();
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

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    const transaction = await this.sequelize.transaction();
    try {
      const find = await this.memberPaymentRepository.findOne({
        where: {
          memberPaymentId: id,
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
          if (!obj.active) {
            const memberDietPlan = await this.memberDietPlanRepository.findOne({
              attributes: ['memberDietPlanId'],
              where: {
                memberPaymentId: id,
              },
            });

            if (memberDietPlan) {
              const deleteDietDetails = await this.memberDietPlanDetailRepository.destroy({
                where: {
                  memberDietPlanId: memberDietPlan.memberDietPlanId,
                },
              });
              if (deleteDietDetails) {
                const updateDietPlanObj = {
                  active: obj.active,
                  modifiedBy: adminId,
                };
                const updateDietPlanResult = await this.updateDietPlanStatusInDB(
                  memberDietPlan.memberDietPlanId,
                  updateDietPlanObj,
                );
              }
            }
          }
          transaction.commit();
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_STATUS_CHANGE,
            data: null,
          };
        } else {
          transaction.rollback();
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        transaction.rollback();
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      transaction.rollback();
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async findAllById(memberId: number): Promise<TxnMemberPayment[]> {
    return await this.memberPaymentRepository.findAll<TxnMemberPayment>({
      where: { memberId: memberId },
      raw: true,
      nest: true,
    });
  }

  async generateInvoice(memberPaymentId: number) {
    let res: IServerResponse;
    try {
      const result = await this.generateInvoicePdf(memberPaymentId);
      if (result && result.fileModel) {
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: null,
          data: result.fileModel,
        };
      } else {
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null,
        };
      }
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
    }

    return res;
  }

  async sendInvoice(memberPaymentId: number) {
    let res: IServerResponse;
    try {
      const result = await this.generateInvoicePdf(memberPaymentId);

      if (result && result.fileModel) {
        const emailParams: IEmailParams = {
          emailType: EmailTypeEnum.SEND_INVOICE,
          toUserInfo: await this.getMemberBasicDetails(result.memberId),
          attachments: [
            {
              name: result.fileModel.fileName,
              path: `${MediaFolderEnum.MEDIA_FOLDER_PHYSICAL_PATH}//${MediaFolderEnum.DOWNLOADS}//${result.fileModel.filePath}`,
            } as IAttachment,
          ] as IAttachment[],
        };

        this.emailService.sendEmail(emailParams);

        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: null,
        };
      } else {
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null,
        };
      }
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
    }

    return res;
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
    let fileModel = null;
    let memberId = 0;
    const res = await this.fetchById(memberPaymentId);
    if (res.code === ServerResponseEnum.SUCCESS) {
      memberId = res.data.memberId;

      const parts = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: res.data.paymentObj.user.currency,
      }).formatToParts(10000);
      const symbol = parts.find((p) => p.type === 'currency').value;

      res.data.paymentObj.user.currency = symbol;

      fileModel = await this.pdfService.generatePDF(
        `${PDFTemplateEnum.INVOICE}`,
        `${MediaFolderEnum.INVOICE}\\${res.data.memberId}`,
        `${memberPaymentId}`,
        res,
      );
    }
    return { fileModel: fileModel, memberId: memberId };
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
      active: obj.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(obj['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(obj['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(obj.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(obj.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    });
  }

  private async createInDB(obj: any) {
    return await this.memberPaymentRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async createDietPlanDB(obj: any) {
    return await this.memberDietPlanRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.memberPaymentRepository
      .update(obj, { where: { memberPaymentId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateDietPlanStatusInDB(id: number, obj: any) {
    return await this.memberDietPlanRepository
      .update(obj, { where: { memberDietPlanId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
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
      const configParameters = await this.configParameterService.findAll();
      const currencyConfigList = await this.currencyConfigService.getCurrencyConfigList();
      const franchiseAddresses = await this.commonService.findAddresses(TableEnum.MST_FRANCHISE, PRIMARY_FRANCHISE);
      let franchiseAddress;
      if (franchiseAddresses && franchiseAddresses.length > 0) {
        franchiseAddress = franchiseAddresses[0];
      }

      const userCurrency = obj.userCurrency ? obj.userCurrency : configParameters[DEFAULT_CURRENCY];
      const systemCurrency = configParameters[DEFAULT_CURRENCY];
      const taxApplicable = obj.isTaxApplicable;
      const taxPercentage = configParameters[TAX_PERCENTAGE];
      const targetCurrencyConfig = _.find(currencyConfigList, {
        sourceCurrencyCode: userCurrency,
      });

      const systemCurrencyOrderAmount = Number(planFees.inrAmount);
      const systemCurrencyDiscountAmount = Number(obj.systemDiscountAmount ? obj.systemDiscountAmount : 0);
      const systemCurrencyTaxAmount = taxApplicable
        ? ((systemCurrencyOrderAmount - systemCurrencyDiscountAmount) * taxPercentage) / 100
        : 0;
      const systemCurrencyTotalAmount =
        systemCurrencyOrderAmount - systemCurrencyDiscountAmount + systemCurrencyTaxAmount;
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
      const userCurrencyTaxAmount = taxApplicable
        ? ((userCurrencyOrderAmount - userCurrencyDiscountAmount) * taxPercentage) / 100
        : 0;
      const userCurrencyTotalAmount = userCurrencyOrderAmount - userCurrencyDiscountAmount + userCurrencyTaxAmount;
      let userTaxObj = null;
      let systemTaxObj = null;
      if (obj.isTaxApplicable) {
        if (!franchiseAddress) {
          this.exceptionService.logException(Error('Franchise address not found for tax calculation'));
          throw Error('something went wrong');
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
          userTaxObj,
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
    return primaryAmount / conversionRate;
  }
}
