import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { EmailTypeEnum } from 'src/enums/email-type-enum';
import { MstEmailTemplate } from '../database/models/mst-email-template.model';
import { IAttachment, IEmailParams } from './email-params.interface';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService, private emailTemplateService: EmailTemplateService) {}

  async sendEmail(emailParams: IEmailParams) {
    try {
      let template = await this.emailTemplateService.getEmailTemplate(emailParams.emailType);
      template = this.replaceParameters(emailParams, template);
      const emailId = emailParams.toUserInfo?.emailId;
      const result = await this.mailerService.sendMail({
        to: emailId,
        from: process.env.MAIL_USER,
        subject: template.subject,
        html: template.body,
        attachments: this.getAttachmentList(emailParams.attachments),
      });
    } catch (e) {}
  }

  getAttachmentList(attachmentList: IAttachment[]) {
    let list = null;
    if (attachmentList) {
      list = attachmentList.map((x) => {
        return {
          path: x.path,
          filename: x.name,
          contentDisposition: 'attachment',
        };
      });
    }
    return list;
  }

  replaceParameters(emailParams: IEmailParams, template: MstEmailTemplate) {
    template.body = template.body.replace('REPLACE_NAME', emailParams.toUserInfo?.name);

    switch (emailParams.emailType) {
      case EmailTypeEnum.INQUIRY:
        template.body = template.body
          .replace('REPLACE_MESSAGE', emailParams.message)
          .replace('REPLACE_RESPONSE', emailParams.response);

        break;

      case EmailTypeEnum.PASSWORD_RESET:
        template.body = template.body.replace('REPLACE_MESSAGE', emailParams.message);
        break;
    }
    return template;
  }
}
