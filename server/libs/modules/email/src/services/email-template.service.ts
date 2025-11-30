import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstEmailTemplate } from '../models';
import { ITableList, IBasicSearch, IEmailTemplate, IManageEmailTemplate, ISendEmailParams } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil } from '@server/common';
import { Op } from 'sequelize';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailTemplateService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(MstEmailTemplate) private readonly emailTemplateRepository: typeof MstEmailTemplate,
  ) {
    // Initialize email transporter
    const mailHost = process.env.MAIL_HOST;
    const mailPort = process.env.MAIL_PORT;
    const mailUser = process.env.MAIL_USER;
    const mailPassword = process.env.MAIL_PASSWORD;
    const enableMail = process.env.ENABLE_MAIL || 'true';

    if (enableMail === 'false' || !mailHost || !mailUser || !mailPassword) {
      console.log('Mail service disabled or incomplete configuration. Using dummy transport.');
      this.transporter = nodemailer.createTransport({
        jsonTransport: true, // Use dummy transport for testing
      });
    } else {
      this.transporter = nodemailer.createTransport({
        pool: true,
        host: mailHost,
        secure: false,
        port: parseInt(mailPort) || 587,
        auth: {
          user: mailUser,
          pass: mailPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
        ignoreTLS: false,
        requireTLS: true,
      });
    }
  }

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IEmailTemplate>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'templateName');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.emailTemplateRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['templateName', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IEmailTemplate[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { data: resList, count: count };
  }

  private convertToModel(item: any): IEmailTemplate {
    return <IEmailTemplate>{
      emailTemplateId: item.emailTemplateId,
      id: item.emailTemplateId,
      templateName: item.templateName,
      subject: item.subject,
      body: item.body,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IEmailTemplate> {
    const find = await this.emailTemplateRepository.scope('details').findOne({
      where: { emailTemplateId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Email template not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageEmailTemplate, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      templateName: obj.templateName,
      subject: obj.subject,
      body: obj.body,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
    };
    await this.emailTemplateRepository.create(createObj);
  }

  public async update(id: number, obj: IManageEmailTemplate, cIp: string, adminId: number): Promise<void> {
    const find = await this.emailTemplateRepository.findOne({ where: { emailTemplateId: id } });
    if (!find) {
      throw new NotFoundException('Email template not found');
    }
    const updateObj = {
      templateName: obj.templateName,
      subject: obj.subject,
      body: obj.body,
      active: obj.active,
      modifiedBy: adminId,
    };
    await this.emailTemplateRepository.update(updateObj, { where: { emailTemplateId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.emailTemplateRepository.findOne({ where: { emailTemplateId: id } });
    if (!find) {
      throw new NotFoundException('Email template not found');
    }
    await this.emailTemplateRepository.update({ active, modifiedBy: adminId }, { where: { emailTemplateId: id } });
  }

  public async sendEmail(params: ISendEmailParams): Promise<void> {
    try {
      // Get email template
      const template = await this.emailTemplateRepository.findOne({
        where: { emailTemplateId: params.emailTemplateId, active: true },
      });

      if (!template) {
        throw new NotFoundException('Email template not found or inactive');
      }

      // Use provided subject/body or template defaults
      let subject = params.subject || template.subject;
      let body = params.body || template.body;

      // Replace template variables if replacements provided
      if (params.replacements) {
        Object.keys(params.replacements).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, params.replacements[key]);
          body = body.replace(regex, params.replacements[key]);
        });
      }

      // Prepare recipients
      const recipients = Array.isArray(params.to) ? params.to : [params.to];

      // Prepare attachments
      const attachments = params.attachments?.map(att => ({
        filename: att.filename,
        path: att.path,
        content: att.content,
        contentType: att.contentType,
      })) || [];

      // Send email
      const mailOptions = {
        from: process.env.MAIL_USER || 'noreply@eatfit247.com',
        to: recipients.join(', '),
        subject: subject,
        html: body,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${recipients.join(', ')}. MessageId: ${result.messageId}`);
    } catch (error) {
      console.error('Error sending email:', error.message);
      throw new BadRequestException(`Failed to send email: ${error.message}`);
    }
  }
}

