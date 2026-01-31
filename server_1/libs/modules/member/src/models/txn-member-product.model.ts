import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  getCreatedByUserInclude,
  getUpdatedByUserInclude,
  MstAdminUser,
  MstFranchise,
} from '@server_1/core';
import { MstPaymentMode, MstPaymentStatus, TxnAddress } from '@server_1/platform';
import { TxnMember } from './txn-member.model';
import { InputLengthEnum, PaymentSourceEnum } from '@eatfit247-shared-lib';
import { TxnMemberProductOrderItem } from './txn-member-product-order-item.model';
import { MstProduct } from '../../../product';

@Table({
  freezeTableName: true,
  modelName: 'txn_member_products',
  schema: 'public',
  tableName: 'txn_member_products',
  indexes: [
    {
      unique: false,
      fields: ['member_id'],
      name: 'ix_txn_member_product_member_id',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: TxnMember,
        as: 'member',
        required: false,
        attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber'],
      },
      {
        model: MstPaymentMode,
        as: 'paymentMode',
        required: false,
        attributes: ['paymentModeId', 'paymentMode'],
      },
      {
        model: MstPaymentStatus,
        as: 'paymentStatus',
        required: false,
        attributes: ['paymentStatusId', 'paymentStatus'],
      },
      {
        model: TxnAddress,
        as: 'address',
        required: false,
        attributes: ['addressId', 'postalAddress', 'cityVillage', 'pinCode'],
      },
      {
        model: TxnAddress,
        as: 'billingAddress',
        required: false,
        attributes: ['addressId', 'postalAddress', 'cityVillage', 'pinCode'],
      },
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: TxnMember,
        as: 'member',
        required: false,
        attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber'],
      },
      {
        model: MstPaymentMode,
        as: 'paymentMode',
        required: false,
        attributes: ['paymentModeId', 'paymentMode'],
      },
      {
        model: MstPaymentStatus,
        as: 'paymentStatus',
        required: false,
        attributes: ['paymentStatusId', 'paymentStatus'],
      },
      {
        model: TxnAddress,
        as: 'address',
        required: false,
      },
      {
        model: TxnAddress,
        as: 'billingAddress',
        required: false,
      },
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
      {
        model: TxnMemberProductOrderItem,
        as: 'orderItems',
        required: false,
        include: [
          {
            model: MstProduct,
            as: 'product',
            required: true,
            attributes: ['hsnCode'],
          },
        ],
      },
    ],
  },
  invoice: {
    include: [
      {
        model: TxnMember,
        as: 'member',
        required: false,
        attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber'],
      },
      {
        model: MstPaymentMode,
        as: 'paymentMode',
        required: false,
        attributes: ['paymentModeId', 'paymentMode'],
      },
      {
        model: MstPaymentStatus,
        as: 'paymentStatus',
        required: false,
        attributes: ['paymentStatusId', 'paymentStatus'],
      },
      {
        model: MstFranchise,
        as: 'franchise',
        required: true,
        attributes: [
          'franchiseId',
          'companyName',
          'gstNumber',
          'tanNumber',
          'vatNumber',
          'lutNumber',
          'brandName',
        ],
      },
      {
        model: TxnMemberProductOrderItem,
        as: 'orderItems',
        required: false,
        include: [
          {
            model: MstProduct,
            as: 'product',
            required: true,
            attributes: ['hsnCode'],
          },
        ],
      },
    ],
  },
}))
export class TxnMemberProduct extends Model<TxnMemberProduct> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_product_id',
    autoIncrement: true,
  })
  declare memberProductId: number;

  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  declare memberId: number;

  @Column({
    allowNull: true,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  declare franchiseId: number;

  @Column({
    allowNull: true,
    field: 'payment_mode_id',
    type: DataType.INTEGER,
  })
  declare paymentModeId: number;

  @Column({
    allowNull: true,
    field: 'address_id',
    type: DataType.INTEGER,
  })
  declare addressId: number;

  @Column({
    allowNull: true,
    field: 'transaction_id',
    type: DataType.STRING(250),
  })
  declare transactionId: string;

  @Column({
    allowNull: true,
    field: 'payment_date',
    type: DataType.DATE,
  })
  declare paymentDate: Date | null;

  @Column({
    allowNull: true,
    field: 'invoice_id',
    type: DataType.STRING(100),
  })
  declare invoiceId: string;

  @Column({
    allowNull: false,
    field: 'payment_status_id',
    type: DataType.INTEGER,
  })
  declare paymentStatusId: number;

  @Column({
    allowNull: true,
    field: 'promo_code',
    type: DataType.STRING(100),
  })
  declare promoCode: string;

  @Column({
    allowNull: true,
    field: 'refund_obj',
    type: DataType.JSONB,
  })
  declare refundObj: any;

  @Column({
    allowNull: true,
    field: 'payment_gateway_response',
    type: DataType.JSONB,
  })
  declare paymentGatewayResponse: any;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @Column({
    allowNull: true,
    field: 'gst_number',
    type: DataType.STRING(50),
  })
  declare gstNumber: string;

  @Column({
    allowNull: true,
    field: 'billing_address_id',
    type: DataType.INTEGER,
  })
  declare billingAddressId: number;

  @Column({
    allowNull: false,
    defaultValue: PaymentSourceEnum.MANUAL,
    field: 'payment_source',
    type: DataType.STRING(30),
  })
  declare paymentSource: PaymentSourceEnum;

  @Column({
    allowNull: true,
    field: 'gateway_provider',
    type: DataType.STRING(50),
  })
  declare gatewayProvider: string;

  @Column({
    allowNull: true,
    field: 'gateway_order_id',
    type: DataType.STRING(100),
  })
  declare gatewayOrderId: string;

  @Column({
    allowNull: true,
    field: 'gateway_payment_id',
    type: DataType.STRING(100),
  })
  declare gatewayPaymentId: string;

  @Column({
    allowNull: true,
    field: 'payment_link',
    type: DataType.STRING(500),
  })
  declare paymentLink: string;

  @Column({
    allowNull: true,
    field: 'member_address',
    type: DataType.JSONB,
  })
  declare memberAddress: any;

  @Column({
    allowNull: true,
    field: 'sub_total_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare subTotalAmount: number;

  @Column({
    allowNull: true,
    field: 'tax_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare taxAmount: number;

  @Column({
    allowNull: true,
    field: 'discount_amount',
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
  })
  declare discountAmount: number;

  @Column({
    allowNull: true,
    field: 'total_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare totalAmount: number;

  @Column({
    allowNull: true,
    field: 'rounding_adjustment',
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
  })
  declare roundingAdjustment: number;

  @Column({
    allowNull: true,
    field: 'currency',
    type: DataType.STRING(3),
  })
  declare currency: string;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'member',
  })
  declare member: TxnMember;

  @BelongsTo(() => MstPaymentMode, {
    foreignKey: 'paymentModeId',
    targetKey: 'paymentModeId',
    as: 'paymentMode',
  })
  declare paymentMode: MstPaymentMode;

  @BelongsTo(() => MstPaymentStatus, {
    foreignKey: 'paymentStatusId',
    targetKey: 'paymentStatusId',
    as: 'paymentStatus',
  })
  declare paymentStatus: MstPaymentStatus;

  @BelongsTo(() => TxnAddress, {
    foreignKey: 'addressId',
    targetKey: 'addressId',
    as: 'address',
  })
  declare address: TxnAddress;

  @BelongsTo(() => TxnAddress, {
    foreignKey: 'billingAddressId',
    targetKey: 'addressId',
    as: 'billingAddress',
  })
  declare billingAddress: TxnAddress;

  @BelongsTo(() => MstFranchise, {
    foreignKey: 'franchiseId',
    targetKey: 'franchiseId',
    as: 'franchise',
  })
  declare franchise: MstFranchise;

  @HasMany(() => TxnMemberProductOrderItem, {
    foreignKey: 'memberProductId',
    sourceKey: 'memberProductId',
    as: 'orderItems',
  })
  declare orderItems: TxnMemberProductOrderItem[];

  @BelongsTo(() => MstAdminUser, {
    as: 'createdByUser',
    foreignKey: 'createdBy',
    targetKey: 'adminId',
  })
  declare createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, {
    as: 'updatedByUser',
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
  })
  declare updatedByUser: MstAdminUser;

  @Column({
    allowNull: true,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  declare createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;

  @Column({
    allowNull: true,
    field: 'modified_by',
    type: DataType.INTEGER,
  })
  declare modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;
}
