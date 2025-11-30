import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto, UpdateActiveDto } from '@server/common';
import { RecipeService, RecipeTypeService, RecipeCategoryService, RecipeCuisineService } from '../../services';
import { CreateRecipeDto } from '../../dto';
import { ITableList, IRecipe, IDropdownItem } from 'eatfit247-shared-lib';

@Controller('recipe')
@UseGuards(JwtAuthGuard)
export class RecipeController {
  constructor(
    private readonly service: RecipeService,
    private readonly recipeTypeService: RecipeTypeService,
    private readonly recipeCategoryService: RecipeCategoryService,
    private readonly recipeCuisineService: RecipeCuisineService,
  ) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IRecipe>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IRecipe> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateRecipeDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateRecipeDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Get('recipe-master')
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
}

