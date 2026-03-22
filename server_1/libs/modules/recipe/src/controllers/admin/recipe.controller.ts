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
import {
  RecipeCategoryService,
  RecipeCuisineService,
  RecipeService,
  RecipeTypeService,
} from '../../services';
import { CreateRecipeDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IRecipe,
  ITableList,
} from '@eatfit247-shared-lib';
import { IFileModel } from '@server_1/platform';

@Controller('recipe')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class RecipeController {
  constructor(
    private readonly service: RecipeService,
    private readonly recipeTypeService: RecipeTypeService,
    private readonly recipeCategoryService: RecipeCategoryService,
    private readonly recipeCuisineService: RecipeCuisineService,
  ) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IRecipe>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async getById(@Param('id') id: number): Promise<IRecipe> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Recipe)
  async create(
    @Body() body: CreateRecipeDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Recipe)
  async update(
    @Param('id') id: number,
    @Body() body: CreateRecipeDto,
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

  @Get('recipe-master')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async recipeMasterData(): Promise<{
    recipeType: IDropdownItem[];
    recipeCategory: IDropdownItem[];
    recipeCuisine: IDropdownItem[];
  }> {
    const types = await this.recipeTypeService.getRecipeTypeList();
    const categories = await this.recipeCategoryService.getRecipeCategoryList();
    const cuisines = await this.recipeCuisineService.getRecipeCuisineList();
    return {
      recipeType: types,
      recipeCategory: categories,
      recipeCuisine: cuisines,
    };
  }

  @Get('download-pdf/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async downloadRecipePdf(@Param('id') id: number): Promise<IFileModel> {
    return await this.service.downloadRecipePdf(id);
  }

  @Get('dropdown')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Recipe)
  async getDropdown(
    @Query() req: BasicSearchDto,
  ): Promise<Array<{ id: number; title: string; subtitle: string }>> {
    return await this.service.searchForDropdown(req);
  }
}
