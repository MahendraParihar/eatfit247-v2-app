import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';
import { MstRecipe } from './mst-recipe.model';
import { MstRecipeCuisine } from './mst-recipe-cuisine.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_recipe_cuisine_mappings',
  schema: 'public',
  tableName: 'mst_recipe_cuisine_mappings',
})
export class MstRecipeCuisineMapping extends Model<MstRecipeCuisineMapping> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'recipe_cuisine_mapping_id',
    autoIncrement: true,
  })
  recipeCuisineMappingId: number;

  @BelongsTo(() => MstRecipe, { as: 'recipe', foreignKey: 'recipeId', targetKey: 'recipeId' })
  recipe: MstRecipe;

  @Column({
    allowNull: false,
    field: 'recipe_id',
    type: DataType.INTEGER,
  })
  recipeId: number;

  @BelongsTo(() => MstRecipeCuisine, { as: 'recipeCuisine', foreignKey: 'recipeCuisineId', targetKey: 'recipeCuisineId' })
  recipeCuisine: MstRecipeCuisine;

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
    type: DataType.BOOLEAN,
  })
  active: boolean;

  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  createdByUser: MstAdminUser;

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

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
  updatedByUser: MstAdminUser;

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

