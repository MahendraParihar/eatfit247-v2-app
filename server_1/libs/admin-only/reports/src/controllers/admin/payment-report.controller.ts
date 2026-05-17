import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, JwtAuthGuard, RequireAbility } from '@server_1/core';
import { PaymentReportService } from '../../services';
import { PaymentReportDto } from '../../dto';
import { AdminActionEnum, AdminSubjectEnum, ITableList } from '@eatfit247-shared-lib';
import { Response } from 'express';

@Controller('reports/payment')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class PaymentReportController {
  constructor(private readonly paymentReportService: PaymentReportService) {}

  @Post()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async getPaymentReport(@Body() dto: PaymentReportDto): Promise<ITableList<any>> {
    return await this.paymentReportService.getPaymentReport(dto);
  }

  @Post('export')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async exportPaymentReports(@Body() dto: PaymentReportDto, @Res() res: Response): Promise<void> {
    const archive = await this.paymentReportService.exportPaymentReports(dto);
    // Generate filename with date range
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
  async exportPaymentReportExcel(@Body() dto: PaymentReportDto, @Res() res: Response): Promise<void> {
    const buffer = await this.paymentReportService.exportPaymentReportExcel(dto);
    const startDate = dto.startDate.replace(/-/g, '');
    const endDate = dto.endDate.replace(/-/g, '');
    const filename = `payment-report_${startDate}_to_${endDate}.xlsx`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }
}

