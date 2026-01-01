import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server_1/core';
import { DiscountTypeEnum, InputLengthEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_promo_codes',
  schema: 'public',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
}))
export class TxnPromoCode extends Model<TxnPromoCode> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'promo_code_id',
    autoIncrement: true,
  })
  declare promoCodeId: number;

  @Column({
    allowNull: false,
    field: 'code',
    type: DataType.STRING(50),
    unique: true,
  })
  declare code: string;

  @Column({
    allowNull: false,
    field: 'discount_type',
    type: DataType.ENUM(...Object.values(DiscountTypeEnum)),
  })
  declare discountType: DiscountTypeEnum;

  @Column({
    allowNull: false,
    field: 'discount_value',
    type: DataType.DECIMAL(10, 2),
  })
  declare discountValue: number;

  @Column({
    allowNull: true,
    field: 'max_discount',
    type: DataType.DECIMAL(10, 2),
  })
  declare maxDiscount: number | null;

  @Column({
    allowNull: true,
    field: 'min_order_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare minOrderAmount: number | null;

  @Column({
    allowNull: true,
    field: 'usage_limit',
    type: DataType.INTEGER,
  })
  declare usageLimit: number | null;

  @Column({
    allowNull: false,
    field: 'used_count',
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare usedCount: number;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @Column({
    allowNull: true,
    field: 'expires_at',
    type: DataType.DATE,
  })
  declare expiresAt: Date | null;

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
    allowNull: true,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string | null;

  @Column({
    allowNull: true,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string | null;
}

