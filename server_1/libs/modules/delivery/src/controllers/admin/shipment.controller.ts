import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  BasicSearchDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
} from '@server_1/core';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, IShipment, ITableList, ITrackingInfo } from '@eatfit247-shared-lib';
import { BookingResponseDto } from '../../dto';
import { ShipmentOrchestrationService, ShipmentRecordService } from '../../services';

@Controller('shipment')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class ShipmentController {
  constructor(
    private readonly shipmentRecordService: ShipmentRecordService,
    private readonly shipmentOrchestrationService: ShipmentOrchestrationService,
  ) {}

  @Post(':shipmentId/retry')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Shipment)
  async retryBooking(
    @Param('shipmentId') shipmentId: number,
    @CurrentUser() currentUser: IAuthUser,
  ): Promise<BookingResponseDto> {
    return this.shipmentOrchestrationService.retryBooking(
      shipmentId,
      `admin-${currentUser.adminId}-${Date.now()}`,
    );
  }

  @Post(':memberProductId')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Shipment)
  async create(
    @Param('memberProductId') memberProductId: number,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.shipmentOrchestrationService.initiateFromOrder(
      memberProductId,
      currentUser.adminId,
      requestedIp,
    );
  }

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Shipment)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IShipment>> {
    return this.shipmentRecordService.findAll(req);
  }

  @Get(':id/track')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Shipment)
  async trackShipment(@Param('id') id: number): Promise<ITrackingInfo> {
    return this.shipmentOrchestrationService.trackShipment(id);
  }

  @Get(':id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Shipment)
  async details(@Param('id') id: number): Promise<IShipment> {
    return this.shipmentOrchestrationService.getShipment(id);
  }
}
