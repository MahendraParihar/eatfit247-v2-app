import { BelongsTo, Column, CreatedAt, DataType, HasMany, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { IMediaUpload, InputLengthEnum } from '@eatfit247-shared-lib';
import { MstRecipeType } from './mst-recipe-type.model';
import { MstRecipeCuisineMapping } from './mst-recipe-cuisine-mapping.model';
import { MstRecipeCategoryMapping } from './mst-recipe-category-mapping.model';
import { MstRecipeCategory } from './mst-recipe-category.model';
import { MstRecipeCuisine } from './mst-recipe-cuisine.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_recipes',
  schema: 'public',
  tableName: 'mst_recipes',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstRecipeType,
        as: 'recipeType',
        required: false,
        attributes: ['recipeTypeId', 'recipeType'],
      },
      {
        model: MstRecipeCategoryMapping,
        as: 'recipeCategoryMappings',
        required: false,
        attributes: ['recipeId', 'recipeCategoryId'],
        include: [
          {
            model: MstRecipeCategory,
            as: 'recipeCategory',
            required: false,
            attributes: ['recipeCategory', 'recipeCategoryId'],
          },
        ],
      },
      {
        model: MstRecipeCuisineMapping,
        as: 'recipeCuisineMappings',
        required: false,
        attributes: ['recipeId', 'recipeCuisineId'],
        include: [
          {
            model: MstRecipeCuisine,
            as: 'recipeCuisine',
            required: false,
            attributes: ['recipeCuisine', 'recipeCuisineId'],
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
        model: MstRecipeType,
        as: 'recipeType',
        required: false,
        attributes: ['recipeTypeId', 'recipeType'],
      },
      {
        model: MstRecipeCategoryMapping,
        as: 'recipeCategoryMappings',
        required: false,
        attributes: ['recipeId', 'recipeCategoryId'],
        include: [
          {
            model: MstRecipeCategory,
            as: 'recipeCategory',
            required: false,
            attributes: ['recipeCategory', 'recipeCategoryId'],
          },
        ],
      },
      {
        model: MstRecipeCuisineMapping,
        as: 'recipeCuisineMappings',
        required: false,
        attributes: ['recipeId', 'recipeCuisineId'],
        include: [
          {
            model: MstRecipeCuisine,
            as: 'recipeCuisine',
            required: false,
            attributes: ['recipeCuisine', 'recipeCuisineId'],
          },
        ],
      },
    ],
  },
}))
export class MstRecipe extends Model<MstRecipe> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'recipe_id',
    autoIncrement: true,
  })
  declare recipeId: number;
  @Column({
    allowNull: false,
    field: 'name',
    type: DataType.STRING(255),
  })
  declare name: string;
  @BelongsTo(() => MstRecipeType, {
    as: 'recipeType',
    foreignKey: 'recipeTypeId',
    targetKey: 'recipeTypeId',
  })
  declare recipeType: MstRecipeType;
  @Column({
    allowNull: false,
    field: 'recipe_type_id',
    type: DataType.INTEGER,
  })
  declare recipeTypeId: number;
  @Column({
    allowNull: true,
    field: 'details',
    type: DataType.TEXT,
  })
  declare details: string;
  @Column({
    allowNull: true,
    field: 'preparation_method',
    type: DataType.TEXT,
  })
  declare preparationMethod: string;
  @Column({
    allowNull: true,
    field: 'ingredient',
    type: DataType.TEXT,
  })
  declare ingredient: string;
  @Column({
    allowNull: true,
    field: 'how_to_make',
    type: DataType.TEXT,
  })
  declare howToMake: string;
  @Column({
    allowNull: true,
    field: 'benefits',
    type: DataType.TEXT,
  })
  declare benefits: string;
  @Column({
    allowNull: false,
    field: 'image_path',
    type: DataType.JSONB,
  })
  declare imagePath: IMediaUpload[];
  @Column({
    allowNull: false,
    defaultValue: 0,
    field: 'visited_count',
    type: DataType.INTEGER,
  })
  declare visitedCount: number;
  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_visible_to_all',
    type: DataType.BOOLEAN,
  })
  declare isVisibleToAll: boolean;
  @Column({
    allowNull: false,
    defaultValue: 1,
    field: 'serving_count',
    type: DataType.INTEGER,
  })
  declare servingCount: number;
  @Column({
    allowNull: false,
    defaultValue: 0,
    field: 'share_count',
    type: DataType.INTEGER,
  })
  declare shareCount: number;
  @Column({
    field: 'tags',
    allowNull: true,
    type: DataType.ARRAY(DataType.STRING),
  })
  declare tags: string[];
  @Column({
    allowNull: true,
    field: 'download_path',
    type: DataType.JSONB,
  })
  declare downloadPath: IMediaUpload[];
  @Column({
    allowNull: false,
    field: 'url',
    type: DataType.STRING(250),
  })
  declare url: string;
  @Column({
    allowNull: true,
    field: 'meta_title',
    type: DataType.STRING(InputLengthEnum.CHAR_60),
  })
  declare metaTitle: string;
  @Column({
    allowNull: true,
    field: 'meta_description',
    type: DataType.STRING(InputLengthEnum.CHAR_160),
  })
  declare metaDescription: string;
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
    foreignKey: 'modifiedBy',
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
  @HasMany(() => MstRecipeCuisineMapping, { foreignKey: 'recipeId' })
  declare recipeCuisineMappings: MstRecipeCuisineMapping[];
  @HasMany(() => MstRecipeCategoryMapping, { foreignKey: 'recipeId' })
  declare recipeCategoryMappings: MstRecipeCategoryMapping[];
}

