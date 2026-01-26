import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BasicSearchDto, CurrentUser, JwtAuthGuard, RequestedIp, UpdateActiveDto } from '@server_1/core';
import { DietTemplateService } from '../../services';
import { CreateDietTemplateDto, DietTemplateDetailDto } from '../../dto';
import { IDietTemplate, ITableList } from '@eatfit247-shared-lib';

@Controller('diet-template')
@UseGuards(JwtAuthGuard)
export class DietTemplateController {
  constructor(private readonly service: DietTemplateService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IDietTemplate>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IDietTemplate> {
    return await this.service.fetchById(id);
  }

  @Get('manage/:dietTemplateId/:cycleNo')
  async getDietTemplateDetail(
    @Param('dietTemplateId') dietTemplateId: number,
    @Param('cycleNo') cycleNo: number,
    @Query('copyFromCycleNo') copyFromCycleNo: number,
    @Query('copyFromDayNo') copyFromDayNo: number,
  ) {
    return await this.service.fetchDietTemplateDetail(
      dietTemplateId,
      cycleNo,
      null,
      copyFromCycleNo,
      copyFromDayNo,
    );
  }

  @Get('manage/:dietTemplateId/:cycleNo/:dayNo')
  async getDietTemplateDetailDay(
    @Param('dietTemplateId') dietTemplateId: number,
    @Param('cycleNo') cycleNo: number,
    @Param('dayNo') dayNo: number,
    @Query('copyFromCycleNo') copyFromCycleNo: number,
    @Query('copyFromDayNo') copyFromDayNo: number,
  ) {
    return await this.service.fetchDietTemplateDetail(
      dietTemplateId,
      cycleNo,
      dayNo,
      copyFromCycleNo,
      copyFromDayNo,
    );
  }

  @Post('manage')
  async create(
    @Body() body: CreateDietTemplateDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateDietTemplateDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Post('manage-detail/:dietTemplateId')
  async createDetail(
    @Param('dietTemplateId') dietTemplateId: number,
    @Body() body: DietTemplateDetailDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.createDietTemplateDetail(dietTemplateId, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }
}
