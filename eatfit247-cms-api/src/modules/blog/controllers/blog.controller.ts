import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { BlogService } from '../blog.service';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { BlogCategoryService } from '../../lov/services/blog-category.service';
import { BlogAuthorService } from '../../lov/services/blog-author.service';
import { CreateBlogDto } from '../dto/blog.dto';

@Controller('blog')
export class BlogController {
  constructor(
    private readonly service: BlogService,
    private readonly blogCategoryService: BlogCategoryService,
    private readonly blogAuthorService: BlogAuthorService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async list(@Query() req: BasicSearchDto) {
    return await this.service.findAll(req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('manage/:id')
  async getById(@Param('id') id: number) {
    return await this.service.fetchById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manage')
  async create(@Req() req, @Body() body: CreateBlogDto) {
    return await this.service.create(body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async update(@Param('id') id: number, @Req() req: any, @Body() body: CreateBlogDto) {
    return await this.service.update(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-status/:id')
  async changeStatus(@Param('id') id: number, @Body() body: UpdateActiveDto, @Req() req: any) {
    return await this.service.changeStatus(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('blog-master')
  async blogMasterData(@Query() req) {
    const promiseAll = await Promise.all([
      this.blogCategoryService.getBlogCategoryList(),
      this.blogAuthorService.getBlogAuthorList(),
    ]);
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        blogCategory: promiseAll[0],
        blogAuthor: promiseAll[1],
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('send-mail/:id')
  async sendResponseMail(@Param('id') id: number, @Req() req: any) {
    // TODO SEND MAIL
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS_MAIL_SCHEDULE,
      data: null,
    };
  }
}
