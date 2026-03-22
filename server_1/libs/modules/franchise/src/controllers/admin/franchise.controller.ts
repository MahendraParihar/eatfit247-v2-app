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
import { FranchiseService } from '../../services';
import { CreateFranchiseDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IFranchise,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('franchise')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class FranchiseController {
  constructor(private readonly service: FranchiseService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Franchise)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IFranchise>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Franchise)
  async getById(@Param('id') id: number): Promise<IFranchise> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Franchise)
  async create(
    @Body() body: CreateFranchiseDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Franchise)
  async update(
    @Param('id') id: number,
    @Body() body: CreateFranchiseDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Franchise)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('dropdown')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Franchise)
  async getDropdown(): Promise<IDropdownItem[]> {
    return await this.service.getFranchiseList();
  }

  @Get('master-data')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Franchise)
  async getMasterData(): Promise<{ taxApplicable: boolean }> {
    return await this.service.getMasterData();
  }
}

