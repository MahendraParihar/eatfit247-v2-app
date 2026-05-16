import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateActiveDto,
} from '@server_1/core';
import { GoogleReviewService } from '../../services';
import { CreateGoogleReviewDto, GoogleReviewReplyDto, GoogleReviewSearchDto } from '../../dto';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, IGoogleReview, ITableList } from '@eatfit247-shared-lib';

@Controller('google-review')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class GoogleReviewController {
  constructor(private readonly service: GoogleReviewService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.GoogleReview)
  async list(@Query() req: GoogleReviewSearchDto): Promise<ITableList<IGoogleReview>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.GoogleReview)
  async getById(@Param('id') id: number): Promise<IGoogleReview> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.GoogleReview)
  async create(
    @Body() body: CreateGoogleReviewDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.GoogleReview)
  async update(
    @Param('id') id: number,
    @Body() body: CreateGoogleReviewDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.GoogleReview)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Patch('reply/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.GoogleReview)
  async reply(
    @Param('id') id: number,
    @Body() body: GoogleReviewReplyDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.reply(id, body, requestedIp, currentUser.adminId);
  }

  @Delete('manage/:id')
  @RequireAbility(AdminActionEnum.Delete, AdminSubjectEnum.GoogleReview)
  async remove(@Param('id') id: number): Promise<void> {
    await this.service.remove(id);
  }
}
