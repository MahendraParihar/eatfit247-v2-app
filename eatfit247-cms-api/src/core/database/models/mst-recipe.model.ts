import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstRecipeType } from './mst-recipe-type.model';

@Table({
  modelName: 'mst_recipe',
  schema: 'public',
})
export class MstRecipe extends Model<MstRecipe> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'recipe_id',
    autoIncrement: true,
  })
  recipeId: number;
  @Column({
    allowNull: false,
    field: 'name',
    type: DataType.STRING(250),
  })
  name: string;
  @ForeignKey(() => MstRecipeType)
  @Column({
    allowNull: false,
    field: 'recipe_type_id',
    type: DataType.INTEGER,
    references: {
      model: 'MstRecipeType',
      key: 'recipe_type_id',
    },
  })
  recipeTypeId: number;
  @Column({
    allowNull: true,
    field: 'details',
    type: DataType.TEXT,
  })
  details: string;
  @Column({
    allowNull: true,
    field: 'url',
    type: DataType.STRING(250),
  })
  url: string;
  @Column({
    allowNull: true,
    field: 'ingredient',
    type: DataType.TEXT,
  })
  ingredient: string;
  @Column({
    allowNull: true,
    field: 'how_to_make',
    type: DataType.TEXT,
  })
  howToMake: string;
  @Column({
    allowNull: true,
    field: 'benefits',
    type: DataType.TEXT,
  })
  benefits: string;
  @Column({
    allowNull: false,
    field: 'image_path',
    type: DataType.JSONB,
  })
  imagePath: string;
  @Column({
    allowNull: false,
    field: 'visited_count',
    defaultValue: 0,
    type: DataType.INTEGER,
  })
  visitedCount: number;
  @Column({
    allowNull: false,
    field: 'serving_count',
    defaultValue: 0,
    type: DataType.INTEGER,
  })
  servingCount: number;
  @Column({
    allowNull: false,
    field: 'share_count',
    defaultValue: 0,
    type: DataType.INTEGER,
  })
  shareCount: number;
  @Column({
    allowNull: true,
    field: 'tags',
    type: DataType.STRING(1000),
  })
  tags: string;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'is_visible_to_all',
    type: DataType.BOOLEAN,
  })
  isVisibleToAll: boolean;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
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
  @Column({
    allowNull: true,
    field: 'download_path',
    type: DataType.STRING(100),
  })
  downloadPath: string;
  @BelongsTo(() => MstRecipeType)
  recipeType: MstRecipeType;
}
