import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TxnShipment } from './txn-shipment.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_shipment_items',
  schema: 'public',
  tableName: 'txn_shipment_items',
})
export class TxnShipmentItem extends Model<TxnShipmentItem> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    field: 'shipment_item_id',
    autoIncrement: true,
  })
  declare shipmentItemId: number;

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
    allowNull: false,
    field: 'order_item_id',
    type: DataType.INTEGER,
  })
  declare orderItemId: number;

  @Column({
    allowNull: true,
    field: 'product_name',
    type: DataType.STRING(200),
  })
  declare productName: string;

  @Column({
    allowNull: true,
    field: 'sku',
    type: DataType.STRING(100),
  })
  declare sku: string;

  @Column({
    allowNull: false,
    field: 'quantity',
    type: DataType.INTEGER,
  })
  declare quantity: number;

  @Column({
    allowNull: true,
    field: 'unit_price',
    type: DataType.DECIMAL(10, 2),
  })
  declare unitPrice: number;

  @Column({
    allowNull: true,
    field: 'weight_kg',
    type: DataType.DECIMAL(10, 2),
  })
  declare weightKg: number;
}

