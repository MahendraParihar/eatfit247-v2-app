import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, RequestedIp } from '@server_1/core';
import { CountryService } from '@server_1/platform';
import { BasicSearchDto, UpdateActiveDto } from '@server_1/shared-dto';
import { CreateCountryDto } from '../../dto';
import { ICountry, IDropdownItem, ITableList } from '@eatfit247-shared-lib';

@Controller('country')
@UseGuards(JwtAuthGuard)
export class CountryController {
  constructor(private readonly service: CountryService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ICountry>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<ICountry> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateCountryDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateCountryDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('dropdown')
  async getDropdownList(): Promise<IDropdownItem[]> {
    return await this.service.getCountryList();
  }
}

