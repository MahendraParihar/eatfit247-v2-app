import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstRecipe } from './mst-recipe.model';
import { MstRecipeCategory } from './mst-recipe-category.model';
import { MstRecipeType } from './mst-recipe-type.model';

@Table({
  modelName: 'mst_recipe_category_mapping',
  schema: 'public',
})
export class MstRecipeCategoryMapping extends Model<MstRecipeCategoryMapping> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'recipe_category_mapping_id',
    autoIncrement: true,
  })
  recipeCategoryMappingId: number;
  @ForeignKey(() => MstRecipe)
  @Column({
    allowNull: false,
    field: 'recipe_id',
    type: DataType.INTEGER,
    references: {
      model: MstRecipe,
      key: 'recipe_id',
    },
  })
  recipeId: number;
  @ForeignKey(() => MstRecipeCategory)
  @Column({
    allowNull: false,
    field: 'recipe_category_id',
    type: DataType.INTEGER,
    references: {
      model: MstRecipeCategory,
      key: 'recipe_category_id',
    },
  })
  recipeCategoryId: number;
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

  @BelongsTo(() => MstRecipeCategory)
  recipeCategory: MstRecipeCategory;
  @BelongsTo(() => MstRecipe)
  recipe: MstRecipe;
}
