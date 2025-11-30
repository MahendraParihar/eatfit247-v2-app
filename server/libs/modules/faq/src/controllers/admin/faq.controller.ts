import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto, UpdateActiveDto } from '@server/common';
import { FaqService } from '../../services/faq.service';
import { CreateFaqDto } from '../../dto/faq.dto';
import { ITableList, IDropdownItem, IFaq } from 'eatfit247-shared-lib';
import { FaqCategoryService } from '../../services/faq-category.service';

@Controller('faq')
@UseGuards(JwtAuthGuard)
export class FaqController {
  constructor(
    private readonly service: FaqService,
    private readonly faqCategoryService: FaqCategoryService,
  ) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IFaq>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IFaq> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateFaqDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateFaqDto,
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

  @Get('faq-master')
  async faqMasterData(@Query() req: any): Promise<{
    faqCategory: IDropdownItem[];
  }> {
    const categories = await this.faqCategoryService.getFaqCategoryList();
    return {
      faqCategory: categories,
    };
  }
}

