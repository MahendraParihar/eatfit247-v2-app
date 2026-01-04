import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, RequestedIp } from '@server_1/core';
import { BasicSearchDto, UpdateActiveDto } from '@server_1/shared-dto';
import { BlogAuthorService } from '../../services';
import { CreateBlogAuthorDto } from '../../dto';
import { IBlogAuthor, ITableList } from '@eatfit247-shared-lib';

@Controller('blog-author')
@UseGuards(JwtAuthGuard)
export class BlogAuthorController {
  constructor(private readonly service: BlogAuthorService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IBlogAuthor>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IBlogAuthor> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateBlogAuthorDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.create(body, ip, user.adminUserId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateBlogAuthorDto,
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

