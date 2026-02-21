import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BasicSearchDto, CurrentUser, JwtAuthGuard, RequestedIp, UpdateActiveDto } from '@server_1/core';
import { CourierProviderService } from '../../services';
import { CreateCourierProviderDto } from '../../dto';
import { IDropdownItem, ICourierProvider, ITableList } from '@eatfit247-shared-lib';

@Controller('courier-provider')
@UseGuards(JwtAuthGuard)
export class CourierProviderController {
  constructor(private readonly service: CourierProviderService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ICourierProvider>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<ICourierProvider> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateCourierProviderDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateCourierProviderDto,
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

  @Get('dropdown')
  async getDropdownList(): Promise<IDropdownItem[]> {
    return await this.service.getCourierProviderList();
  }
}

