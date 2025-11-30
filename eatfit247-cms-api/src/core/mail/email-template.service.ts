import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EmailTypeEnum } from 'shared-lib';
import { MstEmailTemplate } from '../database/models/mst-email-template.model';

@Injectable()
export class EmailTemplateService {
  constructor(@InjectModel(MstEmailTemplate) private readonly emailTemplateRepository: typeof MstEmailTemplate) {}

  async getEmailTemplate(emailType: EmailTypeEnum): Promise<MstEmailTemplate> {
    return await this.emailTemplateRepository.findOne({
      where: { emailTemplateId: emailType },
      raw: true,
    });
  }
}
