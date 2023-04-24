import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { MemberCallScheduleService } from '../services/member-call-schedule.service';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { CreateMemberCallLogDto } from '../dto/member-call-log.dto';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { CallTypeService } from '../../lov/services/call-type.service';
import { CallPurposeService } from '../../lov/services/call-purpose.service';
import { CallStatusService } from '../../lov/services/call-status.service';

@Controller('member-call-schedule')
export class MemberCallScheduleController {
  constructor(
    private readonly service: MemberCallScheduleService,
    private readonly callTypeService: CallTypeService,
    private readonly callPurposeService: CallPurposeService,
    private readonly callStatusService: CallStatusService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('list/:id')
  async list(@Param('id') id: number, @Query() req: BasicSearchDto) {
    return await this.service.findAll(id, req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('manage/:id')
  async getById(@Param('id') id: number) {
    return await this.service.fetchById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manage/:id')
  async create(@Param('id') memberId: number, @Req() req, @Body() body: CreateMemberCallLogDto) {
    return await this.service.create(memberId, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async update(@Param('id') id: number, @Req() req: any, @Body() body: CreateMemberCallLogDto) {
    return await this.service.update(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-status/:id')
  async changeStatus(@Param('id') id: number, @Body() body: UpdateActiveDto, @Req() req: any) {
    return await this.service.changeStatus(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('master-data')
  async memberMaster(@Req() req: any) {
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        callType: await this.callTypeService.getCallTypeList(),
        callPurpose: await this.callPurposeService.getCallPurposeList(),
        callStatus: await this.callStatusService.getCallLogStatusList(),
      },
    };
  }
}
