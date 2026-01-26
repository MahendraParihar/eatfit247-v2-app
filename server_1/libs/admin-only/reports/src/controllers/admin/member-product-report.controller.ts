import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server_1/core';
import { MemberProductReportService } from '../../services';
import { MemberProductReportDto } from '../../dto';
import { ITableList } from '@eatfit247-shared-lib';
import { Response } from 'express';

@Controller('reports/member-product')
@UseGuards(JwtAuthGuard)
export class MemberProductReportController {
  constructor(private readonly memberProductReportService: MemberProductReportService) {}

  @Post()
  async getMemberProductReport(@Body() dto: MemberProductReportDto): Promise<ITableList<any>> {
    return await this.memberProductReportService.getMemberProductReport(dto);
  }

  @Post('export')
  async exportMemberProductReports(@Body() dto: MemberProductReportDto, @Res() res: Response): Promise<void> {
    const archive = await this.memberProductReportService.exportMemberProductReports(dto);
    // Generate filename with date range
    const startDate = dto.startDate.replace(/-/g, '');
    const endDate = dto.endDate.replace(/-/g, '');
    const filename = `member-product-reports_${startDate}_to_${endDate}.zip`;
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    archive.pipe(res);
  }
}

