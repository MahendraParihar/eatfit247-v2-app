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
import { BasicSearchDto, CurrentUser, JwtAuthGuard, RequestedIp, UpdateActiveDto } from '@server_1/core';
import { WarehouseService } from '../../services';
import { CreateWarehouseDto } from '../../dto';
import { IAuthUser, IDropdownItem, IWarehouse, ITableList } from '@eatfit247-shared-lib';

@Controller('warehouse')
@UseGuards(JwtAuthGuard)
export class WarehouseController {
  constructor(private readonly service: WarehouseService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IWarehouse>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IWarehouse> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateWarehouseDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateWarehouseDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Delete('manage/:id')
  async delete(@Param('id') id: number): Promise<void> {
    await this.service.delete(id);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('dropdown')
  async getDropdownList(): Promise<IDropdownItem[]> {
    return await this.service.getWarehouseDropdownList();
  }
}
