import { Body, Controller, Get, Header, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, CurrentUser, JwtAuthGuard, RequestedIp, RequireAbility } from '@server_1/core';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, ICreditNote, IFileModel } from '@eatfit247-shared-lib';
import { CreditNoteService } from '../../services/credit-note.service';
import { CreateCreditNoteDto } from '../../dto/credit-note.dto';

/** Tax Credit Notes of a member's invoices (roadmap 4.6, group 10). */
@Controller('member/:id/credit-notes')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberCreditNoteController {
  constructor(private readonly creditNoteService: CreditNoteService) {}

  @Get()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.CreditNote)
  async list(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: IAuthUser): Promise<ICreditNote[]> {
    return this.creditNoteService.list(id, user);
  }

  @Post()
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.CreditNote)
  async create(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateCreditNoteDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<ICreditNote> {
    return this.creditNoteService.create(id, body, user, ip);
  }

  @Get(':creditNoteId/pdf')
  @Header('Content-Type', 'application/pdf')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.CreditNote)
  async pdf(
    @Param('id', ParseIntPipe) id: number,
    @Param('creditNoteId', ParseIntPipe) creditNoteId: number,
    @CurrentUser() user: IAuthUser,
  ): Promise<IFileModel> {
    return this.creditNoteService.generatePdf(id, creditNoteId, user);
  }
}
