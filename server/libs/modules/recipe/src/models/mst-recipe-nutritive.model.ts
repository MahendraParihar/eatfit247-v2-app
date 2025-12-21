import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';
import { MstRecipe } from './mst-recipe.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_recipe_nutritive',
  schema: 'public',
  tableName: 'mst_recipe_nutritive',
})
export class MstRecipeNutritive extends Model<MstRecipeNutritive> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'recipe_nutritive_id',
    autoIncrement: true,
  })
  declare recipeNutritiveId: number;

  @BelongsTo(() => MstRecipe, { as: 'recipe', foreignKey: 'recipeId', targetKey: 'recipeId' })
  declare recipe: MstRecipe;

  @Column({
    allowNull: false,
    field: 'recipe_id',
    type: DataType.INTEGER,
  })
  declare recipeId: number;

  @Column({
    allowNull: false,
    field: 'nutritive_id',
    type: DataType.INTEGER,
  })
  declare nutritiveId: number;

  @Column({
    allowNull: false,
    field: 'value',
    type: DataType.DOUBLE,
  })
  declare value: number;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  declare createdByUser: MstAdminUser;

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

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
  declare updatedByUser: MstAdminUser;

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

