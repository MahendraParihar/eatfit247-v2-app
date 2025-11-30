import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, CommonScopes } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_blog_categories',
  schema: 'public',
})
@Scopes(() => ({
  list: CommonScopes.list,
  details: CommonScopes.details,
}))
export class MstBlogCategory extends Model<MstBlogCategory> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'blog_category_id',
    autoIncrement: true,
  })
  blogCategoryId: number;

  @Column({
    allowNull: false,
    field: 'blog_category',
    type: DataType.STRING(100),
  })
  blogCategory: string;

  @Column({
    allowNull: true,
    field: 'image_path',
    type: DataType.JSONB,
    defaultValue: null,
  })
  imagePath: string;

  @Column({
    allowNull: false,
    field: 'url',
    type: DataType.STRING(250),
  })
  url: string;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;
  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'createdByUser',
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
  declare createdAt: Date;
  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
    as: 'updatedByUser',
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
  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminUserId' })
  createdByUser: MstAdminUser;
  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminUserId' })
  updatedByUser: MstAdminUser;
}

