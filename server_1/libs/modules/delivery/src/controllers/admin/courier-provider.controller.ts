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
import { CourierProviderService } from '../../services';
import { CreateCourierProviderDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  ICourierProvider,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('courier-provider')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class CourierProviderController {
  constructor(private readonly service: CourierProviderService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.CourierProvider)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ICourierProvider>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.CourierProvider)
  async getById(@Param('id') id: number): Promise<ICourierProvider> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.CourierProvider)
  async create(
    @Body() body: CreateCourierProviderDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.CourierProvider)
  async update(
    @Param('id') id: number,
    @Body() body: CreateCourierProviderDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.CourierProvider)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('dropdown')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.CourierProvider)
  async getDropdownList(): Promise<IDropdownItem[]> {
    return await this.service.getCourierProviderList();
  }
}

