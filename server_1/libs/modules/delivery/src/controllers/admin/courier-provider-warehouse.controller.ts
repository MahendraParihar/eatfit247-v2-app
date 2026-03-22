import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AbilitiesGuard,
  BasicSearchDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateActiveDto,
} from '@server_1/core';
import { CourierProviderWarehouseService } from '../../services';
import { CreateCourierProviderWarehouseDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  ICourierProviderWarehouse,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('courier-provider-warehouse')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class CourierProviderWarehouseController {
  constructor(private readonly service: CourierProviderWarehouseService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.CourierProviderWarehouse)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ICourierProviderWarehouse>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.CourierProviderWarehouse)
  async getById(@Param('id') id: number): Promise<ICourierProviderWarehouse> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.CourierProviderWarehouse)
  async create(
    @Body() body: CreateCourierProviderWarehouseDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.CourierProviderWarehouse)
  async update(
    @Param('id') id: number,
    @Body() body: CreateCourierProviderWarehouseDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Delete('manage/:id')
  @RequireAbility(AdminActionEnum.Delete, AdminSubjectEnum.CourierProviderWarehouse)
  async delete(@Param('id') id: number): Promise<void> {
    await this.service.delete(id);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.CourierProviderWarehouse)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }
}
