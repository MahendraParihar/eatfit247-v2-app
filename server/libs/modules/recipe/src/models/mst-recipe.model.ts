import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';
import { IMediaUpload, InputLengthEnum } from 'eatfit247-shared-lib';
import { MstRecipeType } from './mst-recipe-type.model';

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
  recipeId: number;
  @Column({
    allowNull: false,
    field: 'name',
    type: DataType.STRING(255),
  })
  name: string;
  @BelongsTo(() => MstRecipeType, { as: 'recipeType', foreignKey: 'recipeTypeId', targetKey: 'recipeTypeId' })
  recipeType: MstRecipeType;
  @Column({
    allowNull: false,
    field: 'recipe_type_id',
    type: DataType.INTEGER,
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
    field: 'preparation_method',
    type: DataType.TEXT,
  })
  preparationMethod: string;
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
  imagePath: IMediaUpload[];
  @Column({
    allowNull: false,
    defaultValue: 0,
    field: 'visited_count',
    type: DataType.INTEGER,
  })
  visitedCount: number;
  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_visible_to_all',
    type: DataType.BOOLEAN,
  })
  isVisibleToAll: boolean;
  @Column({
    allowNull: false,
    defaultValue: 1,
    field: 'serving_count',
    type: DataType.INTEGER,
  })
  servingCount: number;
  @Column({
    allowNull: false,
    defaultValue: 0,
    field: 'share_count',
    type: DataType.INTEGER,
  })
  shareCount: number;
  @Column({
    field: 'tags',
    allowNull: true,
    type: DataType.ARRAY(DataType.STRING),
  })
  tags: string[];
  @Column({
    allowNull: true,
    field: 'download_path',
    type: DataType.JSONB,
  })
  downloadPath: IMediaUpload[];
  @Column({
    allowNull: false,
    field: 'url',
    type: DataType.STRING(250),
  })
  url: string;
  @Column({
    allowNull: true,
    field: 'meta_title',
    type: DataType.STRING(InputLengthEnum.CHAR_60),
  })
  metaTitle: string;
  @Column({
    allowNull: true,
    field: 'meta_description',
    type: DataType.STRING(InputLengthEnum.CHAR_160),
  })
  metaDescription: string;
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

