import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, CurrentUser, JwtAuthGuard, RequireAbility } from '@server_1/core';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, IEmailTemplateSwitch } from '@eatfit247-shared-lib';
import { EmailTemplateService } from '../../services/email-template.service';
import { UpdateEmailTemplateSwitchDto } from '../../dto/email-template.dto';

/** Email / WhatsApp template switches (configurable tax treatment, decision 18): global, `EmailTemplate` holders only. */
@Controller('email-template')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class EmailTemplateController {
  constructor(private readonly service: EmailTemplateService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.EmailTemplate)
  async list(): Promise<IEmailTemplateSwitch[]> {
    return await this.service.findAll();
  }

  @Patch(':id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.EmailTemplate)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateEmailTemplateSwitchDto,
    @CurrentUser() currentUser: IAuthUser,
  ): Promise<IEmailTemplateSwitch> {
    return await this.service.update(id, body, currentUser.adminId);
  }
}
