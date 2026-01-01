import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto, UpdateActiveDto } from '@server/common';
import { BlogService } from '../../services';
import { CreateBlogDto } from '../../dto';
import { ITableList, IBlog, IDropdownItem, IResponse } from '@eatfit247-shared-lib';
import { BlogAuthorService, BlogCategoryService } from '../../services';

@Controller('blog')
@UseGuards(JwtAuthGuard)
export class BlogController {
  constructor(
    private readonly service: BlogService,
    private readonly blogCategoryService: BlogCategoryService,
    private readonly blogAuthorService: BlogAuthorService,
  ) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IBlog>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IResponse<IBlog>> {
    const data = await this.service.fetchById(id);
    return { data };
  }

  @Post('manage')
  async create(
    @Body() body: CreateBlogDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateBlogDto,
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

  @Get('blog-master')
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
