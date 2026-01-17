import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, RequestedIp } from '@server_1/core';
import { CsvFilePathDto, UpdateActiveDto } from '@server_1/core';
import { ISeoPageData, SeoPageService } from '../../services/seo-page.service';
import { CreateSeoPageDto, UpdateSeoPageDto } from '../../dto';

@Controller('seo-page')
@UseGuards(JwtAuthGuard)
export class SeoPageAdminController {
  constructor(private readonly service: SeoPageService) {}

  @Get('list')
  async list(): Promise<ISeoPageData[]> {
    return await this.service.findAll();
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<ISeoPageData> {
    return await this.service.findById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateSeoPageDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<ISeoPageData> {
    return await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: UpdateSeoPageDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
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

  @Post('seed')
  async seed(
    @Body() body: CsvFilePathDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<{ message: string }> {
    const { seedSeoData } = await import('../../scripts/seed-seo-data');
    await seedSeoData(body.csvFilePath, this.service, currentUser.adminId, requestedIp);
    return { message: 'SEO data seeded successfully' };
  }
}

