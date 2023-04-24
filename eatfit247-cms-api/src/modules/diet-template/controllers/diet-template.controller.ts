import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { DietTemplateService } from '../diet-template.service';
import { CreateDietTemplateDto } from '../dto/diet-template.dto';
import { DietTemplateDetailDto } from '../dto/diet-template-detail.dto';

@Controller('diet-template')
export class DietTemplateController {
  constructor(private readonly service: DietTemplateService) {}

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
  @Post('manage')
  async create(@Req() req, @Body() body: CreateDietTemplateDto) {
    return await this.service.create(body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async update(@Param('id') id: number, @Req() req: any, @Body() body: CreateDietTemplateDto) {
    return await this.service.update(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-status/:id')
  async changeStatus(@Param('id') id: number, @Body() body: UpdateActiveDto, @Req() req: any) {
    return await this.service.changeStatus(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('manage/:id')
  async getDietDetailById(@Param('id') id: number) {
    return await this.service.fetchDietDetail(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('details/:dietTemplateId/:cycleNo')
  async getDietPlanDetail(@Param('dietTemplateId') dietTemplateId: number, @Param('cycleNo') cycleNo: number) {
    return await this.service.fetchDietPlanDetail(dietTemplateId, cycleNo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('details/:dietTemplateId/:cycleNo/:dayNo')
  async getDietPlanDetailDay(
    @Param('dietTemplateId') dietTemplateId: number,
    @Param('cycleNo') cycleNo: number,
    @Param('dayNo') dayNo: number,
  ) {
    return await this.service.fetchDietPlanDetail(dietTemplateId, cycleNo, dayNo);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-details')
  async updateDietTemplateDetails(@Req() req, @Body() body: DietTemplateDetailDto) {
    return await this.service.updateDietTemplatePlanDetail(body, req.ip, req.user.userId);
  }
}
