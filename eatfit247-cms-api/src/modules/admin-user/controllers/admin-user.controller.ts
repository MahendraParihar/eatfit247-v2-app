import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { BasicSearchDto, UpdateUserStatusDto } from '../../../common-dto/basic-input.dto';
import { AdminUserService } from '../admin-user.service';
import { ChangePasswordDto, CreateAdminUserDto } from '../dto/admin-user.dto';
import { CommonService } from '../../common/common.service';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { FranchiseService } from '../../franchise/franchise.service';
import { IServerResponse } from '../../../common-dto/response-interface';

@Controller('admin-user')
export class AdminUserController {
  constructor(
    private readonly service: AdminUserService,
    private readonly commonService: CommonService,
    private readonly franchiseService: FranchiseService,
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
  @Get('admin-profile')
  async loadAdminProfile(@Req() req) {
    return await this.service.fetchById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin-profile')
  async updateAdminProfile(@Req() req: any, @Body() body: CreateAdminUserDto) {
    return await this.service.update(req.user.userId, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manage')
  async create(@Req() req, @Body() body: CreateAdminUserDto) {
    return await this.service.create(body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async update(@Param('id') id: number, @Req() req: any, @Body() body: CreateAdminUserDto) {
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
  @Post('change-password')
  async changePassword(@Req() req: any, @Body() body: ChangePasswordDto) {
    return await this.service.changePassword(req.user.userId, req.ip, req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('master-data')
  async referrerMaster(@Req() req: any) {
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        role: await this.commonService.getAdminRoleList(req.user.userId),
        franchise: await this.franchiseService.fetchRoleBasedFranchise(req.user.userId),
        adminStatus: await this.commonService.getAdminStatsList(),
        countryCode: await this.commonService.getCountryPhoneCodeList(),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('nutritionist-by-franchise/:id')
  async loadNutritionistByFranchise(@Param('id') id: number, @Req() req: any) {
    return <IServerResponse>{
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        nutritionist: await this.service.fetchFranchiseBasedNutritionist(id),
      },
    };
  }
}
