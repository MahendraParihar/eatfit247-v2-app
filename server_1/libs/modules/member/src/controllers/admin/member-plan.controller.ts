import { Body, Controller, Get, Header, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, CurrentUser, JwtAuthGuard, RequestedIp, RequireAbility } from '@server_1/core';
import { MemberPlanService } from '../../services';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IMemberPayment,
  IMemberPaymentMasterData,
  IMemberPaymentUpdatePreview,
  IPaymentLinkResponse,
  IProgramPlan,
  ITableList,
} from '@eatfit247-shared-lib';
import {
  CalculateTaxResponseDto,
  CreateMemberPaymentDto,
  CreatePaymentLinkDto,
  PlanTaxCalculationRequestDto,
  PreviewMemberPaymentUpdateDto,
  UpdateMemberPaymentDto,
} from '../../dto';
import { ProgramPlanService } from '@server_1/modules/program-plan';
import { IFileModel } from '@server_1/platform';

@Controller('member/:id/payment-history')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberPlanController {
  constructor(
    private readonly memberPaymentService: MemberPlanService,
    private readonly programPlanService: ProgramPlanService,
  ) {}

  @Get('supported-gateways')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberPayment)
  async getSupportedGateways(
    @Param('id') id: number,
    @Query('currency') currency: string,
  ): Promise<
    Array<{
      franchisePaymentGatewayId: number;
      gatewayCode: string;
      gatewayName: string;
      providerCountryCode: string;
      currencyCode: string;
      isPrimary: boolean;
      supportsDomestic: boolean;
      supportsInternational: boolean;
    }>
  > {
    return await this.memberPaymentService.getSupportedPaymentGateways(id, currency);
  }

  @Get('master-data')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberPayment)
  async getMasterData(@Param('id') id: number): Promise<IMemberPaymentMasterData> {
    return await this.memberPaymentService.loadMasterData(id);
  }

  @Get()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberPayment)
  async getPaymentHistory(@Param('id') id: number): Promise<ITableList<IMemberPayment>> {
    return await this.memberPaymentService.findAll(id);
  }

  @Get(':paymentId')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberPayment)
  async getPaymentById(
    @Param('id') id: number,
    @Param('paymentId') paymentId: number,
  ): Promise<IMemberPayment> {
    return await this.memberPaymentService.findById(id, paymentId);
  }

  @Post()
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberPayment)
  async createPayment(
    @Param('id') id: number,
    @Body() body: CreateMemberPaymentDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberPayment> {
    body.memberId = id;
    return await this.memberPaymentService.create(id, body, requestedIp, currentUser.adminId);
  }

  @Post(':paymentId/preview-update')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberPayment)
  async previewPaymentUpdate(
    @Param('id') id: number,
    @Param('paymentId') paymentId: number,
    @Body() body: PreviewMemberPaymentUpdateDto,
  ): Promise<IMemberPaymentUpdatePreview> {
    body.memberId = id;
    return await this.memberPaymentService.previewUpdate(id, paymentId, body);
  }

  @Put(':paymentId')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberPayment)
  async updatePayment(
    @Param('id') id: number,
    @Param('paymentId') paymentId: number,
    @Body() body: UpdateMemberPaymentDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberPayment> {
    body.memberId = id;
    return await this.memberPaymentService.update(
      id,
      paymentId,
      body,
      requestedIp,
      currentUser.adminId,
    );
  }

  @Get('program-plan/:programPlanId')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberPayment)
  async getProgramPlanDetails(
    @Param('programPlanId') programPlanId: number,
  ): Promise<IProgramPlan> {
    return await this.programPlanService.fetchById(programPlanId);
  }

  @Post('calculate-tax')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberPayment)
  async calculateTax(
    @Param('id') id: number,
    @Body() body: PlanTaxCalculationRequestDto,
  ): Promise<CalculateTaxResponseDto> {
    return await this.memberPaymentService.calculateTax(id, body);
  }

  @Post('create-payment-link')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberPayment)
  async createPaymentLink(
    @Param('id') id: number,
    @Body() body: CreatePaymentLinkDto,
  ): Promise<IPaymentLinkResponse> {
    return await this.memberPaymentService.createPaymentLink(id, body);
  }

  @Post(':paymentId/regenerate-payment-link')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberPayment)
  async regeneratePaymentLink(
    @Param('id') id: number,
    @Param('paymentId') paymentId: number,
  ): Promise<IMemberPayment> {
    return await this.memberPaymentService.regeneratePaymentLink(id, paymentId);
  }

  @Get(':paymentId/invoice')
  @Header('Content-Type', 'application/pdf')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberPayment)
  async downloadInvoice(
    @Param('id') id: number,
    @Param('paymentId') paymentId: number,
  ): Promise<IFileModel> {
    return await this.memberPaymentService.generateInvoicePDF(id, paymentId);
  }
}
