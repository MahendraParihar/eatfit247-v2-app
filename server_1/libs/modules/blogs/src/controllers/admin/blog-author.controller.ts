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
import { BlogAuthorService } from '../../services';
import { CreateBlogAuthorDto } from '../../dto';
import { AdminActionEnum, AdminSubjectEnum, IBlogAuthor, ITableList } from '@eatfit247-shared-lib';

@Controller('blog-author')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class BlogAuthorController {
  constructor(private readonly service: BlogAuthorService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.BlogAuthor)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IBlogAuthor>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.BlogAuthor)
  async getById(@Param('id') id: number): Promise<IBlogAuthor> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.BlogAuthor)
  async create(
    @Body() body: CreateBlogAuthorDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.create(body, ip, user.adminUserId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.BlogAuthor)
  async update(
    @Param('id') id: number,
    @Body() body: CreateBlogAuthorDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.update(id, body, ip, user.adminUserId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.BlogAuthor)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() user: any,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body, ip, user.adminUserId);
  }
}

