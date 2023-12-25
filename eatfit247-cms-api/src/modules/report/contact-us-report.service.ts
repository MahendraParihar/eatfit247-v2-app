import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../common/exception.service';
import { BasicSearchDto, UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { IServerResponse } from '../../common-dto/response-interface';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../constants/config-constants';
import { ServerResponseEnum } from '../../enums/server-response-enum';
import { StringResource } from '../../enums/string-resource';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import * as moment from 'moment/moment';
import { Sequelize } from 'sequelize-typescript';
import { CommonService } from '../common/common.service';
import { TxnContactForm } from '../../core/database/models/txn-contact-form.model';
import { IContactUs } from '../../response-interface/contact-us.interface';
import { CreateContactUsDto, SendResponseDto } from './dto/contact-us.dto';
import { IEmailParams } from 'src/core/mail/email-params.interface';
import { EmailTypeEnum } from 'src/enums/email-type-enum';
import { IBaseUser } from '../member/interfaces/member.interface';
import { EmailService } from 'src/core/mail/email.service';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class ContactUsReportService {
  constructor(
    @InjectModel(TxnContactForm) private readonly contactUsRepository: typeof TxnContactForm,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
    private commonService: CommonService,
    private emailService: EmailService,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');

      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      let offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

      const { rows, count } = await this.contactUsRepository.findAndCountAll<TxnContactForm>({
        include: [
          {
            model: MstAdminUser,
            required: false,
            as: 'RespondedBy',
            attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
          },
        ],
        where: whereCondition,
        order: [['name', 'ASC']],
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

      const resList: IContactUs[] = [];
      for (const s of rows) {
        const iEvent: IContactUs = {
          id: s.contactFormId,
          name: s.name,
          emailId: s.emailId,
          contactNumber: s.contactNumber,
          countryCode: s.countryCode,
          message: s.message,
          respondedMessage: s.respondedMessage,
          respondedBy: CommonFunctionsUtil.getAdminShortInfo(s['RespondedBy'], 'RespondedBy'),
          active: s.active,
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
      const find = await this.contactUsRepository.findOne({
        where: {
          contactFormId: id,
        },
        raw: true,
        nest: true,
      });
      if (find) {
        const dataObj = <IContactUs>{
          id: find.contactFormId,
          name: find.name,
          emailId: find.emailId,
          contactNumber: find.contactNumber,
          countryCode: find.countryCode,
          message: find.message,
          respondedMessage: find.respondedMessage,
          respondedBy: CommonFunctionsUtil.getAdminShortInfo(find['RespondedBy'], 'RespondedBy'),
          active: find.active,
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

  public async create(obj: CreateContactUsDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const createObj = {
        name: obj.name,
        emailId: obj.emailId,
        countryCode: obj.countryCode,
        contactNumber: obj.contactNumber,
        message: obj.message,
        respondedMessage: obj.respondedMessage,
        respondedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const createdObj = await this.createInDB(createObj);

      if (createdObj) {
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
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async update(id: number, obj: CreateContactUsDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const find = await this.contactUsRepository.findOne({
        where: {
          contactFormId: id,
        },
      });
      if (find) {
        const updateObj = {
          name: obj.name,
          emailId: obj.emailId,
          countryCode: obj.countryCode,
          contactNumber: obj.contactNumber,
          message: obj.message,
          respondedMessage: obj.respondedMessage,
          active: obj.active != null ? obj.active : find.active,
          respondedBy: adminId,
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

      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async sendResponse(id: number, obj: SendResponseDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.contactUsRepository.findOne({
        where: {
          contactFormId: id,
        },
      });
      if (find) {
        const updateObj = {
          respondedMessage: obj.respondedMessage,
          respondedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_UPDATE_RESPONSE,
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
      const find = await this.contactUsRepository.findOne({
        where: {
          contactFormId: id,
        },
      });
      if (find) {
        const updateObj = {
          active: obj.active,
          respondedBy: adminId,
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

  public async sendEmail(id: number, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.contactUsRepository.findOne({
        where: {
          contactFormId: id,
        },
      });

      const emailParams: IEmailParams = {
        emailType: EmailTypeEnum.INQUIRY,
        toUserInfo: { name: find.name, emailId: find.emailId } as IBaseUser,
        message: find.message,
        response: find.respondedMessage,
      };

      this.emailService.sendEmail(emailParams);

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

  private async createInDB(obj: any) {
    return await this.contactUsRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.contactUsRepository
      .update(obj, { where: { contactFormId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
