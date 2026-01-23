import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TxnMemberProduct } from './txn-member-product.model';
import { MstProduct, MstProductVariant } from '@server_1/modules/product';

@Table({
  freezeTableName: true,
  modelName: 'txn_member_product_order_items',
  schema: 'public',
  tableName: 'txn_member_product_order_items',
  timestamps: false,
})
export class TxnMemberProductOrderItem extends Model<TxnMemberProductOrderItem> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_product_order_item_id',
    autoIncrement: true,
  })
  declare memberProductOrderItemId: number;

  @ForeignKey(() => TxnMemberProduct)
  @Column({
    allowNull: true,
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

  @ForeignKey(() => MstProduct)
  @Column({
    allowNull: true,
    field: 'product_id',
    type: DataType.INTEGER,
  })
  declare productId: number;

  @BelongsTo(() => MstProduct, {
    foreignKey: 'productId',
    targetKey: 'productId',
    as: 'product',
  })
  declare product: MstProduct;

  @ForeignKey(() => MstProductVariant)
  @Column({
    allowNull: true,
    field: 'product_variant_id',
    type: DataType.INTEGER,
  })
  declare productVariantId: number;

  @BelongsTo(() => MstProductVariant, {
    foreignKey: 'productVariantId',
    targetKey: 'productVariantId',
    as: 'productVariant',
  })
  declare productVariant: MstProductVariant;

  @Column({
    allowNull: true,
    field: 'product_name',
    type: DataType.STRING(100),
  })
  declare productName: string;

  @Column({
    allowNull: true,
    field: 'quantity_label',
    type: DataType.STRING(50),
  })
  declare quantityLabel: string;

  @Column({
    allowNull: true,
    field: 'unit_price',
    type: DataType.DECIMAL(10, 2),
  })
  declare unitPrice: number;

  @Column({
    allowNull: true,
    field: 'tax_amount',
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
  })
  declare taxAmount: number;

  @Column({
    allowNull: true,
    field: 'tax_percent',
    type: DataType.DECIMAL(5, 2),
  })
  declare taxPercent: number;

  @Column({
    allowNull: true,
    field: 'total_price',
    type: DataType.DECIMAL(10, 2),
  })
  declare totalPrice: number;

  @Column({
    allowNull: true,
    field: 'tax_obj',
    type: DataType.JSONB,
  })
  declare taxObj: any;
}

