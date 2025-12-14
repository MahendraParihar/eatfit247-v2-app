import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto, UpdateActiveDto } from '@server/common';
import { TypeOfExerciseService } from '../../services';
import { CreateTypeOfExerciseDto } from '../../dto';
import { ITableList, ITypeOfExercise, IDropdownItem, IResponse } from 'eatfit247-shared-lib';

@Controller('type-of-exercise')
@UseGuards(JwtAuthGuard)
export class TypeOfExerciseController {
  constructor(private readonly service: TypeOfExerciseService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ITypeOfExercise>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IResponse<ITypeOfExercise>> {
    const data = await this.service.fetchById(id);
    return { data };
  }

  @Post('manage')
  async create(
    @Body() body: CreateTypeOfExerciseDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateTypeOfExerciseDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Get('dropdown')
  async getDropdownList(): Promise<IDropdownItem[]> {
    return await this.service.getTypeOfExerciseList();
  }
}

