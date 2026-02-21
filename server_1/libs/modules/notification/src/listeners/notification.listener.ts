import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../services/notification.service';
import { NotificationChannel, NotificationType } from '@eatfit247-shared-lib';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Listen to diet.plan.generated event
   * @param payload - Event payload containing memberId and other data
   */
  @OnEvent('diet.plan.generated')
  async handleDietPlanGenerated(payload: { memberId: number; dietPdfUrl?: string; memberName?: string; [key: string]: any }) {
    this.logger.log(`Received diet.plan.generated event for member ${payload.memberId}`);

    try {
      const timestamp = Date.now();
      const idempotencyKey = `diet-${payload.memberId}-${timestamp}`;

      // Send notification via BOTH channels
      await this.notificationService.send({
        type: NotificationType.DIET_PLAN,
        channel: NotificationChannel.BOTH,
        recipient: payload.email || payload.phoneNumber || '', // You may need to fetch member details
        idempotencyKey,
        templateName: 'diet_plan',
        templateParams: {
          memberName: payload.memberName || 'Member',
          dietPdfUrl: payload.dietPdfUrl || '',
          ...payload,
        },
        memberId: payload.memberId,
        metadata: {
          event: 'diet.plan.generated',
          timestamp,
          ...payload,
        },
      });

      this.logger.log(`Diet plan notification sent for member ${payload.memberId}`);
    } catch (error: any) {
      this.logger.error(`Error handling diet.plan.generated event: ${error.message}`, error.stack);
      // Don't throw - we don't want to break the event flow
    }
  }
}

