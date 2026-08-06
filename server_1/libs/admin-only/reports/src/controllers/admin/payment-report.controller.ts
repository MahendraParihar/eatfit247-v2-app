import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, CurrentUser, JwtAuthGuard, RequireAbility } from '@server_1/core';
import { PaymentReportService } from '../../services';
import { PaymentReportDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IPaymentReportContext,
  IPaymentReportResult,
} from '@eatfit247-shared-lib';
import { Response } from 'express';

@Controller('reports/payment')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class PaymentReportController {
  constructor(private readonly paymentReportService: PaymentReportService) {}

  /**
   * Filter-bar bootstrap: FY calendar, accessible franchises and countries.
   *
   * Served under the Report ability rather than reusing the annual dashboard's
   * context endpoint, which requires the Dashboard ability an accountant role
   * would not normally hold.
   */
  @Get('context')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async getContext(
    @CurrentUser() user: IAuthUser,
    @Query('franchiseId') franchiseIdRaw?: string,
  ): Promise<IPaymentReportContext> {
    return await this.paymentReportService.getContext(user, this.parseOptionalInt(franchiseIdRaw));
  }

  @Post()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async getPaymentReport(
    @Body() dto: PaymentReportDto,
    @CurrentUser() user: IAuthUser,
  ): Promise<IPaymentReportResult> {
    return await this.paymentReportService.getPaymentReport(dto, user);
  }

  @Post('export')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async exportPaymentReports(
    @Body() dto: PaymentReportDto,
    @CurrentUser() user: IAuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const archive = await this.paymentReportService.exportPaymentReports(dto, user);
    const startDate = dto.startDate.replace(/-/g, '');
    const endDate = dto.endDate.replace(/-/g, '');
    const filename = `payment-reports_${startDate}_to_${endDate}.zip`;
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    archive.pipe(res);
  }

  @Post('export-excel')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async exportPaymentReportExcel(
    @Body() dto: PaymentReportDto,
    @CurrentUser() user: IAuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.paymentReportService.exportPaymentReportExcel(dto, user);
    const startDate = dto.startDate.replace(/-/g, '');
    const endDate = dto.endDate.replace(/-/g, '');
    const filename = `payment-report_${startDate}_to_${endDate}.xlsx`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }

  private parseOptionalInt(raw?: string): number | undefined {
    if (raw === undefined || raw === null || raw === '') {
      return undefined;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
}
