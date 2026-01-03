import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp } from '@server_1/core';
import { StateService } from '@server_1/platform';
import { BasicSearchDto, UpdateActiveDto } from '@server_1/shared-dto';
import { CreateStateDto } from '../../dto';
import { ITableList, IState, IDropdownItem, IResponse } from '@eatfit247-shared-lib';

@Controller('state')
@UseGuards(JwtAuthGuard)
export class StateController {
  constructor(private readonly service: StateService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IState>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IState> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateStateDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateStateDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Get('dropdown')
  async getDropdownList(@Query('countryId') countryId?: number): Promise<IDropdownItem[]> {
    return await this.service.getStateList(countryId);
  }
}

