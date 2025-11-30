import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { InputLengthEnum } from 'eatfit247-shared-lib';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';

@Table({
  tableName: 'mst_legal_page',
  schema: 'public',
  freezeTableName: true,
  modelName: 'mst_legal_page',
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
export class LegalPagesModel extends Model<LegalPagesModel> {
  @Column({
    field: 'legal_pages_id',
    allowNull: false,
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  legalPageId: number;

  @Column({
    field: 'title',
    allowNull: false,
    type: DataType.STRING(50),
  })
  title: string;

  @Column({
    field: 'details',
    allowNull: false,
    type: DataType.TEXT,
  })
  details: string;

  @Column({
    field: 'image_path',
    allowNull: true,
    type: DataType.JSONB,
  })
  imagePath: string;

  @Column({
    field: 'tags',
    allowNull: true,
    type: DataType.ARRAY(DataType.STRING),
  })
  tags: string[];

  @Column({
    field: 'url',
    allowNull: true,
    type: DataType.TEXT,
  })
  url: string;

  @Column({
    field: 'meta_title',
    allowNull: true,
    type: DataType.STRING(60),
  })
  metaTitle: string;

  @Column({
    field: 'meta_description',
    allowNull: true,
    type: DataType.STRING(160),
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

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'updatedBy', targetKey: 'adminId' })
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
    field: 'updated_by',
    type: DataType.INTEGER,
  })
  updatedBy: number;

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
