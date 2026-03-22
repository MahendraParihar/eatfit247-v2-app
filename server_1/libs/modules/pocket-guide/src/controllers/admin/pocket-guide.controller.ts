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
import { PocketGuideService } from '../../services';
import { CreatePocketGuideDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IPocketGuide,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('pocket-guide')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class PocketGuideController {
  constructor(private readonly service: PocketGuideService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.PocketGuide)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IPocketGuide>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.PocketGuide)
  async getById(@Param('id') id: number): Promise<IPocketGuide> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.PocketGuide)
  async create(
    @Body() body: CreatePocketGuideDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.PocketGuide)
  async update(
    @Param('id') id: number,
    @Body() body: CreatePocketGuideDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.PocketGuide)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }
}

