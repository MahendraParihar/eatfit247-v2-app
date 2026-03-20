import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../services/notification.service';
import { NotificationChannel, NotificationType } from '@eatfit247-shared-lib';
import { EmailNotificationService } from '@server_1/platform';

export interface DietPlanGeneratedPayload {
  memberId: number;
  memberName: string;
  emailId: string;
  phoneNumber: string;
  dietPlanId: number;
  cycleNo: number;
  dayNo?: number;
  dietPdfPath?: string;
  dietPdfFileName?: string;
}

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  /**
   * Listen to diet.plan.generated event.
   * WhatsApp template text is read from DB (mst_email_templates.whatspp_template_file).
   * Email is sent via EmailNotificationService using the EJS template.
   */
  @OnEvent('diet.plan.generated')
  async handleDietPlanGenerated(payload: DietPlanGeneratedPayload): Promise<void> {
    this.logger.log(`Received diet.plan.generated event for member ${payload.memberId}`);

    try {
      const timestamp = Date.now();
      const dayInfo = payload.dayNo ? ` - Day ${payload.dayNo}` : '';
      const templateVars: Record<string, string | number> = {
        memberName: payload.memberName,
        cycleNo: payload.cycleNo,
        ...(payload.dayNo ? { dayNo: payload.dayNo } : {}),
      };

      // ── WhatsApp ──────────────────────────────────────────────────────────
      if (payload.phoneNumber) {
        const waMessage = await this.emailNotificationService.getWhatsAppMessageText(
          'member_diet_plan',
          templateVars,
        );
        if (waMessage) {
          await this.notificationService.send({
            type: NotificationType.DIET_PLAN,
            channel: NotificationChannel.WHATSAPP,
            recipient: payload.phoneNumber,
            message: waMessage,
            idempotencyKey: `diet-wa-${payload.memberId}-${payload.dietPlanId}-${payload.cycleNo}-${timestamp}`,
            memberId: payload.memberId,
            metadata: { event: 'diet.plan.generated', cycleNo: payload.cycleNo, dayNo: payload.dayNo },
          });
          this.logger.log(`WhatsApp diet plan notification sent for member ${payload.memberId}`);
        }
      }

      // ── Email ─────────────────────────────────────────────────────────────
      if (payload.emailId) {
        await this.emailNotificationService.sendEmailByType({
          to: payload.emailId,
          type: 'member_diet_plan',
          subject: `Your Diet Plan - Cycle ${payload.cycleNo}${dayInfo} is Ready`,
          data: templateVars,
        });
        this.logger.log(`Email diet plan notification sent for member ${payload.memberId}`);
      }
    } catch (error: any) {
      this.logger.error(`Error handling diet.plan.generated event: ${error.message}`, error.stack);
      // Don't throw — we don't want to break the event flow
    }
  }
}

