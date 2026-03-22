import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  BasicSearchDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateAdminUserStatusDto,
} from '@server_1/core';
import { AdminUserService } from '../../services';
import { CreateAdminUserDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAdminUser,
  IAuthUser,
  IDropdownItem,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('admin-user')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class AdminUserController {
  constructor(private readonly service: AdminUserService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.AdminUser)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IAdminUser>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.AdminUser)
  async getById(@Param('id') id: number): Promise<IAdminUser> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.AdminUser)
  async create(
    @Body() body: CreateAdminUserDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.AdminUser)
  async update(
    @Param('id') id: number,
    @Body() body: CreateAdminUserDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.AdminUser)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateAdminUserStatusDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, body.deactivationReason || null, requestedIp, currentUser.adminId);
  }

  @Get('role/dropdown')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.AdminUser)
  async getRoleDropdown(): Promise<IDropdownItem[]> {
    return await this.service.getRoleDropdown();
  }

  @Get('nutritionist/dropdown')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Member)
  async getNutritionistDropdown(): Promise<IDropdownItem[]> {
    return await this.service.getNutritionistDropdown();
  }
}

