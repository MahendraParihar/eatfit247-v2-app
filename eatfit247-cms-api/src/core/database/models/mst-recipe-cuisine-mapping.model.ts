import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstRecipe } from './mst-recipe.model';
import { MstRecipeCuisine } from './mst-recipe-cuisine.model';

@Table({
  modelName: 'mst_recipe_cuisine_mapping',
  schema: 'public',
})
export class MstRecipeCuisineMapping extends Model<MstRecipeCuisineMapping> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'recipe_cuisine_mapping_id',
    autoIncrement: true,
  })
  recipeCuisineMappingId: number;

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

  @BelongsTo(() => MstRecipeCuisine, {
    foreignKey: 'recipeCuisineId',
    targetKey: 'recipeCuisineId',
    as: 'RecipeCuisine',
  })
  @Column({
    allowNull: false,
    field: 'recipe_cuisine_id',
    type: DataType.INTEGER,
  })
  recipeCuisineId: number;

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
