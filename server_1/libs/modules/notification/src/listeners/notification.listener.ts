import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../services';
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

  @OnEvent('diet.plan.generated')
  async handleDietPlanGenerated(payload: DietPlanGeneratedPayload): Promise<void> {
    this.logger.log(`Received diet.plan.generated event for member ${payload.memberId}`);

    try {
      // ── 1. Fetch template config once (single DB query) ───────────────────
      const template = await this.emailNotificationService.getNotificationTemplate('member_diet_plan');
      if (!template) {
        this.logger.warn('Template member_diet_plan not found or inactive — skipping notifications');
        return;
      }

      this.logger.log(
        `Template config: sendWhatsapp=${template.sendWhatsappNotification}, sendEmail=${template.sendEmailNotification}`,
      );

      const timestamp = Date.now();
      const dayInfo = payload.dayNo ? ` - Day ${payload.dayNo}` : '';
      const templateVars: Record<string, string | number> = {
        memberName: payload.memberName,
        cycleNo: payload.cycleNo,
        ...(payload.dayNo ? { dayNo: payload.dayNo } : {}),
      };

      // ── 2. WhatsApp — only if flag is enabled and phone is available ───────
      if (template.sendWhatsappNotification && payload.phoneNumber) {
        const waMessage = await this.emailNotificationService.renderWhatsAppFromTemplate(
          template,
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
      } else {
        this.logger.log(
          `WhatsApp skipped for member ${payload.memberId}: flag=${template.sendWhatsappNotification}, hasPhone=${!!payload.phoneNumber}`,
        );
      }

      // ── 3. Email — only if flag is enabled and email is available ──────────
      if (template.sendEmailNotification && payload.emailId) {
        await this.emailNotificationService.sendEmailFromTemplate(template, {
          to: payload.emailId,
          subject: `Your Diet Plan - Cycle ${payload.cycleNo}${dayInfo} is Ready`,
          data: templateVars,
        });
        this.logger.log(`Email diet plan notification sent for member ${payload.memberId}`);
      } else {
        this.logger.log(
          `Email skipped for member ${payload.memberId}: flag=${template.sendEmailNotification}, hasEmail=${!!payload.emailId}`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Error handling diet.plan.generated event: ${error.message}`, error.stack);
      // Don't throw — we don't want to break the event flow
    }
  }
}
