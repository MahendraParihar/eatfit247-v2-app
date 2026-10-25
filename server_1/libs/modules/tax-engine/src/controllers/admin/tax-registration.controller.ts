import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateActiveDto,
} from '@server_1/core';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, ITaxRegistration } from '@eatfit247-shared-lib';
import { TaxRegistrationService } from '../../services/tax-registration.service';
import { ManageTaxRegistrationDto } from '../../dto/tax-registration.dto';

/** Tax registrations per franchise (configurable tax treatment, decisions 8 and 14): TaxMaster rights, franchise-scoped. */
@Controller('franchise-tax-registrations')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class TaxRegistrationController {
  constructor(private readonly service: TaxRegistrationService) {}

  @Get(':franchiseId')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster)
  async list(@Param('franchiseId', ParseIntPipe) franchiseId: number, @CurrentUser() user: IAuthUser): Promise<ITaxRegistration[]> {
    return this.service.list(franchiseId, user);
  }

  @Post(':franchiseId')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.TaxMaster)
  async create(
    @Param('franchiseId', ParseIntPipe) franchiseId: number,
    @Body() body: ManageTaxRegistrationDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<ITaxRegistration> {
    return this.service.create(franchiseId, body, user, ip);
  }

  @Put(':franchiseId/:taxRegistrationId')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.TaxMaster)
  async update(
    @Param('franchiseId', ParseIntPipe) franchiseId: number,
    @Param('taxRegistrationId', ParseIntPipe) taxRegistrationId: number,
    @Body() body: ManageTaxRegistrationDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<ITaxRegistration> {
    return this.service.update(franchiseId, taxRegistrationId, body, user, ip);
  }

  @Patch(':franchiseId/:taxRegistrationId/status')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.TaxMaster)
  async changeStatus(
    @Param('franchiseId', ParseIntPipe) franchiseId: number,
    @Param('taxRegistrationId', ParseIntPipe) taxRegistrationId: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.changeStatus(franchiseId, taxRegistrationId, body.active, user, ip);
  }
}
