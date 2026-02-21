import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BasicSearchDto, CurrentUser, JwtAuthGuard, RequestedIp, UpdateActiveDto } from '@server_1/core';
import { CourierProviderAccountService } from '../../services';
import { CreateCourierProviderAccountDto } from '../../dto';
import { IDropdownItem, ICourierProviderAccount, ITableList } from '@eatfit247-shared-lib';

@Controller('courier-provider-account')
@UseGuards(JwtAuthGuard)
export class CourierProviderAccountController {
  constructor(private readonly service: CourierProviderAccountService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ICourierProviderAccount>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<ICourierProviderAccount> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateCourierProviderAccountDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateCourierProviderAccountDto,
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
    return await this.service.getCourierProviderAccountList();
  }
}

