import { Injectable, Logger } from '@nestjs/common';
import { EmailNotificationService } from '@server_1/platform';
import { EmailTemplateEnum } from '@eatfit247-shared-lib';
import { SendNotificationDto } from '../dto/send-notification.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  /**
   * Send an email notification
   * @param dto - Notification data
   * @returns Success status
   */
  async sendEmail(dto: SendNotificationDto): Promise<{ messageId: string; success: boolean }> {
    try {
      this.logger.log(`Sending email to ${dto.recipient}`);

      // Map template name to EmailTemplateEnum
      const emailTemplate: EmailTemplateEnum =
        dto.templateName && dto.templateName in EmailTemplateEnum
          ? EmailTemplateEnum[dto.templateName as keyof typeof EmailTemplateEnum]
          : EmailTemplateEnum.MEMBER_WELCOME;

      await this.emailNotificationService.sendEmail({
        to: dto.recipient,
        emailTemplate,
        subject: dto.subject,
        body: dto.message,
        replacements: dto.templateParams as Record<string, string | number>,
        attachments: dto.metadata?.['attachments'],
        franchiseBranding: dto.metadata?.['franchiseBranding'] || {
          logoUrl: '',
          brandName: 'EatFit247',
        },
      });

      // Generate a message ID (email service doesn't return one, so we create one)
      const messageId = `email_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      this.logger.log(`Email sent successfully. Message ID: ${messageId}`);
      return { messageId, success: true };
    } catch (error: any) {
      this.logger.error(`Error sending email: ${error.message}`, error.stack);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

