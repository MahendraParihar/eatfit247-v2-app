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
import {
  getCreatedByUserInclude,
  getUpdatedByUserInclude,
  MstAdminUser,
  MstFranchise,
} from '@server_1/core';
import { InputLengthEnum, ShipmentStatusEnum } from '@eatfit247-shared-lib';
import { MstCourierProvider } from './mst-courier-provider.model';
import { MstWarehouse } from './mst-warehouse.model';
import { TxnCourierProviderAccount } from './txn-courier-provider-account.model';
import { TxnShipmentItem } from './txn-shipment-item.model';
import { TxnShipmentRateQuote } from './txn-shipment-rate-quote.model';
import { TxnShipmentTrackingEvent } from './txn-shipment-tracking-event.model';
import { MstCountry, MstState } from '@server_1/platform';
import { TxnMemberProductOrderItem } from '@server_1/modules/member/models';

@Table({
  freezeTableName: true,
  modelName: 'txn_shipments',
  schema: 'public',
  tableName: 'txn_shipments',
  indexes: [
    {
      unique: false,
      fields: ['order_id'],
      name: 'idx_shipments_order_id',
    },
    {
      unique: false,
      fields: ['franchise_id'],
      name: 'idx_shipments_franchise',
    },
    {
      unique: false,
      fields: ['warehouse_id'],
      name: 'idx_shipments_warehouse',
    },
    {
      unique: false,
      fields: ['courier_provider_id'],
      name: 'idx_shipments_provider',
    },
    {
      unique: false,
      fields: ['status'],
      name: 'idx_shipments_status',
    },
    {
      unique: false,
      fields: ['tracking_number'],
      name: 'idx_shipments_tracking_number',
    },
    {
      unique: false,
      fields: ['receiver_pincode'],
      name: 'idx_shipments_receiver_pincode',
    },
    {
      unique: true,
      fields: ['shipment_number'],
      name: 'ix_uq_txn_shipment_shipment_number',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstCourierProvider,
        as: 'courierProvider',
        required: false,
        attributes: ['courierProviderId', 'providerCode', 'providerName'],
      },
      {
        model: TxnCourierProviderAccount,
        as: 'providerAccount',
        required: false,
        attributes: ['providerAccountId', 'accountName'],
      },
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
      {
        model: MstWarehouse,
        as: 'warehouse',
        required: false,
        attributes: ['warehouseId', 'name'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstCourierProvider,
        as: 'courierProvider',
        required: false,
      },
      {
        model: TxnCourierProviderAccount,
        as: 'providerAccount',
        required: false,
      },
      {
        model: MstFranchise,
        attributes: [
          'franchiseId',
          'companyName',
          'logo',
          'franchiseCode',
          'firstName',
          'lastName',
          'emailId',
          'alternateEmailId',
          'contactNumber',
          'alternateContactNumber',
          'panNumber',
          'tanNumber',
          'gstNumber',
          'vatNumber',
          'lutNumber',
          'internationalTaxMode',
          'brandName',
          'isPrimary',
          'isDefault',
          'businessType',
        ],
        as: 'franchise',
        required: false,
      },
      {
        model: MstWarehouse,
        attributes: [
          'warehouseId',
          'name',
          'contactName',
          'email',
          'phone',
          'addressLine1',
          'addressLine2',
          'city',
          'stateId',
          'countryId',
          'pinCode',
          'latitude',
          'longitude',
        ],
        as: 'warehouse',
        required: false,
        include: [
          {
            model: MstState,
            as: 'state',
            required: true,
            attributes: ['stateId', 'state', 'code'],
          },
          {
            model: MstCountry,
            as: 'country',
            required: true,
            attributes: ['countryId', 'country', 'countryCode'],
          },
        ],
      },
      {
        model: TxnShipmentItem,
        as: 'shipmentItems',
        include: [
          {
            model: TxnMemberProductOrderItem,
            required: true,
          },
        ],
        required: false,
      },
      {
        model: TxnShipmentRateQuote,
        as: 'rateQuotes',
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
    type: DataType.BIGINT,
    primaryKey: true,
    field: 'shipment_id',
    autoIncrement: true,
  })
  declare shipmentId: number;

  @Column({
    allowNull: false,
    field: 'order_id',
    type: DataType.BIGINT,
  })
  declare orderId: number;

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

  @ForeignKey(() => MstWarehouse)
  @Column({
    allowNull: true,
    field: 'warehouse_id',
    type: DataType.INTEGER,
  })
  declare warehouseId: number;

  @BelongsTo(() => MstWarehouse, {
    foreignKey: 'warehouseId',
    targetKey: 'warehouseId',
    as: 'warehouse',
  })
  declare warehouse: MstWarehouse;

  @ForeignKey(() => MstCourierProvider)
  @Column({
    allowNull: true,
    field: 'courier_provider_id',
    type: DataType.INTEGER,
  })
  declare courierProviderId: number;

  @BelongsTo(() => MstCourierProvider, {
    foreignKey: 'courierProviderId',
    targetKey: 'courierProviderId',
    as: 'courierProvider',
  })
  declare courierProvider: MstCourierProvider;

  @ForeignKey(() => TxnCourierProviderAccount)
  @Column({
    allowNull: true,
    field: 'provider_account_id',
    type: DataType.INTEGER,
  })
  declare providerAccountId: number;

  @BelongsTo(() => TxnCourierProviderAccount, {
    foreignKey: 'providerAccountId',
    targetKey: 'providerAccountId',
    as: 'providerAccount',
  })
  declare providerAccount: TxnCourierProviderAccount;

  @Column({
    allowNull: true,
    field: 'provider_shipment_id',
    type: DataType.STRING(100),
  })
  declare providerShipmentId: string;

  @Column({
    allowNull: true,
    field: 'tracking_number',
    type: DataType.STRING(100),
  })
  declare trackingNumber: string;

  @Column({
    allowNull: true,
    field: 'tracking_url',
    type: DataType.TEXT,
  })
  declare trackingUrl: string;

  @Column({
    allowNull: false,
    unique: true,
    field: 'shipment_number',
    type: DataType.STRING(50),
  })
  declare shipmentNumber: string;

  @Column({
    allowNull: true,
    field: 'total_weight_kg',
    type: DataType.DECIMAL(10, 2),
  })
  declare totalWeightKg: number;

  @Column({
    allowNull: true,
    field: 'length_cm',
    type: DataType.DECIMAL(8, 2),
  })
  declare lengthCm: number;

  @Column({
    allowNull: true,
    field: 'width_cm',
    type: DataType.DECIMAL(8, 2),
  })
  declare widthCm: number;

  @Column({
    allowNull: true,
    field: 'height_cm',
    type: DataType.DECIMAL(8, 2),
  })
  declare heightCm: number;

  @Column({
    allowNull: true,
    field: 'receiver_name',
    type: DataType.STRING(150),
  })
  declare receiverName: string;

  @Column({
    allowNull: true,
    field: 'receiver_phone',
    type: DataType.STRING(20),
  })
  declare receiverPhone: string;

  @Column({
    allowNull: true,
    field: 'receiver_address',
    type: DataType.TEXT,
  })
  declare receiverAddress: string;

  @Column({
    allowNull: true,
    field: 'receiver_city',
    type: DataType.STRING(100),
  })
  declare receiverCity: string;

  @Column({
    allowNull: true,
    field: 'receiver_state',
    type: DataType.STRING(100),
  })
  declare receiverState: string;

  @Column({
    allowNull: true,
    field: 'receiver_pincode',
    type: DataType.STRING(10),
  })
  declare receiverPincode: string;

  @Column({
    allowNull: true,
    field: 'receiver_country',
    type: DataType.STRING(100),
  })
  declare receiverCountry: string;

  @Column({
    allowNull: true,
    field: 'total_amount',
    type: DataType.DECIMAL(12, 2),
  })
  declare totalAmount: number;

  @Column({
    allowNull: false,
    defaultValue: 'DRAFT',
    field: 'status',
    type: DataType.ENUM(
      'DRAFT',
      'RATE_REQUESTED',
      'RATE_SELECTED',
      'BOOKING_REQUESTED',
      'BOOKED',
      'PICKUP_SCHEDULED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'RTO',
      'CANCELLED',
      'FAILED',
    ),
  })
  declare status: string;

  @Column({
    allowNull: true,
    field: 'last_known_status',
    type: DataType.ENUM(
      ShipmentStatusEnum.DRAFT,
      ShipmentStatusEnum.RATE_REQUESTED,
      ShipmentStatusEnum.RATE_SELECTED,
      ShipmentStatusEnum.BOOKING_REQUESTED,
      ShipmentStatusEnum.BOOKED,
      ShipmentStatusEnum.PICKUP_SCHEDULED,
      ShipmentStatusEnum.IN_TRANSIT,
      ShipmentStatusEnum.OUT_FOR_DELIVERY,
      ShipmentStatusEnum.DELIVERED,
      ShipmentStatusEnum.RTO,
      ShipmentStatusEnum.CANCELLED,
      ShipmentStatusEnum.FAILED,
    ),
  })
  declare lastKnownStatus: ShipmentStatusEnum;

  @Column({
    allowNull: true,
    field: 'next_retry_at',
    type: DataType.DATE,
  })
  declare nextRetryAt: Date;

  @Column({
    allowNull: true,
    field: 'rate_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare rateAmount: number;

  @Column({
    allowNull: false,
    defaultValue: 'INR',
    field: 'currency',
    type: DataType.STRING(10),
  })
  declare currency: string;

  @Column({
    allowNull: false,
    defaultValue: 0,
    field: 'retry_count',
    type: DataType.INTEGER,
  })
  declare retryCount: number;

  @Column({
    allowNull: true,
    field: 'last_error',
    type: DataType.TEXT,
  })
  declare lastError: string;

  @Column({
    allowNull: true,
    field: 'metadata',
    type: DataType.JSONB,
  })
  declare metaData: object;

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
    allowNull: false,
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
    allowNull: false,
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

  @HasMany(() => TxnShipmentItem, {
    foreignKey: 'shipmentId',
    sourceKey: 'shipmentId',
    as: 'shipmentItems',
  })
  declare shipmentItems?: TxnShipmentItem[];

  @HasMany(() => TxnShipmentRateQuote, {
    foreignKey: 'shipmentId',
    sourceKey: 'shipmentId',
    as: 'rateQuotes',
  })
  declare rateQuotes?: TxnShipmentRateQuote[];

  @HasMany(() => TxnShipmentTrackingEvent, {
    foreignKey: 'shipmentId',
    sourceKey: 'shipmentId',
    as: 'trackingEvents',
  })
  declare trackingEvents?: TxnShipmentTrackingEvent[];
}
