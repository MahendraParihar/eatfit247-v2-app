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
import { FaqCategoryService, FaqService } from '../../services';
import { CreateFaqDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IFaq,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('faq')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class FaqController {
  constructor(
    private readonly service: FaqService,
    private readonly faqCategoryService: FaqCategoryService,
  ) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Faq)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IFaq>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Faq)
  async getById(@Param('id') id: number): Promise<IFaq> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Faq)
  async create(
    @Body() body: CreateFaqDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Faq)
  async update(
    @Param('id') id: number,
    @Body() body: CreateFaqDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Faq)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('faq-master')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Faq)
  async faqMasterData(@Query() req: any): Promise<{
    faqCategory: IDropdownItem[];
  }> {
    const categories = await this.faqCategoryService.getFaqCategoryList();
    return {
      faqCategory: categories,
    };
  }
}

