import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  BasicSearchDto,
  CreateAddressDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  UpdateFranchiseDto,
  UpdateMemberStatusDto,
  UpdateNutritionistDto,
} from '@server_1/core';
import { AddressService, TxnAddress } from '@server_1/platform';
import { MemberService } from '../../services';
import { CreateMemberDto } from '../../dto';
import { IAddress, IManageAddress, IMember, ITableList, TableEnum } from '@eatfit247-shared-lib';

@Controller('member')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(
    private readonly service: MemberService,
    private readonly addressService: AddressService,
    @InjectModel(TxnAddress) private readonly addressRepository: typeof TxnAddress,
  ) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IMember>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IMember> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateMemberDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateMemberDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateMemberStatusDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(
      id,
      body.active,
      body.deactivationReason || null,
      requestedIp,
      currentUser.adminId,
    );
  }

  @Patch('update-nutritionist/:id')
  async updateNutritionist(
    @Param('id') id: number,
    @Body() body: UpdateNutritionistDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.updateNutritionist(
      id,
      body.nutritionistId,
      requestedIp,
      currentUser.adminId,
    );
  }

  @Patch('update-franchise/:id')
  async updateFranchise(
    @Param('id') id: number,
    @Body() body: UpdateFranchiseDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.updateFranchise(
      id,
      body.franchiseId,
      requestedIp,
      currentUser.adminId,
    );
  }

  // Address endpoints
  @Get(':memberId/addresses')
  async getAddresses(@Param('memberId') memberId: number): Promise<IAddress[]> {
    return await this.addressService.filterByTableIdAndPk(TableEnum.TXN_MEMBER, memberId);
  }

  @Get(':memberId/addresses/:addressId')
  async getAddress(
    @Param('memberId') memberId: number,
    @Param('addressId') addressId: number,
  ): Promise<IAddress> {
    const addresses = await this.addressService.filterByTableIdAndPk(
      TableEnum.TXN_MEMBER,
      memberId,
    );
    const address = addresses.find((addr) => addr.addressId === addressId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  @Post(':memberId/addresses')
  async createAddress(
    @Param('memberId') memberId: number,
    @Body() body: CreateAddressDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<IAddress> {
    const addressData: IManageAddress = {
      tableId: TableEnum.TXN_MEMBER,
      pkOfTable: memberId,
      postalAddress: body.postalAddress,
      cityVillage: body.cityVillage,
      stateId: body.stateId,
      countryId: body.countryId,
      pinCode: body.pinCode,
      latitude: body.latitude,
      longitude: body.longitude,
      addressName: body.addressName
    };
    return await this.addressService.create(addressData, requestedIp, currentUser.adminId);
  }

  @Put(':memberId/addresses/:addressId')
  async updateAddress(
    @Param('memberId') memberId: number,
    @Param('addressId') addressId: number,
    @Body() body: CreateAddressDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<IAddress> {
    const existingAddress = await this.addressRepository.findOne({
      where: { addressId, tableId: TableEnum.TXN_MEMBER, pkOfTable: memberId },
    });
    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }
    const addressObj: any = {
      postalAddress: body.postalAddress,
      cityVillage: body.cityVillage || null,
      stateId: body.stateId,
      countryId: body.countryId,
      pinCode: body.pinCode || null,
      latitude: body.latitude ? String(body.latitude) : null,
      longitude: body.longitude ? String(body.longitude) : null,
      addressName: body.addressName || null,
      active: body.active !== undefined ? body.active : existingAddress.active,
      modifiedBy: currentUser.adminId,
      modifiedIp: requestedIp,
    };
    await this.addressRepository.update(addressObj, {
      where: { addressId },
    });
    const addresses = await this.addressService.filterByTableIdAndPk(
      TableEnum.TXN_MEMBER,
      memberId,
    );
    const updatedAddress = addresses.find((addr) => addr.addressId === addressId);
    if (!updatedAddress) {
      throw new NotFoundException('Address not found after update');
    }
    return updatedAddress;
  }

  @Delete(':memberId/addresses/:addressId')
  async deleteAddress(
    @Param('addressId') addressId: number,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.addressService.delete(addressId, requestedIp, currentUser.adminId);
  }
}
