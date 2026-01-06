import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';

@Table({
  tableName: 'mst_seo_pages',
  schema: 'public',
  freezeTableName: true,
  modelName: 'mst_seo_page',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
}))
export class SeoPageModel extends Model<SeoPageModel> {
  @Column({
    field: 'seo_page_id',
    allowNull: false,
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare seoPageId: number;

  @Column({
    field: 'url',
    allowNull: false,
    type: DataType.TEXT,
    unique: true,
  })
  declare url: string;

  @Column({
    field: 'meta_title',
    allowNull: true,
    type: DataType.STRING(200),
  })
  declare metaTitle: string;

  @Column({
    field: 'meta_description',
    allowNull: true,
    type: DataType.STRING(500),
  })
  declare metaDescription: string;

  @Column({
    field: 'canonical_url',
    allowNull: true,
    type: DataType.TEXT,
  })
  declare canonicalUrl: string;

  @Column({
    field: 'og_type',
    allowNull: true,
    type: DataType.STRING(50),
  })
  declare ogType: string;

  @Column({
    field: 'og_title',
    allowNull: true,
    type: DataType.STRING(200),
  })
  declare ogTitle: string;

  @Column({
    field: 'og_description',
    allowNull: true,
    type: DataType.STRING(500),
  })
  declare ogDescription: string;

  @Column({
    field: 'og_url',
    allowNull: true,
    type: DataType.TEXT,
  })
  declare ogUrl: string;

  @Column({
    field: 'twitter_card',
    allowNull: true,
    type: DataType.STRING(50),
  })
  declare twitterCard: string;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  declare createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
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
}

