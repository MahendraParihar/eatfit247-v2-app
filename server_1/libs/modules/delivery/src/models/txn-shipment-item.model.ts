import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TxnShipment } from './txn-shipment.model';
import { TxnMemberProductOrderItem } from '@server_1/modules/member/models';

@Table({
  freezeTableName: true,
  modelName: 'txn_shipment_items',
  schema: 'public',
  tableName: 'txn_shipment_items',
  timestamps: false,
  createdAt: true,
  indexes: [
    {
      unique: false,
      fields: ['shipment_id'],
      name: 'idx_shipment_items_shipment',
    },
    {
      unique: false,
      fields: ['member_product_order_item_id'],
      name: 'idx_shipment_items_order_item',
    },
    {
      unique: true,
      fields: ['shipment_id', 'member_product_order_item_id'],
      name: 'uq_shipment_item',
    },
  ],
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
    allowNull: false,
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
  @ForeignKey(() => TxnMemberProductOrderItem)
  @Column({
    allowNull: false,
    field: 'member_product_order_item_id',
    type: DataType.BIGINT,
  })
  declare memberProductOrderItemId: number;
  @BelongsTo(() => TxnMemberProductOrderItem, {
    foreignKey: 'memberProductOrderItemId',
    targetKey: 'memberProductOrderItemId',
    as: 'memberProductOrderItem',
  })
  declare memberProductOrderItem: TxnMemberProductOrderItem;
  @Column({
    allowNull: false,
    field: 'quantity',
    type: DataType.INTEGER,
  })
  declare quantity: number;
  @CreatedAt
  @Column({
    allowNull: true,
    field: 'created_at',
    type: DataType.DATE,
  })
  declare createdAt: Date;
}

