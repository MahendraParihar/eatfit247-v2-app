import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  BasicSearchDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateActiveDto,
} from '@server_1/core';
import { FranchiseService, FranchiseTurnoverService } from '../../services';
import { CreateFranchiseDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IFranchise,
  IFranchiseInvoiceCounters,
  IFranchiseTurnover,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('franchise')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class FranchiseController {
  constructor(
    private readonly service: FranchiseService,
    private readonly turnoverService: FranchiseTurnoverService,
  ) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Franchise)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IFranchise>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Franchise)
  async getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: IAuthUser): Promise<IFranchise> {
    this.assertFranchiseScope(id, currentUser);
    return await this.service.fetchById(id);
  }

  /** FY turnover against the registration threshold (turnover warning); scoped to the caller's franchises */
  @Get(':id/turnover')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Franchise)
  async turnover(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: IAuthUser): Promise<IFranchiseTurnover> {
    this.assertFranchiseScope(id, currentUser);
    return await this.turnoverService.forFranchiseId(id);
  }

  /** Current FY invoice counters, for the number-format preview on the franchise form */
  @Get(':id/invoice-counters')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Franchise)
  async invoiceCounters(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: IAuthUser): Promise<IFranchiseInvoiceCounters> {
    this.assertFranchiseScope(id, currentUser);
    return await this.service.invoiceCounters(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Franchise)
  async create(
    @Body() body: CreateFranchiseDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Franchise)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateFranchiseDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    this.assertFranchiseScope(id, currentUser);
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Franchise)
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    this.assertFranchiseScope(id, currentUser);
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('dropdown')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Franchise)
  async getDropdown(): Promise<IDropdownItem[]> {
    return await this.service.getFranchiseList();
  }

  /** Empty franchiseIds = unscoped (Super Admin), as in CaslAbilityFactory */
  private assertFranchiseScope(id: number, currentUser: IAuthUser): void {
    if (currentUser.franchiseIds?.length && !currentUser.franchiseIds.includes(id)) {
      throw new ForbiddenException('You do not have access to this franchise.');
    }
  }
}
