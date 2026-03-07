import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TxnMemberProduct } from './txn-member-product.model';
import { MstProduct, MstProductVariant } from '@server_1/modules/product';
import { TaxMode, TaxTypeEnum } from '@eatfit247-shared-lib';

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
    allowNull: false,
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
    allowNull: false,
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
    allowNull: false,
    field: 'product_name',
    type: DataType.STRING(100),
  })
  declare productName: string;
  @Column({
    allowNull: false,
    field: 'quantity_label',
    type: DataType.STRING(50),
  })
  declare quantityLabel: string;
  @Column({
    allowNull: false,
    field: 'quantity',
    type: DataType.INTEGER,
  })
  declare quantity: number;
  @Column({
    allowNull: true,
    field: 'quantity_value',
    type: DataType.DECIMAL(10, 2),
  })
  declare quantityValue: number;
  @Column({
    allowNull: true,
    field: 'quantity_unit',
    type: DataType.STRING(10),
  })
  declare quantityUnit: string;
  @Column({
    allowNull: false,
    field: 'unit_price',
    type: DataType.DECIMAL(10, 2),
  })
  declare unitPrice: number;
  @Column({
    allowNull: false,
    field: 'base_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare baseAmount: number;
  @Column({
    allowNull: true,
    field: 'discount_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare discountAmount: number;
  @Column({
    allowNull: true,
    field: 'tax_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare taxAmount: number;
  @Column({
    allowNull: true,
    field: 'effective_tax_rate',
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
  })
  declare effectiveTaxRate: number;
  @Column({
    allowNull: false,
    field: 'total_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare totalAmount: number;
  @Column({
    allowNull: true,
    field: 'tax_obj',
    type: DataType.JSONB,
  })
  declare taxObj: any;
  @Column({
    allowNull: true,
    field: 'tax_type',
    type: DataType.ENUM('GST', 'VAT', 'SALES_TAX', 'NONE'),
  })
  declare taxType: TaxTypeEnum;
  @Column({
    allowNull: true,
    field: 'tax_mode',
    type: DataType.ENUM(
      'DOMESTIC_GST',
      'EXPORT_OF_SERVICE',
      'VAT',
      'RCM_IMPORT_SERVICE',
      'SALES_TAX',
      'NO_TAX',
    ),
  })
  declare taxMode: TaxMode;
  @Column({
    allowNull: true,
    field: 'is_lut_applied',
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isLutApplied: boolean;
  @Column({
    allowNull: true,
    field: 'jurisdiction',
    type: DataType.JSONB,
  })
  declare jurisdiction: any;
  @Column({
    allowNull: true,
    field: 'invoice_note',
    type: DataType.TEXT,
  })
  declare invoiceNote: string;
}

