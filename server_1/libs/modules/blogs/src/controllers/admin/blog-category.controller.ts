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
import { BlogCategoryService } from '../../services';
import { CreateBlogCategoryDto } from '../../dto';
import { AdminActionEnum, AdminSubjectEnum, IBlogCategory, ITableList } from '@eatfit247-shared-lib';

@Controller('blog-category')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class BlogCategoryController {
  constructor(private readonly service: BlogCategoryService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.BlogCategory)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IBlogCategory>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.BlogCategory)
  async getById(@Param('id') id: number): Promise<IBlogCategory> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.BlogCategory)
  async create(
    @Body() body: CreateBlogCategoryDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.create(body, ip, user.adminUserId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.BlogCategory)
  async update(
    @Param('id') id: number,
    @Body() body: CreateBlogCategoryDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.update(id, body, ip, user.adminUserId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.BlogCategory)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body, ip, user.adminUserId);
  }
}

