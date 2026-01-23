import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { MstProductVariant } from './mst-product-variant.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_product_prices',
  schema: 'public',
  timestamps: false,
  tableName: 'mst_product_prices',
})
export class MstProductPrice extends Model<MstProductPrice> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'id',
    autoIncrement: true,
  })
  declare id: number;

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
  })
  declare variant: MstProductVariant;

  @Column({
    allowNull: false,
    field: 'currency',
    type: DataType.STRING(3),
  })
  declare currency: string;

  @Column({
    allowNull: false,
    field: 'price',
    type: DataType.DECIMAL(10, 2),
  })
  declare price: number;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
    type: DataType.BOOLEAN,
  })
  declare isActive: boolean;

  @Column({
    allowNull: true,
    field: 'valid_from',
    type: DataType.DATEONLY,
  })
  declare validFrom: Date | null;

  @Column({
    allowNull: true,
    field: 'valid_to',
    type: DataType.DATEONLY,
  })
  declare validTo: Date | null;
}


