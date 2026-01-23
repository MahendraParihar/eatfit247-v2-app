import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TxnShipment } from './txn-shipment.model';
import { TxnMemberProductOrderItem } from './txn-member-product-order-item.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_shipment_items',
  schema: 'public',
  tableName: 'txn_shipment_items',
  timestamps: false,
})
export class TxnShipmentItem extends Model<TxnShipmentItem> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'shipment_item_id',
    autoIncrement: true,
  })
  declare shipmentItemId: number;

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

  @ForeignKey(() => TxnMemberProductOrderItem)
  @Column({
    allowNull: true,
    field: 'member_product_order_item_id',
    type: DataType.INTEGER,
  })
  declare memberProductOrderItemId: number;

  @BelongsTo(() => TxnMemberProductOrderItem, {
    foreignKey: 'memberProductOrderItemId',
    targetKey: 'memberProductOrderItemId',
    as: 'orderItem',
  })
  declare orderItem: TxnMemberProductOrderItem;

  @Column({
    allowNull: false,
    field: 'quantity',
    type: DataType.INTEGER,
  })
  declare quantity: number;
}

