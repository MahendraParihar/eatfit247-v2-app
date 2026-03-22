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
import { BlogAuthorService, BlogCategoryService, BlogService } from '../../services';
import { CreateBlogDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IBlog,
  IDropdownItem,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('blog')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class BlogController {
  constructor(
    private readonly service: BlogService,
    private readonly blogCategoryService: BlogCategoryService,
    private readonly blogAuthorService: BlogAuthorService,
  ) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Blog)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IBlog>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Blog)
  async getById(@Param('id') id: number): Promise<IBlog> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Blog)
  async create(
    @Body() body: CreateBlogDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Blog)
  async update(
    @Param('id') id: number,
    @Body() body: CreateBlogDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Blog)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('blog-master')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Blog)
  async blogMasterData(@Query() req: any): Promise<{
    blogCategory: IDropdownItem[];
    blogAuthor: IDropdownItem[];
  }> {
    const categories = await this.blogCategoryService.findAll({ page: 0, limit: 1000 });
    const authors = await this.blogAuthorService.findAll({ page: 0, limit: 1000 });
    return {
      blogCategory: categories.tableData.map((item: any) => ({
        id: item.blogCategoryId,
        label: item.blogCategory,
        isActive: item.active,
      })),
      blogAuthor: authors.tableData.map((item: any) => ({
        id: item.blogAuthorId,
        label: `${item.firstName} ${item.lastName}`,
        isActive: item.active,
      })),
    };
  }
}
