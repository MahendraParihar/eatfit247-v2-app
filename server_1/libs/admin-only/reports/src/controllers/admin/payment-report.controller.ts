import { Controller, Get, Query, UseGuards, Res, Header } from '@nestjs/common';
import { JwtAuthGuard } from '@server_1/core';
import { PaymentReportService } from '../../services/payment-report.service';
import { PaymentReportDto } from '../../dto/payment-report.dto';
import { ITableList } from '@eatfit247-shared-lib';
import { Response } from 'express';
import { StreamableFile } from '@nestjs/common';

@Controller('reports/payment')
@UseGuards(JwtAuthGuard)
export class PaymentReportController {
  constructor(private readonly paymentReportService: PaymentReportService) {}

  @Get()
  async getPaymentReport(@Query() dto: PaymentReportDto): Promise<ITableList<any>> {
    return await this.paymentReportService.getPaymentReport(dto);
  }

  @Get('export')
  async exportPaymentReports(
    @Query() dto: PaymentReportDto,
    @Res() res: Response,
  ): Promise<void> {
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
}

