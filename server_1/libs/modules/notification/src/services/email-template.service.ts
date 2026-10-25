import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IEmailTemplateSwitch, IUpdateEmailTemplateSwitch } from '@eatfit247-shared-lib';
import { MstEmailTemplate } from '@server_1/platform';

/**
 * The on / off switches of `mst_email_templates` (configurable tax treatment, decision 18): whether a template is
 * active and whether it sends its email and its WhatsApp message. Content is not edited here. Templates are
 * global platform settings (`EmailTemplate`, super admin only); nothing is ever deleted.
 */
@Injectable()
export class EmailTemplateService {
  constructor(@InjectModel(MstEmailTemplate) private readonly emailTemplateRepository: typeof MstEmailTemplate) {}

  public async findAll(): Promise<IEmailTemplateSwitch[]> {
    const rows = await this.emailTemplateRepository.findAll({ order: [['templateName', 'ASC']] });
    return rows.map((row) => EmailTemplateService.toSwitch(row));
  }

  /** Switches one template; only the switches sent change. */
  public async update(emailTemplateId: number, obj: IUpdateEmailTemplateSwitch, adminId: number): Promise<IEmailTemplateSwitch> {
    const row = await this.emailTemplateRepository.findByPk(emailTemplateId);
    if (!row) {
      throw new NotFoundException('Email template not found');
    }
    const changes: Partial<Pick<MstEmailTemplate, 'active' | 'sendEmailNotification' | 'sendWhatsappNotification'>> = {};
    if (obj.active !== undefined) {
      changes.active = obj.active;
    }
    if (obj.sendEmailNotification !== undefined) {
      changes.sendEmailNotification = obj.sendEmailNotification;
    }
    if (obj.sendWhatsappNotification !== undefined) {
      if (obj.sendWhatsappNotification && !(row.whatsppTemplateFile ?? '').trim()) {
        throw new BadRequestException(`${row.templateName} has no WhatsApp message to send.`);
      }
      changes.sendWhatsappNotification = obj.sendWhatsappNotification;
    }
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('Send at least one switch: active, sendEmailNotification or sendWhatsappNotification.');
    }
    await row.update({ ...changes, modifiedBy: adminId });
    return EmailTemplateService.toSwitch(row);
  }

  static toSwitch(row: MstEmailTemplate): IEmailTemplateSwitch {
    return {
      emailTemplateId: row.emailTemplateId,
      templateName: row.templateName,
      subject: row.subject,
      active: !!row.active,
      sendEmailNotification: !!row.sendEmailNotification,
      sendWhatsappNotification: !!row.sendWhatsappNotification,
    };
  }
}
