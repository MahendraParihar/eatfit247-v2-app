import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { RecipeService } from '../recipe.service';
import { RecipeCategoryService } from '../../lov/services/recipe-category.service';
import { RecipeCuisineService } from '../../lov/services/recipe-cuisine.service';
import { CreateRecipeDto, RecipeFilterDto } from '../dto/recipe.dto';
import { RecipeTypeService } from '../../lov/services/recipe-type.service';

@Controller('recipe')
export class RecipeController {
  constructor(
    private readonly service: RecipeService,
    private readonly recipeCategoryService: RecipeCategoryService,
    private readonly recipeCuisineService: RecipeCuisineService,
    private readonly recipeTypeService: RecipeTypeService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async list(@Query() req: RecipeFilterDto) {
    return await this.service.findAll(req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('manage/:id')
  async getById(@Param('id') id: number) {
    return await this.service.fetchById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manage')
  async create(@Req() req, @Body() body: CreateRecipeDto) {
    return await this.service.create(body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async update(@Param('id') id: number, @Req() req: any, @Body() body: CreateRecipeDto) {
    return await this.service.update(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-status/:id')
  async changeStatus(@Param('id') id: number, @Body() body: UpdateActiveDto, @Req() req: any) {
    return await this.service.changeStatus(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('master-data')
  async blogMasterData(@Query() req) {
    const promiseAll = await Promise.all([
      this.recipeCategoryService.getRecipeCategoryList(),
      this.recipeCuisineService.getRecipeCuisineList(),
      this.recipeTypeService.getRecipeTypeList(),
    ]);
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        recipeCategory: promiseAll[0],
        recipeCuisine: promiseAll[1],
        recipeType: promiseAll[2],
      },
    };
  }
}
