import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { IMediaUpload, InputLengthEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_product',
  schema: 'public',
  tableName: 'txn_product',
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
export class TxnProduct extends Model<TxnProduct> {
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
    type: DataType.STRING(100),
  })
  declare name: string;

  @Column({
    allowNull: false,
    field: 'slug',
    type: DataType.STRING(100),
    unique: true,
  })
  declare slug: string;

  @Column({
    allowNull: true,
    field: 'description',
    type: DataType.TEXT,
  })
  declare description: string;

  @Column({
    allowNull: false,
    field: 'price_range_min',
    type: DataType.DECIMAL(10, 2),
  })
  declare priceRangeMin: number;

  @Column({
    allowNull: false,
    field: 'price_range_max',
    type: DataType.DECIMAL(10, 2),
  })
  declare priceRangeMax: number;

  @Column({
    allowNull: false,
    field: 'sizes',
    type: DataType.JSONB,
  })
  declare sizes: Array<{
    value: string;
    label: string;
    price: number;
  }>;

  @Column({
    allowNull: false,
    field: 'benefits',
    type: DataType.JSONB,
  })
  declare benefits: string[];

  @Column({
    allowNull: false,
    field: 'dose',
    type: DataType.STRING(200),
  })
  declare dose: string;

  @Column({
    allowNull: false,
    field: 'how_to_take',
    type: DataType.TEXT,
  })
  declare howToTake: string;

  @Column({
    allowNull: false,
    field: 'precautions',
    type: DataType.JSONB,
  })
  declare precautions: string[];

  @Column({
    allowNull: false,
    field: 'ingredients',
    type: DataType.JSONB,
  })
  declare ingredients: Array<{
    name: string;
    icon?: string;
    description?: string;
  }>;

  @Column({
    allowNull: false,
    field: 'consumption_instructions',
    type: DataType.JSONB,
  })
  declare consumptionInstructions: {
    amount: string;
    methods: string[];
    timing: {
      morning: string;
      evening: string;
    };
  };

  @Column({
    allowNull: false,
    field: 'outcomes',
    type: DataType.JSONB,
  })
  declare outcomes: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;

  @Column({
    allowNull: false,
    field: 'faqs',
    type: DataType.JSONB,
  })
  declare faqs: Array<{
    question: string;
    answer: string;
  }>;

  @Column({
    allowNull: true,
    field: 'images',
    type: DataType.JSONB,
  })
  declare images: IMediaUpload[];

  @Column({
    allowNull: true,
    field: 'videos',
    type: DataType.JSONB,
  })
  declare videos: string[];

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @BelongsTo(() => MstAdminUser, {
    as: 'createdByUser',
    foreignKey: 'createdBy',
    targetKey: 'adminId',
  })
  declare createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, {
    as: 'updatedByUser',
    foreignKey: 'updatedBy',
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
    field: 'updated_by',
    type: DataType.INTEGER,
  })
  declare updatedBy: number;

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
  declare createdIp: string;

  @Column({
    allowNull: true,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;
}

