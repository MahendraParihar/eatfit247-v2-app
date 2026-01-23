import { BelongsTo, Column, CreatedAt, DataType, HasMany, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { IMediaUpload, IProductAdditionalInfo, InputLengthEnum } from '@eatfit247-shared-lib';
import { MstProductVariant } from './mst-product-variant.model';
import { MstProductPrice } from './mst-product-price.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_product',
  schema: 'public',
  tableName: 'mst_product',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstProductVariant,
        as: 'variants',
        required: false,
        include: [
          {
            model: MstProductPrice,
            as: 'prices',
            required: false,
          },
        ],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstProductVariant,
        as: 'variants',
        required: false,
        include: [
          {
            model: MstProductPrice,
            as: 'prices',
            required: false,
          },
        ],
      },
    ],
  },
}))
export class MstProduct extends Model<MstProduct> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'product_id',
    autoIncrement: true,
  })
  declare productId: number;

  @Column({
    allowNull: false,
    field: 'name',
    type: DataType.STRING(255),
  })
  declare name: string;

  @Column({
    allowNull: false,
    field: 'image_path',
    type: DataType.JSONB,
  })
  declare imagePath: IMediaUpload[];

  @Column({
    allowNull: false,
    field: 'additional_info',
    type: DataType.JSONB,
    defaultValue: {},
  })
  declare additionalInfo: IProductAdditionalInfo;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @Column({
    allowNull: false,
    field: 'hsn_code',
    type: DataType.STRING(100),
  })
  declare hsnCode: string;

  @HasMany(() => MstProductVariant, {
    foreignKey: 'productId',
    sourceKey: 'productId',
    as: 'variants',
  })
  declare variants?: MstProductVariant[];

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
    allowNull: true,
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
    allowNull: true,
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
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;
}

