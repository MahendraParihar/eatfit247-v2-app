import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateActiveDto,
} from '@server_1/core';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, IFranchiseLut } from '@eatfit247-shared-lib';
import { LutService } from '../../services/lut.service';
import { ManageFranchiseLutDto } from '../../dto/franchise-lut.dto';

/** LUT register per franchise (roadmap 4.6, decision 5). */
@Controller('franchise-luts')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class FranchiseLutController {
  constructor(private readonly service: LutService) {}

  @Get(':franchiseId')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.FranchiseLut)
  async list(
    @Param('franchiseId', ParseIntPipe) franchiseId: number,
    @CurrentUser() user: IAuthUser,
  ): Promise<IFranchiseLut[]> {
    return this.service.list(franchiseId, user);
  }

  @Post(':franchiseId')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.FranchiseLut)
  async create(
    @Param('franchiseId', ParseIntPipe) franchiseId: number,
    @Body() body: ManageFranchiseLutDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<IFranchiseLut> {
    return this.service.create(franchiseId, body, user, ip);
  }

  @Put(':franchiseId/:lutId')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.FranchiseLut)
  async update(
    @Param('franchiseId', ParseIntPipe) franchiseId: number,
    @Param('lutId', ParseIntPipe) lutId: number,
    @Body() body: ManageFranchiseLutDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<IFranchiseLut> {
    return this.service.update(franchiseId, lutId, body, user, ip);
  }

  @Patch(':franchiseId/:lutId/status')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.FranchiseLut)
  async changeStatus(
    @Param('franchiseId', ParseIntPipe) franchiseId: number,
    @Param('lutId', ParseIntPipe) lutId: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.changeStatus(franchiseId, lutId, body.active, user, ip);
  }
}
