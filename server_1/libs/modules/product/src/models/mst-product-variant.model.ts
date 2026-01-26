import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { MstProduct } from './mst-product.model';
import { MstProductPrice } from './mst-product-price.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_product_variants',
  schema: 'public',
  timestamps: false,
  tableName: 'mst_product_variants',
})
export class MstProductVariant extends Model<MstProductVariant> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'product_variant_id',
    autoIncrement: true,
  })
  declare productVariantId: number;

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
  })
  declare product: MstProduct;

  @Column({
    allowNull: false,
    field: 'quantity_value',
    type: DataType.DECIMAL(10, 2),
  })
  declare quantityValue: number;

  @Column({
    allowNull: false,
    field: 'quantity_unit',
    type: DataType.STRING(10),
  })
  declare quantityUnit: string;

  @Column({
    allowNull: true,
    unique: true,
    field: 'sku',
    type: DataType.STRING(50),
  })
  declare sku: string | null;

  @HasMany(() => MstProductPrice, {
    foreignKey: 'productVariantId',
    sourceKey: 'productVariantId',
  })
  declare prices: MstProductPrice[];
}


