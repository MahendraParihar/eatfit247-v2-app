import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, RequestedIp } from '@server_1/core';
import { BasicSearchDto, UpdateActiveDto } from '@server_1/shared-dto';
import { BlogCategoryService } from '../../services/blog-category.service';
import { CreateBlogCategoryDto } from '../../dto/blog-category.dto';
import { IBlogCategory, ITableList } from '@eatfit247-shared-lib';

@Controller('blog-category')
@UseGuards(JwtAuthGuard)
export class BlogCategoryController {
  constructor(private readonly service: BlogCategoryService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IBlogCategory>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IBlogCategory> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateBlogCategoryDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.create(body, ip, user.adminUserId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateBlogCategoryDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.update(id, body, ip, user.adminUserId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body, ip, user.adminUserId);
  }
}

