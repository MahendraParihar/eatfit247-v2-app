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
import { RecipeCuisineService } from '../../services';
import { CreateRecipeCuisineDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IRecipeCuisine,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('recipe-cuisine')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class RecipeCuisineController {
  constructor(private readonly service: RecipeCuisineService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IRecipeCuisine>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async getById(@Param('id') id: number): Promise<IRecipeCuisine> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Recipe)
  async create(
    @Body() body: CreateRecipeCuisineDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Recipe)
  async update(
    @Param('id') id: number,
    @Body() body: CreateRecipeCuisineDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Recipe)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('dropdown')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async getDropdown(): Promise<{ recipeCuisine: IDropdownItem[] }> {
    const cuisines = await this.service.getRecipeCuisineList();
    return {
      recipeCuisine: cuisines,
    };
  }
}

