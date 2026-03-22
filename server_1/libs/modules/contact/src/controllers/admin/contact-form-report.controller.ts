import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequireAbility,
  RequestedIp,
} from '@server_1/core';
import { ContactFormReportService } from '../../services';
import { ContactFormReportDto, SendContactFormResponseDto } from '../../dto';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, ITableList } from '@eatfit247-shared-lib';

@Controller("reports/contact-form")
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class ContactFormReportController {
  constructor(private readonly contactFormReportService: ContactFormReportService) {}

  @Post()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async getContactFormReport(@Body() dto: ContactFormReportDto): Promise<ITableList<any>> {
    return await this.contactFormReportService.getContactFormReport(dto);
  }

  @Get(":id")
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Report)
  async getContactFormDetails(@Param("id") id: number) {
    return await this.contactFormReportService.getContactFormDetails(id);
  }

  @Put(":id/response")
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Report)
  async sendResponse(
    @Param("id") id: number,
    @Body() dto: SendContactFormResponseDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string
  ): Promise<void> {
    await this.contactFormReportService.sendResponse(id, dto, currentUser.adminId, requestedIp);
  }
}

