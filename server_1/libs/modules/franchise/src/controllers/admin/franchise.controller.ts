import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp } from '@server_1/core';
import { BasicSearchDto, UpdateActiveDto } from '@server_1/shared-dto';
import { FranchiseService } from '../../services';
import { CreateFranchiseDto } from '../../dto';
import { ITableList, IFranchise, IDropdownItem, IResponse } from '@eatfit247-shared-lib';

@Controller('franchise')
@UseGuards(JwtAuthGuard)
export class FranchiseController {
  constructor(private readonly service: FranchiseService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IFranchise>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IResponse<IFranchise>> {
    const data = await this.service.fetchById(id);
    return { data };
  }

  @Post('manage')
  async create(
    @Body() body: CreateFranchiseDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateFranchiseDto,
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
  async getDropdown(): Promise<IDropdownItem[]> {
    return await this.service.getFranchiseList();
  }
}

