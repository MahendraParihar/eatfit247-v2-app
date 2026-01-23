import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TxnShipment } from './txn-shipment.model';
import { ShipmentTrackingEnum, ShipmentTrackingSourceEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_shipment_tracking_events',
  schema: 'public',
  tableName: 'txn_shipment_tracking_events',
  timestamps: false,
})
export class TxnShipmentTrackingEvent extends Model<TxnShipmentTrackingEvent> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'shipment_tracking_event_id',
    autoIncrement: true,
  })
  declare shipmentTrackingEventId: number;

  @ForeignKey(() => TxnShipment)
  @Column({
    allowNull: false,
    field: 'shipment_id',
    type: DataType.INTEGER,
  })
  declare shipmentId: number;

  @BelongsTo(() => TxnShipment, {
    foreignKey: 'shipmentId',
    targetKey: 'shipmentId',
    as: 'shipment',
  })
  declare shipment: TxnShipment;

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
  })
  declare status: ShipmentTrackingEnum;

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
    field: 'source',
    type: DataType.ENUM('COURIER', 'SYSTEM', 'ADMIN'),
  })
  declare source: ShipmentTrackingSourceEnum;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;
}

