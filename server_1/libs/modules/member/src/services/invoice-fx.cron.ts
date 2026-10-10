import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FranchiseDateUtil } from '@server_1/platform';
import { ExchangeRateService } from '@server_1/modules/tax-engine';
import { InvoiceIssueService } from './invoice-issue.service';

/**
 * Daily exchange rates (roadmap 4.6, group 9): fetches FBIL's reference rates (published 13:00 IST
 * on business days) for the last ten days, then fills invoices issued while their rate was missing.
 * Failures are logged and never touch payment flows. Runs where ScheduleModule is loaded (admin-api).
 */
@Injectable()
export class InvoiceFxCron {
  private readonly logger = new Logger(InvoiceFxCron.name);

  constructor(
    private readonly exchangeRateService: ExchangeRateService,
    private readonly invoiceIssueService: InvoiceIssueService,
  ) {}

  @Cron('15 14,20 * * *', { timeZone: 'Asia/Kolkata' })
  public async refresh(): Promise<void> {
    const today = FranchiseDateUtil.localDate(new Date(), 'Asia/Kolkata');
    const from = new Date(`${today}T00:00:00Z`);
    from.setUTCDate(from.getUTCDate() - 10);
    try {
      const saved = await this.exchangeRateService.fetchFbil(from.toISOString().slice(0, 10), today);
      this.logger.log(`FBIL reference rates saved: ${saved}`);
    } catch (error) {
      this.logger.error('FBIL fetch failed; rates can be entered by Finance', error as Error);
    }
    try {
      const filled = await this.invoiceIssueService.backfillPendingFx();
      if (filled > 0) {
        this.logger.log(`Filled FX on ${filled} invoice(s)`);
      }
    } catch (error) {
      this.logger.error('FX backfill failed', error as Error);
    }
  }
}
