import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AbilitiesGuard, CurrentUser, JwtAuthGuard, RequireAbility } from '@server_1/core';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, IDocumentsIssuedReport } from '@eatfit247-shared-lib';
import { DocumentsIssuedService } from '../../services';
import { DocumentsIssuedQueryDto } from '../../dto';

/** GSTR-1 Table 13 "Documents issued" (compliant invoice numbering, decision 13). */
@Controller('reports/documents-issued')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class DocumentsIssuedController {
  constructor(private readonly documentsIssuedService: DocumentsIssuedService) {}

  @Get()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async report(@Query() query: DocumentsIssuedQueryDto, @CurrentUser() user: IAuthUser): Promise<IDocumentsIssuedReport> {
    return await this.documentsIssuedService.report(user, query.franchiseId, query.from, query.to);
  }

  @Get('csv')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async csv(@Query() query: DocumentsIssuedQueryDto, @CurrentUser() user: IAuthUser, @Res() res: Response): Promise<void> {
    const report = await this.documentsIssuedService.report(user, query.franchiseId, query.from, query.to);
    const filename = `documents-issued_${report.franchiseCode}_${query.from.replace(/-/g, '')}_to_${query.to.replace(/-/g, '')}.csv`;
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    // BOM so Excel opens the UTF-8 file correctly
    res.send(`﻿${DocumentsIssuedService.toCsv(report)}`);
  }
}
