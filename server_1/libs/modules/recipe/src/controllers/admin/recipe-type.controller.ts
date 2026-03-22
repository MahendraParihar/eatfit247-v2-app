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
import { RecipeTypeService } from '../../services';
import { CreateRecipeTypeDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IRecipeType,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('recipe-type')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class RecipeTypeController {
  constructor(private readonly service: RecipeTypeService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IRecipeType>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async getById(@Param('id') id: number): Promise<IRecipeType> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Recipe)
  async create(
    @Body() body: CreateRecipeTypeDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Recipe)
  async update(
    @Param('id') id: number,
    @Body() body: CreateRecipeTypeDto,
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
  async getDropdown(): Promise<{ recipeType: IDropdownItem[] }> {
    const types = await this.service.getRecipeTypeList();
    return {
      recipeType: types,
    };
  }
}

