import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { CreateProgramDto } from '../dto/program.dto';
import { ProgramService } from '../services/program.service';
import { ProgramCategoryService } from '../../lov/services/program-category.service';

@Controller('program')
export class ProgramController {
  constructor(
    private readonly service: ProgramService,
    private readonly programCategoryService: ProgramCategoryService,
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
  @Post('manage')
  async create(@Req() req, @Body() body: CreateProgramDto) {
    return await this.service.create(body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async update(@Param('id') id: number, @Req() req: any, @Body() body: CreateProgramDto) {
    return await this.service.update(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-status/:id')
  async changeStatus(@Param('id') id: number, @Body() body: UpdateActiveDto, @Req() req: any) {
    return await this.service.changeStatus(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('program-master')
  async programMasterData(@Query() req) {
    const promiseAll = await Promise.all([this.programCategoryService.getProgramCategoryList()]);
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        programCategory: promiseAll[0],
      },
    };
  }
}
