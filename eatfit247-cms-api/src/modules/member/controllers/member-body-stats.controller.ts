import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MemberBodyStatsService } from '../services/member-body-stats.service';
import { HealthParameterService } from '../../lov/services/health-parameter.service';
import { CreateHealthParameterLogDto } from '../dto/member-health-parameter-log.dto';

@Controller('member-body-stats')
export class MemberBodyStatsController {
  constructor(
    private readonly service: MemberBodyStatsService,
    private readonly healthParameterService: HealthParameterService,
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
  async create(@Param('id') memberId: number, @Req() req, @Body() body: CreateHealthParameterLogDto) {
    return await this.service.create(memberId, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async update(@Param('id') id: number, @Req() req: any, @Body() body: CreateHealthParameterLogDto) {
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
    return await this.healthParameterService.getHealthParameterWithUnitMapping();
  }
}
