import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CsvFilePathDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateActiveDto,
} from '@server_1/core';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, ISeoPageData } from '@eatfit247-shared-lib';
import { SeoPageService } from '@server_1/platform';
import { CreateSeoPageDto, UpdateSeoPageDto } from '../../dto';

@Controller('seo-page')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class SeoPageAdminController {
  constructor(private readonly service: SeoPageService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.SeoPage)
  async list(): Promise<ISeoPageData[]> {
    return await this.service.findAll();
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.SeoPage)
  async getById(@Param('id') id: number): Promise<ISeoPageData> {
    return await this.service.findById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.SeoPage)
  async create(
    @Body() body: CreateSeoPageDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<ISeoPageData> {
    return await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.SeoPage)
  async update(
    @Param('id') id: number,
    @Body() body: UpdateSeoPageDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.SeoPage)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Post('seed')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.SeoPage)
  async seed(
    @Body() body: CsvFilePathDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<{ message: string }> {
    const { seedSeoData } = await import('../../scripts/seed-seo-data');
    await seedSeoData(body.csvFilePath, this.service, currentUser.adminId, requestedIp);
    return { message: 'SEO data seeded successfully' };
  }
}

