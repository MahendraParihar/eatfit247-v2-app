import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, RequestedIp } from '@server_1/core';
import { ContactFormReportService } from '../../services/contact-form-report.service';
import { ContactFormReportDto } from '../../dto/contact-form-report.dto';
import { SendContactFormResponseDto } from '../../dto/send-contact-form-response.dto';
import { ITableList, IAuthUser } from '@eatfit247-shared-lib';

@Controller('reports/contact-form')
@UseGuards(JwtAuthGuard)
export class ContactFormReportController {
  constructor(private readonly contactFormReportService: ContactFormReportService) {}

  @Get()
  async getContactFormReport(@Query() dto: ContactFormReportDto): Promise<ITableList<any>> {
    return await this.contactFormReportService.getContactFormReport(dto);
  }

  @Get(':id')
  async getContactFormDetails(@Param('id') id: number) {
    return await this.contactFormReportService.getContactFormDetails(id);
  }

  @Put(':id/response')
  async sendResponse(
    @Param('id') id: number,
    @Body() dto: SendContactFormResponseDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.contactFormReportService.sendResponse(id, dto, currentUser.adminId, requestedIp);
  }
}

