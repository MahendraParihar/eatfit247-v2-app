import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LogService, NotificationService } from '../services';
import { NotificationChannel, NotificationType } from '@eatfit247-shared-lib';
import { EmailNotificationService, FranchiseDateUtil } from '@server_1/platform';

/** `member.created` (configurable tax treatment, decision 18): admin create and public signup. */
export interface MemberCreatedPayload {
  memberId: number;
  memberName: string;
  emailId: string | null;
  /** Dial code and number, e.g. `+91 9820000000` */
  phoneNumber: string | null;
  franchiseName: string;
  /** The franchise's contact email and phone, printed in the welcome message */
  supportEmail: string | null;
  supportPhone: string | null;
}

/** The welcome template and the idempotency keys of its two messages: one welcome per member and channel. */
export const MEMBER_WELCOME_TEMPLATE = 'member_welcome';
export const memberWelcomeKey = (memberId: number, channel: 'email' | 'wa'): string => `member-welcome-${channel}-${memberId}`;
/** A welcome attempt still `pending` after this long is taken as failed (the process died mid-send) */
export const WELCOME_PENDING_STALE_MS = 15 * 60 * 1000;

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
  /** The member's franchise, for the email's header and footer */
  franchiseName?: string | null;
  supportEmail?: string | null;
  /** The franchise's time zone: the plan's date is its day */
  timeZone?: string | null;
}

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly logService: LogService,
  ) {}

  /**
   * The welcome email and WhatsApp message (decision 18). Sent only while `member_welcome` is active (it ships
   * inactive, migration 149) and its channel switch is on. One per member and channel: the notification log's
   * unique idempotency key is claimed before sending, so a repeated event sends nothing.
   */
  @OnEvent('member.created')
  async handleMemberCreated(payload: MemberCreatedPayload): Promise<void> {
    try {
      const template = await this.emailNotificationService.getNotificationTemplate(MEMBER_WELCOME_TEMPLATE);
      if (!template) {
        this.logger.log(`Welcome skipped for member ${payload.memberId}: ${MEMBER_WELCOME_TEMPLATE} is inactive`);
        return;
      }
      const franchiseName = payload.franchiseName || 'EatFit247';
      const variables: Record<string, string> = {
        memberName: payload.memberName,
        franchiseName,
        // The email footer's default when the franchise has no contact email
        supportEmail: payload.supportEmail || 'hello@eatfit247.com',
      };

      if (template.sendWhatsappNotification && payload.phoneNumber) {
        const key = await this.nextWelcomeKey(memberWelcomeKey(payload.memberId, 'wa'));
        if (!key) {
          this.logger.log(`Welcome WhatsApp to member ${payload.memberId} already sent or in progress`);
        } else {
          const message = await this.emailNotificationService.renderWhatsAppFromTemplate(template, variables);
          if (message) {
            await this.notificationService
              .send({
                type: NotificationType.TRANSACTIONAL,
                channel: NotificationChannel.WHATSAPP,
                recipient: payload.phoneNumber,
                message,
                idempotencyKey: key,
                memberId: payload.memberId,
                metadata: { event: 'member.created', template: MEMBER_WELCOME_TEMPLATE },
              })
              .catch((error: Error) => this.logger.error(`Welcome WhatsApp to member ${payload.memberId} failed: ${error.message}`));
          }
        }
      }

      if (template.sendEmailNotification && payload.emailId) {
        const key = await this.nextWelcomeKey(memberWelcomeKey(payload.memberId, 'email'));
        const subject = (template.subject || 'Welcome to {{franchiseName}}!').replace(/\{\{franchiseName\}\}/g, franchiseName);
        if (!key) {
          this.logger.log(`Welcome email to member ${payload.memberId} already sent or in progress`);
          return;
        }
        // Claim first: the unique key stops a concurrent duplicate event from sending a second mail
        const log = await this.logService
          .createPending({
            type: NotificationType.TRANSACTIONAL,
            channel: NotificationChannel.EMAIL,
            recipient: payload.emailId,
            subject,
            templateName: MEMBER_WELCOME_TEMPLATE,
            idempotencyKey: key,
            memberId: payload.memberId,
            metadata: { event: 'member.created' },
          })
          .catch((error: Error) => {
            if (error?.name !== 'SequelizeUniqueConstraintError') {
              throw error;
            }
            return null;
          });
        if (!log) {
          this.logger.log(`Welcome email to member ${payload.memberId} already claimed by a concurrent event`);
          return;
        }
        const sent = await this.emailNotificationService.sendEmailFromTemplate(template, {
          to: payload.emailId,
          subject,
          data: {
            memberName: payload.memberName,
            franchise: { franchiseName, supportEmail: payload.supportEmail ?? undefined, phone: payload.supportPhone ?? undefined },
          },
        });
        if (sent) {
          await this.logService.markSent(log.id, '', 'email');
        } else {
          await this.logService.markFailed(log.id, 'Welcome email not sent (template file missing or the mail server refused it)');
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling member.created for member ${payload.memberId}: ${message}`);
      // Never throw: a welcome message must not break member creation
    }
  }

  /**
   * The key of the next welcome attempt, or null when an earlier attempt was sent or is still in progress (fresh
   * `pending`). A failed or stale attempt leaves room for a new one under `<key>-n`, so a failure is never final.
   */
  private async nextWelcomeKey(baseKey: string): Promise<string | null> {
    const attempts = await this.logService.attempts(baseKey);
    const staleBefore = Date.now() - WELCOME_PENDING_STALE_MS;
    const blocking = attempts.some(
      (attempt) => attempt.status === 'sent' || (attempt.status === 'pending' && new Date(attempt.updatedAt).getTime() > staleBefore),
    );
    if (blocking) {
      return null;
    }
    return attempts.length === 0 ? baseKey : `${baseKey}-${attempts.length + 1}`;
  }

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
        // member/diet-plan.ejs needs the franchise, the plan name and the date (group 8: it failed to render without them)
        await this.emailNotificationService.sendEmailFromTemplate(template, {
          to: payload.emailId,
          subject: `Your Diet Plan - Cycle ${payload.cycleNo}${dayInfo} is Ready`,
          data: {
            ...templateVars,
            franchise: { franchiseName: payload.franchiseName || 'EatFit247', supportEmail: payload.supportEmail || undefined },
            planName: `Cycle ${payload.cycleNo}${dayInfo}`,
            assignedDate: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              timeZone: payload.timeZone || FranchiseDateUtil.DEFAULT_TIME_ZONE,
            }),
          },
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
