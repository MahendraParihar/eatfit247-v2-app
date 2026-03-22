import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, JwtAuthGuard, RequireAbility } from '@server_1/core';
import { MemberProductReportService } from '../../services';
import { MemberProductReportDto, MemberProductBulkExportDto } from '../../dto';
import { AdminActionEnum, AdminSubjectEnum, ITableList } from '@eatfit247-shared-lib';
import { Response } from 'express';

@Controller('reports/member-product')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberProductReportController {
  constructor(private readonly memberProductReportService: MemberProductReportService) {}

  @Post()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async getMemberProductReport(@Body() dto: MemberProductReportDto): Promise<ITableList<any>> {
    return await this.memberProductReportService.getMemberProductReport(dto);
  }

  @Post('export')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async exportMemberProductReports(
    @Body() dto: MemberProductReportDto,
    @Res() res: Response,
  ): Promise<void> {
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

  @Post('export/bulk')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async exportMemberProductReportsBulk(
    @Body() dto: MemberProductBulkExportDto,
    @Res() res: Response,
  ): Promise<void> {
    const archive = await this.memberProductReportService.exportMemberProductReportsBulk(
      dto.memberProductIds,
    );
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `member-product-reports_selected_${timestamp}.zip`;
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    archive.pipe(res);
  }

}
