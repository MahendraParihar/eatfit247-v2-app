import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, CommonScopes } from '@server/common';
import { IMediaUpload, InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_recipe_categories',
  schema: 'public',
  tableName: 'mst_recipe_categories',
})
@Scopes(() => ({
  list: CommonScopes.list(),
  details: CommonScopes.details(),
}))
export class MstRecipeCategory extends Model<MstRecipeCategory> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'recipe_category_id',
    autoIncrement: true,
  })
  recipeCategoryId: number;

  @Column({
    allowNull: false,
    field: 'recipe_category',
    type: DataType.STRING(100),
  })
  recipeCategory: string;

  @Column({
    allowNull: true,
    field: 'image_path',
    type: DataType.JSONB,
  })
  imagePath: IMediaUpload[];

  @Column({
    allowNull: false,
    field: 'from_time',
    type: DataType.STRING(50),
  })
  fromTime: string;

  @Column({
    allowNull: false,
    field: 'to_time',
    type: DataType.STRING(50),
  })
  toTime: string;

  @Column({
    allowNull: false,
    field: 'sequence',
    type: DataType.INTEGER,
  })
  sequence: number;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  active: boolean;

  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
  updatedByUser: MstAdminUser;

  @Column({
    allowNull: false,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  createdBy: number;

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
  modifiedBy: number;

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
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  modifiedIp: string;
}

