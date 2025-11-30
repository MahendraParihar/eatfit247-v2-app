import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto } from '@server/common';
import { AdminUserService } from '../../services';
import { CreateAdminUserDto } from '../../dto';
import { ITableList, IAdminUser } from 'eatfit247-shared-lib';

@Controller('admin-user')
@UseGuards(JwtAuthGuard)
export class AdminUserController {
  constructor(private readonly service: AdminUserService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IAdminUser>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IAdminUser> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateAdminUserDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateAdminUserDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: { adminUserStatusId: number; deactivationReason?: string },
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.adminUserStatusId, body.deactivationReason || null, requestedIp, currentUser.userId || currentUser.adminId);
  }
}

