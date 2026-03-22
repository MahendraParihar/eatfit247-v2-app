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
import { RecipeCategoryService } from '../../services';
import { CreateRecipeCategoryDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IRecipeCategory,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('recipe-category')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class RecipeCategoryController {
  constructor(private readonly service: RecipeCategoryService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IRecipeCategory>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async getById(@Param('id') id: number): Promise<IRecipeCategory> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Recipe)
  async create(
    @Body() body: CreateRecipeCategoryDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Recipe)
  async update(
    @Param('id') id: number,
    @Body() body: CreateRecipeCategoryDto,
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
  async getDropdown(): Promise<{ recipeCategory: IDropdownItem[] }> {
    const categories = await this.service.getRecipeCategoryList();
    return {
      recipeCategory: categories,
    };
  }
}

