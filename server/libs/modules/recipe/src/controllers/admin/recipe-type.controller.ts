import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto, UpdateActiveDto } from '@server/common';
import { RecipeTypeService } from '../../services';
import { CreateRecipeTypeDto } from '../../dto';
import { ITableList, IRecipeType, IDropdownItem, IResponse } from '@eatfit247-shared-lib';

@Controller('recipe-type')
@UseGuards(JwtAuthGuard)
export class RecipeTypeController {
  constructor(private readonly service: RecipeTypeService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IRecipeType>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IResponse<IRecipeType>> {
    const data = await this.service.fetchById(id);
    return { data };
  }

  @Post('manage')
  async create(
    @Body() body: CreateRecipeTypeDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateRecipeTypeDto,
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

  @Get('dropdown')
  async getDropdown(): Promise<{ recipeType: IDropdownItem[] }> {
    const types = await this.service.getRecipeTypeList();
    return {
      recipeType: types,
    };
  }
}

