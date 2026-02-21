import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { NotificationLogModel } from '../models/notification-log.model';
import { SendNotificationDto } from '../dto/send-notification.dto';

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(
    @InjectModel(NotificationLogModel)
    private readonly notificationLogRepository: typeof NotificationLogModel,
  ) {}

  /**
   * Create a PENDING log entry
   * @param dto - Notification DTO
   * @returns Created log entry
   */
  async createPending(dto: SendNotificationDto): Promise<NotificationLogModel> {
    try {
      const log = await this.notificationLogRepository.create({
        memberId: dto.memberId || null,
        type: dto.type || null,
        channel: dto.channel,
        status: 'pending',
        provider: null,
        providerMessageId: null,
        attempts: 0,
        idempotencyKey: dto.idempotencyKey || null,
        error: null,
        payload: {
          recipient: dto.recipient,
          subject: dto.subject,
          message: dto.message,
          templateName: dto.templateName,
          templateParams: dto.templateParams,
          metadata: dto.metadata,
        },
        response: null,
      });

      this.logger.log(`Notification log created: ${log.id} - PENDING`);
      return log;
    } catch (error: any) {
      this.logger.error(`Error creating notification log: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark notification as SENT
   * @param id - Log ID
   * @param providerMessageId - Message ID from provider
   * @param provider - Provider name (email, whatsapp)
   * @param rawResponse - Raw response from provider
   */
  async markSent(
    id: number,
    providerMessageId: string,
    provider: string,
    rawResponse?: any,
  ): Promise<void> {
    try {
      const log = await this.notificationLogRepository.findByPk(id);
      if (!log) {
        throw new Error(`Notification log with ID ${id} not found`);
      }

      await this.notificationLogRepository.update(
        {
          status: 'sent',
          provider,
          providerMessageId,
          response: rawResponse || null,
        },
        {
          where: { id },
        },
      );

      this.logger.log(`Notification log updated: ${id} - SENT (${provider})`);
    } catch (error: any) {
      this.logger.error(`Error marking notification as sent: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark notification as FAILED
   * @param id - Log ID
   * @param error - Error message
   */
  async markFailed(id: number, error: string): Promise<void> {
    try {
      const log = await this.notificationLogRepository.findByPk(id);
      if (!log) {
        throw new Error(`Notification log with ID ${id} not found`);
      }

      await this.notificationLogRepository.update(
        {
          status: 'failed',
          error,
          attempts: (log.attempts || 0) + 1,
        },
        {
          where: { id },
        },
      );

      this.logger.log(`Notification log updated: ${id} - FAILED (attempts: ${(log.attempts || 0) + 1})`);
    } catch (error: any) {
      this.logger.error(`Error marking notification as failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update status by provider message ID
   * @param messageId - Provider message ID
   * @param status - New status (delivered, read, failed)
   */
  async updateStatusByMessageId(messageId: string, status: string): Promise<void> {
    try {
      await this.notificationLogRepository.update(
        {
          status,
        },
        {
          where: { providerMessageId: messageId },
        },
      );

      this.logger.log(`Notification status updated by message ID: ${messageId} - ${status}`);
    } catch (error: any) {
      this.logger.error(`Error updating status by message ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find log by ID
   * @param id - Log ID
   * @returns Log entry or null
   */
  async findById(id: number): Promise<NotificationLogModel | null> {
    try {
      return await this.notificationLogRepository.findByPk(id);
    } catch (error: any) {
      this.logger.error(`Error finding notification log: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if idempotency key exists
   * @param idempotencyKey - Idempotency key
   * @returns True if exists
   */
  async exists(idempotencyKey: string): Promise<boolean> {
    try {
      const count = await this.notificationLogRepository.count({
        where: { idempotencyKey },
      });
      return count > 0;
    } catch (error: any) {
      this.logger.error(`Error checking idempotency key: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find logs by member ID
   * @param memberId - Member ID
   * @returns Array of log entries
   */
  async findByMember(memberId: number): Promise<NotificationLogModel[]> {
    try {
      return await this.notificationLogRepository.findAll({
        where: { memberId },
        order: [['createdAt', 'DESC']],
      });
    } catch (error: any) {
      this.logger.error(`Error finding notification logs by member: ${error.message}`, error.stack);
      throw error;
    }
  }
}
