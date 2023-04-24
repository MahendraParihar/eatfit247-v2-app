import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstRecipe } from './mst-recipe.model';
import { MstNutritive } from './mst-nutritive.model';

@Table({
  modelName: 'mst_recipe_nutritive',
  schema: 'public',
})
export class MstRecipeNutritive extends Model<MstRecipeNutritive> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'recipe_nutritive_id',
    autoIncrement: true,
  })
  recipeNutritiveId: number;

  @BelongsTo(() => MstRecipe, {
    foreignKey: 'recipeId',
    targetKey: 'recipeId',
    as: 'Recipe',
  })
  @Column({
    allowNull: false,
    field: 'recipe_id',
    type: DataType.INTEGER,
  })
  recipeId: number;

  @BelongsTo(() => MstNutritive, {
    foreignKey: 'nutritiveId',
    targetKey: 'nutritiveId',
    as: 'Nutritive',
  })
  @Column({
    allowNull: false,
    field: 'nutritive_id',
    type: DataType.INTEGER,
  })
  nutritiveId: number;

  @Column({
    allowNull: false,
    field: 'value',
    type: DataType.DOUBLE,
  })
  value: number;

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
