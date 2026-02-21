import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { NotificationChannel } from '@eatfit247-shared-lib';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { LogService } from './log.service';
import { TemplateService } from './template.service';
import { EmailProvider } from './providers/email.provider';
import { WhatsAppProvider } from './providers/whatsapp.provider';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly logService: LogService,
    private readonly templateService: TemplateService,
    private readonly emailProvider: EmailProvider,
    private readonly whatsappProvider: WhatsAppProvider,
  ) {}

  /**
   * Send notification
   * @param dto - Notification DTO
   * @returns Result with message ID and success status
   */
  async send(dto: SendNotificationDto): Promise<{ messageId: string; success: boolean }> {
    let logId: number | null = null;

    try {
      // Validate idempotency key if provided
      if (dto.idempotencyKey) {
        const exists = await this.logService.exists(dto.idempotencyKey);
        if (exists) {
          this.logger.warn(`Idempotency key already exists: ${dto.idempotencyKey}`);
          throw new BadRequestException(`Notification with idempotency key ${dto.idempotencyKey} already exists`);
        }
      }

      // Prepare notification content
      const content = this.templateService.prepareNotificationContent(dto);
      dto.message = content.message;
      dto.subject = content.subject;

      // Create PENDING log entry
      const log = await this.logService.createPending(dto);
      logId = log.id;

      // Send notification based on channel
      let results: Array<{ messageId: string; provider: string; rawResponse: any }> = [];

      if (dto.channel === NotificationChannel.EMAIL) {
        const result = await this.emailProvider.send(dto);
        results.push({
          messageId: result.messageId,
          provider: 'email',
          rawResponse: result.rawResponse,
        });
      } else if (dto.channel === NotificationChannel.WHATSAPP) {
        const result = await this.whatsappProvider.send(dto);
        results.push({
          messageId: result.messageId,
          provider: 'whatsapp',
          rawResponse: result.rawResponse,
        });
      } else if (dto.channel === NotificationChannel.BOTH) {
        // Send to both channels using Promise.all
        const [emailResult, whatsappResult] = await Promise.all([
          this.emailProvider.send(dto).catch((error) => {
            this.logger.error(`Email send failed: ${error.message}`);
            return { messageId: '', rawResponse: { error: error.message } };
          }),
          this.whatsappProvider.send(dto).catch((error) => {
            this.logger.error(`WhatsApp send failed: ${error.message}`);
            return { messageId: '', rawResponse: { error: error.message } };
          }),
        ]);

        if (emailResult.messageId) {
          results.push({
            messageId: emailResult.messageId,
            provider: 'email',
            rawResponse: emailResult.rawResponse,
          });
        }

        if (whatsappResult.messageId) {
          results.push({
            messageId: whatsappResult.messageId,
            provider: 'whatsapp',
            rawResponse: whatsappResult.rawResponse,
          });
        }
      } else {
        throw new BadRequestException(`Unsupported notification channel: ${dto.channel}`);
      }

      // Update log with success
      if (results.length > 0) {
        // For BOTH channel, we'll use the first successful result
        const firstResult = results[0];
        await this.logService.markSent(
          logId,
          firstResult.messageId,
          firstResult.provider,
          firstResult.rawResponse,
        );

        // If BOTH channel and we have multiple results, we might want to create additional log entries
        // For now, we'll just log the first one as the primary
        if (results.length > 1) {
          this.logger.log(`Multiple providers used. Primary: ${firstResult.provider}, Secondary: ${results[1].provider}`);
        }

        this.logger.log(`Notification sent successfully via ${dto.channel}. Message ID: ${firstResult.messageId}`);
        return {
          messageId: firstResult.messageId,
          success: true,
        };
      } else {
        throw new Error('All notification providers failed');
      }
    } catch (error: any) {
      this.logger.error(`Error sending notification: ${error.message}`, error.stack);

      // Update log with failure
      if (logId) {
        await this.logService.markFailed(logId, error.message);
      }

      throw error;
    }
  }

  /**
   * Retry failed notification
   * @param id - Log ID
   * @returns Result with message ID and success status
   */
  async retry(id: number): Promise<{ messageId: string; success: boolean }> {
    try {
      const log = await this.logService.findById(id);
      if (!log) {
        throw new BadRequestException(`Notification log with ID ${id} not found`);
      }

      if (log.status === 'sent') {
        throw new BadRequestException(`Notification ${id} is already sent`);
      }

      // Reconstruct DTO from log
      const dto: SendNotificationDto = {
        channel: log.channel as NotificationChannel,
        recipient: (log.payload as any)?.recipient || '',
        type: log.type as any,
        subject: (log.payload as any)?.subject,
        message: (log.payload as any)?.message,
        templateName: (log.payload as any)?.templateName,
        templateParams: (log.payload as any)?.templateParams,
        memberId: log.memberId || undefined,
        idempotencyKey: log.idempotencyKey || undefined,
        metadata: (log.payload as any)?.metadata,
      };

      // Send again
      return await this.send(dto);
    } catch (error: any) {
      this.logger.error(`Error retrying notification: ${error.message}`, error.stack);
      throw error;
    }
  }
}
