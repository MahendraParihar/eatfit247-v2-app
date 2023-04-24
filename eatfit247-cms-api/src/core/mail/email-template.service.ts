import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EmailTypeEnum } from 'src/enums/email-type-enum';
import { MstEmailTemplate } from '../database/models/mst-email-template.model';

@Injectable()
export class EmailTemplateService {
  constructor(@InjectModel(MstEmailTemplate) private readonly emailTemplateRepository: typeof MstEmailTemplate) {}

  async getEmailTemplate(emailType: EmailTypeEnum): Promise<MstEmailTemplate> {
    const template = await this.emailTemplateRepository.findOne({
      where: { emailTemplateId: emailType },
      raw: true,
    });

    return template;
  }
}
