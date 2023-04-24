import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'mst_recipe_category',
  schema: 'public',
  indexes: [
    {
      unique: false,
      fields: ['sequence'],
      name: 'ix_uq_mst_recipe_category_sequence',
    },
  ],
})
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
    type: DataType.STRING(50),
  })
  recipeCategory: string;

  @Column({
    allowNull: true,
    field: 'image_path',
    type: DataType.JSONB,
    defaultValue: null,
  })
  imagePath: string;

  @Column({
    allowNull: true,
    field: 'from_time',
    type: DataType.TIME,
    defaultValue: null,
  })
  fromTime: string;

  @Column({
    allowNull: true,
    field: 'to_time',
    type: DataType.TIME,
    defaultValue: null,
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
  })
  active: boolean;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'CreatedBy',
  })
  @Column({
    allowNull: false,
    field: 'created_by',
  })
  createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
    as: 'ModifiedBy',
  })
  @Column({
    allowNull: false,
    field: 'modified_by',
  })
  modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
  })
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
  })
  modifiedIp: string;
}
