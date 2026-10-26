import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  ICalculateTaxResponse,
  ITableList,
  IWorkshopInvoice,
  IWorkshopInvoiceMasterData,
} from '@eatfit247-shared-lib';
import { AbilitiesGuard, CurrentUser, JwtAuthGuard, RequestedIp, RequireAbility } from '@server_1/core';
import { IFileModel } from '@server_1/platform';
import { WorkshopInvoiceService } from '../../services';
import {
  CancelWorkshopInvoiceDto,
  ManageWorkshopInvoiceDto,
  WorkshopInvoiceSearchDto,
  WorkshopInvoiceTaxDto,
} from '../../dto';

/**
 * Workshop invoices (admin-api only). The guard checks the subject; the service then checks
 * the row's franchise (scoping + CASL with franchiseId).
 */
@Controller('workshop-invoice')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class WorkshopInvoiceController {
  constructor(private readonly workshopInvoiceService: WorkshopInvoiceService) {}

  @Get('master-data')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.WorkshopInvoice)
  async masterData(@CurrentUser() user: IAuthUser): Promise<IWorkshopInvoiceMasterData> {
    return this.workshopInvoiceService.loadMasterData(user);
  }

  @Get()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.WorkshopInvoice)
  async list(
    @Query() query: WorkshopInvoiceSearchDto,
    @CurrentUser() user: IAuthUser,
  ): Promise<ITableList<IWorkshopInvoice>> {
    return this.workshopInvoiceService.findAll(query, user);
  }

  @Post('calculate-tax')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.WorkshopInvoice)
  async calculateTax(
    @Body() body: WorkshopInvoiceTaxDto,
    @CurrentUser() user: IAuthUser,
  ): Promise<ICalculateTaxResponse> {
    return this.workshopInvoiceService.calculateTax(body, user);
  }

  @Get(':id/invoice')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.WorkshopInvoice)
  async downloadInvoice(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IAuthUser,
  ): Promise<IFileModel> {
    return this.workshopInvoiceService.generateInvoicePdf(id, user);
  }

  @Get(':id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.WorkshopInvoice)
  async getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: IAuthUser): Promise<IWorkshopInvoice> {
    return this.workshopInvoiceService.findById(id, user);
  }

  @Post()
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.WorkshopInvoice)
  async create(
    @Body() body: ManageWorkshopInvoiceDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<IWorkshopInvoice> {
    return this.workshopInvoiceService.create(body, user, ip);
  }

  @Put(':id/cancel')
  @RequireAbility(AdminActionEnum.Delete, AdminSubjectEnum.WorkshopInvoice)
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CancelWorkshopInvoiceDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<IWorkshopInvoice> {
    return this.workshopInvoiceService.cancel(id, body.cancelReason, user, ip);
  }

  @Put(':id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.WorkshopInvoice)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ManageWorkshopInvoiceDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<IWorkshopInvoice> {
    return this.workshopInvoiceService.update(id, body, user, ip);
  }
}
