import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, QueryTypes } from 'sequelize';
import { Cron } from '@nestjs/schedule';
import { IFranchiseTurnover, TurnoverAlertLevel } from '@eatfit247-shared-lib';
import { MstFranchise } from '@server_1/core';
import { EmailNotificationService } from '@server_1/platform';
import { FranchiseTurnoverService } from './franchise-turnover.service';

export const TURNOVER_ALERT_TEMPLATE = 'admin_franchise_turnover_alert';

/**
 * Daily registration-threshold check (compliant invoice numbering, decision 12): for every active
 * franchise with a threshold and no GSTIN, emails super admins once per FY per level crossed
 * (amber, then red). The last level sent is stored on the franchise (`turnover_alert_fy` /
 * `turnover_alert_level`); a new FY starts again from none. Checkout is never blocked.
 * ScheduleModule runs in both APIs and PM2 runs several instances, so an advisory lock lets one
 * process do each run (same as InvoiceFxCron).
 */
@Injectable()
export class FranchiseTurnoverCron {
  private readonly logger = new Logger(FranchiseTurnoverCron.name);

  constructor(
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
    private readonly turnoverService: FranchiseTurnoverService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly sequelize: Sequelize,
  ) {}

  @Cron('30 9 * * *', { timeZone: 'Asia/Kolkata' })
  public async refresh(): Promise<void> {
    // The transaction pins one connection that holds the lock until the run ends
    const lockTransaction = await this.sequelize.transaction();
    try {
      const [row] = await this.sequelize.query<{ locked: boolean }>(
        "SELECT pg_try_advisory_xact_lock(hashtext('franchise-turnover-cron')) AS locked",
        { type: QueryTypes.SELECT, transaction: lockTransaction },
      );
      if (!row?.locked) {
        return;
      }
      await this.run();
    } catch (error) {
      this.logger.error('Turnover check failed', error as Error);
    } finally {
      await lockTransaction.commit().catch(() => undefined);
    }
  }

  /** One pass over the franchises; returns how many alert emails were sent. */
  public async run(asOf: Date = new Date()): Promise<number> {
    const franchises = await this.franchiseRepository.findAll({
      where: { active: true, registrationThresholdAmount: { [Op.gt]: 0 } },
    });
    let sent = 0;
    for (const franchise of franchises) {
      if ((franchise.gstNumber || '').trim()) {
        continue;
      }
      try {
        const turnover = await this.turnoverService.forFranchise(franchise, asOf);
        const sameFy = franchise.turnoverAlertFy === turnover.financialYear;
        const alreadySent = sameFy ? Number(franchise.turnoverAlertLevel || 0) : TurnoverAlertLevel.NONE;
        if (turnover.level > alreadySent) {
          if (!(await this.sendAlert(franchise, turnover))) {
            // Not stored, so the next run tries again
            continue;
          }
          sent += 1;
          await franchise.update({ turnoverAlertFy: turnover.financialYear, turnoverAlertLevel: turnover.level });
        } else if (!sameFy) {
          // New FY: restart from the current level without an email
          await franchise.update({ turnoverAlertFy: turnover.financialYear, turnoverAlertLevel: turnover.level });
        }
      } catch (error) {
        this.logger.error(`Turnover check failed for franchise ${franchise.franchiseId}`, error as Error);
      }
    }
    return sent;
  }

  private async sendAlert(franchise: MstFranchise, turnover: IFranchiseTurnover): Promise<boolean> {
    const recipients = await this.superAdminEmails();
    if (recipients.length === 0) {
      this.logger.warn(`No super admin email for the turnover alert of franchise ${franchise.franchiseCode}`);
      return false;
    }
    const template = await this.emailNotificationService.getNotificationTemplate(TURNOVER_ALERT_TEMPLATE);
    if (!template) {
      this.logger.warn(`Email template ${TURNOVER_ALERT_TEMPLATE} missing or inactive; turnover alert not sent`);
      return false;
    }
    const inr = (amount: number | null): string =>
      amount === null ? '—' : `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const percent = String(turnover.percent ?? 0);
    const sentOk = await this.emailNotificationService.sendEmailFromTemplate(template, {
      to: recipients,
      subject: template.subject.replace(/\{\{franchiseName\}\}/g, franchise.companyName).replace(/\{\{percent\}\}/g, percent),
      data: {
        franchise: { franchiseName: 'EatFit247' },
        franchiseName: franchise.companyName,
        franchiseCode: franchise.franchiseCode,
        financialYear: turnover.financialYear,
        turnover: inr(turnover.turnover),
        threshold: inr(turnover.threshold),
        percent,
        level: turnover.level === TurnoverAlertLevel.RED ? 'RED' : 'AMBER',
      },
    });
    if (sentOk) {
      this.logger.log(`Turnover alert (${turnover.level}) sent for ${franchise.franchiseCode}: ${percent}% of the threshold`);
    }
    return sentOk;
  }

  /**
   * Active admins holding an active role that is granted every subject (the super-admin role, from
   * data) and assigned to no franchise: a franchise-scoped admin never gets another franchise's figures.
   */
  private async superAdminEmails(): Promise<string[]> {
    const rows = await this.sequelize.query<{ email_id: string }>(
      `SELECT DISTINCT u.email_id
       FROM public.mst_admin_users u
       JOIN public.txn_admin_user_roles ur ON ur.admin_id = u.admin_id AND ur.active = true
       JOIN public.mst_admin_roles r ON r.role_id = ur.role_id AND r.grant_all_on_new_subject = true
       WHERE u.active = true AND COALESCE(u.email_id, '') <> ''
         AND u.franchise_id IS NULL
         AND NOT EXISTS (SELECT 1 FROM public.txn_admin_franchises af WHERE af.admin_id = u.admin_id)
       ORDER BY u.email_id`,
      { type: QueryTypes.SELECT },
    );
    return rows.map((row) => row.email_id);
  }
}
