import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser, MstFranchise } from '@server_1/core';
import { TxnMemberProduct } from './txn-member-product.model';
import { TxnShipmentItem } from './txn-shipment-item.model';
import { TxnShipmentTrackingEvent } from './txn-shipment-tracking-event.model';
import { InputLengthEnum, ShipmentStatusEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_shipments',
  schema: 'public',
  tableName: 'txn_shipments',
  indexes: [
    {
      unique: true,
      fields: ['shipment_no'],
      name: 'ix_uq_txn_shipment_shipment_no',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: TxnMemberProduct,
        as: 'memberProduct',
        required: false,
        attributes: ['memberProductId', 'invoiceId', 'paymentDate'],
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
        model: TxnMemberProduct,
        as: 'memberProduct',
        required: false,
      },
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
      {
        model: TxnShipmentItem,
        as: 'shipmentItems',
        required: false,
      },
      {
        model: TxnShipmentTrackingEvent,
        as: 'trackingEvents',
        required: false,
      },
    ],
  },
}))
export class TxnShipment extends Model<TxnShipment> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'shipment_id',
    autoIncrement: true,
  })
  declare shipmentId: number;

  @ForeignKey(() => TxnMemberProduct)
  @Column({
    allowNull: false,
    field: 'member_product_id',
    type: DataType.INTEGER,
  })
  declare memberProductId: number;

  @BelongsTo(() => TxnMemberProduct, {
    foreignKey: 'memberProductId',
    targetKey: 'memberProductId',
    as: 'memberProduct',
  })
  declare memberProduct: TxnMemberProduct;

  @ForeignKey(() => MstFranchise)
  @Column({
    allowNull: false,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  declare franchiseId: number;

  @BelongsTo(() => MstFranchise, {
    foreignKey: 'franchiseId',
    targetKey: 'franchiseId',
    as: 'franchise',
  })
  declare franchise: MstFranchise;

  @Column({
    allowNull: false,
    unique: true,
    field: 'shipment_no',
    type: DataType.STRING(30),
  })
  declare shipmentNo: string;

  @Column({
    allowNull: true,
    field: 'courier',
    type: DataType.STRING(50),
  })
  declare courier: string;

  @Column({
    allowNull: true,
    field: 'tracking_no',
    type: DataType.STRING(100),
  })
  declare trackingNo: string;

  @Column({
    allowNull: true,
    field: 'tracking_url',
    type: DataType.TEXT,
  })
  declare trackingUrl: string;

  @Column({
    allowNull: false,
    field: 'status',
    type: DataType.ENUM(
      'CREATED',
      'PACKED',
      'SHIPPED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'FAILED',
      'RETURNED',
    ),
    defaultValue: 'CREATED',
  })
  declare status: ShipmentStatusEnum;

  @Column({
    allowNull: true,
    field: 'shipped_at',
    type: DataType.DATE,
  })
  declare shippedAt: Date;

  @Column({
    allowNull: true,
    field: 'delivered_at',
    type: DataType.DATE,
  })
  declare deliveredAt: Date;

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
    allowNull: true,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;

  @Column({
    allowNull: true,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;

  @HasMany(() => TxnShipmentItem, {
    foreignKey: 'shipmentId',
    sourceKey: 'shipmentId',
    as: 'shipmentItems',
  })
  declare shipmentItems?: TxnShipmentItem[];

  @HasMany(() => TxnShipmentTrackingEvent, {
    foreignKey: 'shipmentId',
    sourceKey: 'shipmentId',
    as: 'trackingEvents',
  })
  declare trackingEvents?: TxnShipmentTrackingEvent[];
}

