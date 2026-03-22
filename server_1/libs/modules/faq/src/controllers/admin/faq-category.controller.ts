import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  BasicSearchDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateActiveDto,
} from '@server_1/core';
import { FaqCategoryService } from '../../services';
import { CreateFaqCategoryDto } from '../../dto';
import { AdminActionEnum, AdminSubjectEnum, IFaqCategory, ITableList } from '@eatfit247-shared-lib';

@Controller('faq-category')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class FaqCategoryController {
  constructor(private readonly service: FaqCategoryService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Faq)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IFaqCategory>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Faq)
  async getById(@Param('id') id: number): Promise<IFaqCategory> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Faq)
  async create(
    @Body() body: CreateFaqCategoryDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.create(body, ip, user.adminUserId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Faq)
  async update(
    @Param('id') id: number,
    @Body() body: CreateFaqCategoryDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.update(id, body, ip, user.adminUserId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Faq)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body, ip, user.adminUserId);
  }
}

