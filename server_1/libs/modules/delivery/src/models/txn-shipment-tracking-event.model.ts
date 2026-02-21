import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TxnShipment } from './txn-shipment.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_shipment_tracking_events',
  schema: 'public',
  tableName: 'txn_shipment_tracking_events',
  indexes: [
    {
      unique: false,
      fields: ['shipment_id'],
      name: 'idx_tracking_shipment',
    },
    {
      unique: true,
      fields: ['shipment_id', 'provider_status', 'event_time'],
      name: 'ix_uq_txn_shipment_tracking_event',
    },
  ],
})
export class TxnShipmentTrackingEvent extends Model<TxnShipmentTrackingEvent> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    field: 'tracking_event_id',
    autoIncrement: true,
  })
  declare trackingEventId: number;

  @ForeignKey(() => TxnShipment)
  @Column({
    allowNull: true,
    field: 'shipment_id',
    type: DataType.BIGINT,
  })
  declare shipmentId: number;

  @BelongsTo(() => TxnShipment, {
    foreignKey: 'shipmentId',
    targetKey: 'shipmentId',
    as: 'shipment',
  })
  declare shipment: TxnShipment;

  @Column({
    allowNull: true,
    field: 'provider_status',
    type: DataType.STRING(100),
  })
  declare providerStatus: string;

  @Column({
    allowNull: true,
    field: 'internal_status',
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
  declare internalStatus: string;

  @Column({
    allowNull: true,
    field: 'description',
    type: DataType.TEXT,
  })
  declare description: string;

  @Column({
    allowNull: false,
    field: 'event_time',
    type: DataType.DATE,
  })
  declare eventTime: Date;

  @Column({
    allowNull: true,
    field: 'location',
    type: DataType.STRING(200),
  })
  declare location: string;

  @Column({
    allowNull: true,
    field: 'source',
    type: DataType.ENUM('WEBHOOK', 'POLLING', 'MANUAL'),
  })
  declare source: 'WEBHOOK' | 'POLLING' | 'MANUAL';

  @Column({
    allowNull: true,
    field: 'raw_payload',
    type: DataType.JSONB,
  })
  declare rawPayload: Record<string, any>;

  @CreatedAt
  @Column({
    allowNull: true,
    field: 'created_at',
    type: DataType.DATE,
  })
  declare createdAt: Date;
}

