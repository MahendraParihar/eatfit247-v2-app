import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { BasicSearchDto, UpdateUserStatusDto } from '../../../common-dto/basic-input.dto';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { CommonService } from '../../common/common.service';
import { FranchiseService } from '../../franchise/franchise.service';
import { MemberService } from '../services/member.service';
import { CreateMemberDto } from '../dto/member.dto';
import { MemberDashboardService } from '../services/member-dashboard.service';

@Controller('member')
export class MemberController {
  constructor(
    private readonly service: MemberService,
    private readonly commonService: CommonService,
    private readonly franchiseService: FranchiseService,
    private readonly dashboardService: MemberDashboardService,
  ) {}

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
  @Get('detail/:id')
  async getDetailById(@Param('id') id: number) {
    return await this.service.fetchDetailById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manage')
  async create(@Req() req, @Body() body: CreateMemberDto) {
    return await this.service.create(body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async update(@Param('id') id: number, @Req() req: any, @Body() body: CreateMemberDto) {
    return await this.service.update(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update-status/:id')
  async changeStatus(@Param('id') id: number, @Body() body: UpdateUserStatusDto, @Req() req: any) {
    return await this.service.changeStatus(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('reset-password/:id')
  async resetPassword(@Param('id') id: number, @Req() req: any) {
    return await this.service.resetPassword(id, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('master-data')
  async memberMaster(@Req() req: any) {
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        franchise: await this.franchiseService.fetchRoleBasedFranchise(req.user.userId),
        memberStatus: await this.commonService.getAdminStatsList(),
        countryCode: await this.commonService.getCountryPhoneCodeList(),
        country: await this.commonService.getCountryList(),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboardData() {
    return await this.dashboardService.getDashboardData();
  }
}
