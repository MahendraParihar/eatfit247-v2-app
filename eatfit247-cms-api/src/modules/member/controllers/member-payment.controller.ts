import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { MemberPaymentService } from '../services/member-payment.service';
import { PaymentModeService } from '../../lov/services/payment-mode.service';
import { ProgramService } from '../../program-and-plan/services/program.service';
import { PlanService } from '../../program-and-plan/services/plan.service';
import { CurrencyService } from '../../lov/services/currency.service';
import { CreateMemberPaymentDto } from '../dto/member-payment.dto';
import { PaymentStatusService } from '../../lov/services/payment-status.service';
import { CommonService } from '../../common/common.service';
import { TableEnum } from '../../../enums/table-enum';
import { ConfigParameterService } from '../../config-parameter/config-parameter.service';
import { GST_ENABLED, TAX_PERCENTAGE } from '../../../constants/config-parameters';

@Controller('member-payment')
export class MemberPaymentController {
  constructor(
    private readonly service: MemberPaymentService,
    private readonly paymentModeService: PaymentModeService,
    private readonly programService: ProgramService,
    private readonly planService: PlanService,
    private readonly currencyConfigService: CurrencyService,
    private readonly configParameterService: ConfigParameterService,
    private readonly paymentStatusService: PaymentStatusService,
    private readonly commonService: CommonService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('list/:id')
  async list(@Param('id') id: number) {
    return await this.service.findAll(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('manage/:id')
  async getById(@Param('id') id: number) {
    return await this.service.fetchById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manage/:id')
  async create(@Param('id') memberId: number, @Req() req, @Body() body: CreateMemberPaymentDto) {
    return await this.service.create(memberId, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async update(@Param('id') id: number, @Req() req: any, @Body() body: CreateMemberPaymentDto) {
    return await this.service.update(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-status/:id')
  async changeStatus(@Param('id') id: number, @Body() body: UpdateActiveDto, @Req() req: any) {
    return await this.service.changeStatus(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('master-data/:id')
  async memberMaster(@Param('id') id: number, @Req() req: any) {
    const pro = await Promise.all([
      this.paymentModeService.getPaymentModeList(),
      this.programService.getPaymentList(),
      this.planService.getProgramPlanList(),
      this.currencyConfigService.getCurrencyConfigList(),
      this.paymentStatusService.getPaymentStatusList(),
      this.commonService.findAddresses(TableEnum.TXN_MEMBER, id),
      this.configParameterService.findAll(),
    ]);

    const configParameters = pro[6];

    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        paymentMode: pro[0],
        program: pro[1],
        plan: pro[2],
        currencyConfig: pro[3],
        paymentStatus: pro[4],
        addresses: pro[5],
        taxPercentage: Number(configParameters[TAX_PERCENTAGE]),
        taxApplicable: configParameters[GST_ENABLED] === '1',
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('download-invoice/:id')
  async downloadInvoice(@Param('id') memberPaymentId: number) {
    return await this.service.generateInvoice(memberPaymentId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('send-invoice/:id')
  async sendDietPlanViaEmail(@Param('id') memberPaymentId: number) {
    return await this.service.sendInvoice(memberPaymentId);
  }
}
