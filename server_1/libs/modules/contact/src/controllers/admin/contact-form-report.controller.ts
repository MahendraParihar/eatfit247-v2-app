import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, RequestedIp } from "@server_1/core";
import { ContactFormReportService } from "../../services";
import { ContactFormReportDto, SendContactFormResponseDto } from "../../dto";
import { ITableList, IAuthUser } from "@eatfit247-shared-lib";

@Controller("reports/contact-form")
@UseGuards(JwtAuthGuard)
export class ContactFormReportController {
  constructor(private readonly contactFormReportService: ContactFormReportService) {}

  @Post()
  async getContactFormReport(@Body() dto: ContactFormReportDto): Promise<ITableList<any>> {
    return await this.contactFormReportService.getContactFormReport(dto);
  }

  @Get(":id")
  async getContactFormDetails(@Param("id") id: number) {
    return await this.contactFormReportService.getContactFormDetails(id);
  }

  @Put(":id/response")
  async sendResponse(
    @Param("id") id: number,
    @Body() dto: SendContactFormResponseDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string
  ): Promise<void> {
    await this.contactFormReportService.sendResponse(id, dto, currentUser.adminId, requestedIp);
  }
}

