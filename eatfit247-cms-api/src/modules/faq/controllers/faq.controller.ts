import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { FaqService } from '../faq.service';
import { CreateFaqDto } from '../dto/faq.dto';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { FaqCategoryService } from '../../lov/services/faq-category.service';

@Controller('faq')
export class FaqController {
  constructor(private readonly service: FaqService, private readonly faqCategoryService: FaqCategoryService) {}

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
  async create(@Req() req, @Body() body: CreateFaqDto) {
    return await this.service.create(body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async update(@Param('id') id: number, @Req() req: any, @Body() body: CreateFaqDto) {
    return await this.service.update(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-status/:id')
  async changeStatus(@Param('id') id: number, @Body() body: UpdateActiveDto, @Req() req: any) {
    return await this.service.changeStatus(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('faq-master')
  async faqMasterData(@Query() req) {
    const promiseAll = await Promise.all([this.faqCategoryService.getFaqCategoryList()]);
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        faqCategory: promiseAll[0],
      },
    };
  }
}
