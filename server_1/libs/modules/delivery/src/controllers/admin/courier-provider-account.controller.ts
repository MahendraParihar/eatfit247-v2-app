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
import { CourierProviderAccountService } from '../../services';
import { CreateCourierProviderAccountDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  ICourierProviderAccount,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('courier-provider-account')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class CourierProviderAccountController {
  constructor(private readonly service: CourierProviderAccountService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.CourierProviderAccount)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ICourierProviderAccount>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.CourierProviderAccount)
  async getById(@Param('id') id: number): Promise<ICourierProviderAccount> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.CourierProviderAccount)
  async create(
    @Body() body: CreateCourierProviderAccountDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.CourierProviderAccount)
  async update(
    @Param('id') id: number,
    @Body() body: CreateCourierProviderAccountDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.CourierProviderAccount)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('dropdown')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.CourierProviderAccount)
  async getDropdownList(): Promise<IDropdownItem[]> {
    return await this.service.getCourierProviderAccountList();
  }
}

