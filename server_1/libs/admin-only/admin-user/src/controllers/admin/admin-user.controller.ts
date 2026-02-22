import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BasicSearchDto, CurrentUser, JwtAuthGuard, RequestedIp, UpdateAdminUserStatusDto } from '@server_1/core';
import { AdminUserService } from '../../services';
import { CreateAdminUserDto } from '../../dto';
import { IAdminUser, IAuthUser, IDropdownItem, IResponse, ITableList } from '@eatfit247-shared-lib';

@Controller('admin-user')
@UseGuards(JwtAuthGuard)
export class AdminUserController {
  constructor(private readonly service: AdminUserService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IAdminUser>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IResponse<IAdminUser>> {
    const data = await this.service.fetchById(id);
    return { data };
  }

  @Post('manage')
  async create(
    @Body() body: CreateAdminUserDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateAdminUserDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateAdminUserStatusDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, body.deactivationReason || null, requestedIp, currentUser.adminId);
  }

  @Get('nutritionist/dropdown')
  async getNutritionistDropdown(): Promise<IDropdownItem[]> {
    return await this.service.getNutritionistDropdown();
  }
}

