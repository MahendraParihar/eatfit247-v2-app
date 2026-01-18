import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMember, TxnMemberProduct } from '../models';
import {
  ConfigParam, IAddress, IDropdownItem,
  IMemberPaymentMasterData,
  IMemberProduct, IMemberProductMasterData,
  ITableList,
  PaymentSourceEnum,
  TableEnum,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil } from '@server_1/core';
import { AddressService, PaymentModeService, PaymentStatusService } from '@server_1/platform';
import { ProductService } from '@server_1/modules/product';

@Injectable()
export class MemberProductService {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly addressService: AddressService,
    private readonly paymentModeService: PaymentModeService,
    private readonly paymentStatusService: PaymentStatusService,
    private readonly productService: ProductService,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(TxnMemberProduct)
    private readonly memberProductRepository: typeof TxnMemberProduct,
  ) {}

  /**
   * Get all member products for a member
   * @param memberId - Member ID
   * @returns List of member products
   */
  public async findAll(memberId: number): Promise<ITableList<IMemberProduct>> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const { rows, count } = await this.memberProductRepository.scope('list').findAndCountAll({
      where: {
        memberId,
        active: true,
      },
      order: [['paymentDate', 'DESC']],
      raw: true,
      nest: true,
    });
    return <ITableList<IMemberProduct>>{
      tableData: rows.map((item: any) => this.convertToModel(item)),
      count,
    };
  }

  /**
   * Get member product by ID
   * @param memberId - Member ID
   * @param productId - Product ID
   * @returns Product details
   */
  public async findById(memberId: number, productId: number): Promise<IMemberProduct> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const product = await this.memberProductRepository.scope('details').findOne({
      where: {
        memberProductId: productId,
        memberId,
        active: true,
      },
      raw: true,
      nest: true,
    });
    if (!product) {
      throw new NotFoundException('Member product not found');
    }
    return this.convertToModel(product);
  }

  /**
   * Convert database model to IMemberProduct interface
   */
  private convertToModel(item: any): IMemberProduct {
    return <IMemberProduct>{
      memberProductId: item.memberProductId,
      memberId: item.memberId,
      memberName: item.member ? `${item.member.firstName} ${item.member.lastName}`.trim() : '',
      paymentModeId: item.paymentModeId,
      paymentMode: item.paymentMode?.paymentMode || '',
      addressId: item.addressId,
      transactionId: item.transactionId,
      paymentDate: item.paymentDate,
      invoiceId: item.invoiceId,
      paymentStatusId: item.paymentStatusId,
      paymentStatus: item.paymentStatus?.paymentStatus || '',
      promoCode: item.promoCode,
      isTaxApplicable: item.isTaxApplicable,
      paymentObj: item.paymentObj,
      refundObj: item.refundObj,
      paymentGatewayResponse: item.paymentGatewayResponse,
      gstNumber: item.gstNumber,
      billingAddressId: item.billingAddressId,
      paymentSource: item.paymentSource as PaymentSourceEnum,
      gatewayProvider: item.gatewayProvider,
      gatewayOrderId: item.gatewayOrderId,
      gatewayPaymentId: item.gatewayPaymentId,
      paymentLink: item.paymentLink,
      address: item.address || undefined,
      billingAddress: item.billingAddress || undefined,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
    };
  }

  public async loadMasterData(memberId: number): Promise<IMemberProductMasterData> {
    const [paymentModes, product, paymentStatuses, addresses] = await Promise.all([
      this.paymentModeService.getDropdownList(),
      this.productService.getProductList(),
      this.paymentStatusService.getDropdownList(),
      this.addressService.filterByTableIdAndPk(TableEnum.TXN_MEMBER, memberId),
    ]);
    const taxApplicable = this.appConfigService.getBoolean(ConfigParam.GST_ENABLED, true, false);
    const paymentSource: IDropdownItem[] = Object.values(PaymentSourceEnum).map((source) => ({
      id: source,
      label: source,
      selected: false,
    }));
    return <IMemberProductMasterData>{
      paymentMode: paymentModes,
      product: product,
      paymentStatus: paymentStatuses,
      addresses: addresses as IAddress[],
      taxApplicable: taxApplicable,
      paymentSource: paymentSource,
    };
  }
}

