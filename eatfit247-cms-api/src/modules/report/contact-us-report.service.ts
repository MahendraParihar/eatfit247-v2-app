import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import moment from 'moment';
import { Sequelize } from 'sequelize-typescript';
import { CommonService } from '../common/common.service';
import { TxnContactForm } from '../../core/database/models/txn-contact-form.model';
import { IContactUs } from 'shared-lib';
import { CreateContactUsDto, SendResponseDto } from './dto/contact-us.dto';
import { IEmailParams } from 'src/core/mail/email-params.interface';
import { EmailTypeEnum } from 'shared-lib';
import { IBaseUser } from '../member/interfaces/member.interface';
import { EmailService } from 'src/core/mail/email.service';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class ContactUsReportService {
  constructor(
    @InjectModel(TxnContactForm) private readonly contactUsRepository: typeof TxnContactForm,
    private sequelize: Sequelize,
    private commonService: CommonService,
    private emailService: EmailService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IContactUs>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');

    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

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

    return <ITableList<IContactUs>>{
      data: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IContactUs> {
    const find = await this.contactUsRepository.findOne({
      where: {
        contactFormId: id,
      },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <IContactUs>{
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
  }

  public async create(obj: CreateContactUsDto, cIp: string, adminId: number): Promise<void> {
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
      await this.createInDB(createObj);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async update(id: number, obj: CreateContactUsDto, cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const find = await this.contactUsRepository.findOne({
        where: {
          contactFormId: id,
        },
      });
      if (!find) {
        await t.rollback();
        throw new NotFoundException(StringResource.NO_DATA_FOUND);
      }
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
      await this.updateInDB(id, updateObj);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async sendResponse(id: number, obj: SendResponseDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.contactUsRepository.findOne({
      where: {
        contactFormId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      respondedMessage: obj.respondedMessage,
      respondedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.contactUsRepository.findOne({
      where: {
        contactFormId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      active: obj.active,
      respondedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async sendEmail(id: number, adminId: number): Promise<void> {
    const find = await this.contactUsRepository.findOne({
      where: {
        contactFormId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const emailParams: IEmailParams = {
      emailType: EmailTypeEnum.INQUIRY,
      toUserInfo: { name: find.name, emailId: find.emailId } as IBaseUser,
      message: find.message,
      response: find.respondedMessage,
    };
    await this.emailService.sendEmail(emailParams);
  }

  private async createInDB(obj: any) {
    return await this.contactUsRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.contactUsRepository.update(obj, { where: { contactFormId: id } });
  }
}
