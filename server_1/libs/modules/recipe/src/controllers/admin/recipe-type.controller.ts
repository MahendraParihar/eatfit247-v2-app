import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BasicSearchDto, CurrentUser, JwtAuthGuard, RequestedIp, UpdateActiveDto } from '@server_1/core';
import { RecipeTypeService } from '../../services';
import { CreateRecipeTypeDto } from '../../dto';
import { IAuthUser, IDropdownItem, IRecipeType, ITableList } from '@eatfit247-shared-lib';

@Controller('recipe-type')
@UseGuards(JwtAuthGuard)
export class RecipeTypeController {
  constructor(private readonly service: RecipeTypeService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IRecipeType>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IRecipeType> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateRecipeTypeDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateRecipeTypeDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
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
  async getDropdown(): Promise<{ recipeType: IDropdownItem[] }> {
    const types = await this.service.getRecipeTypeList();
    return {
      recipeType: types,
    };
  }
}

