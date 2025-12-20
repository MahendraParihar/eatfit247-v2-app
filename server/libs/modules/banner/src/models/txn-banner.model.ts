import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, CommonScopes, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';
import { IMediaUpload, InputLengthEnum, BannerForEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_banner',
  schema: 'public',
  tableName: 'txn_banner',
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
export class TxnBanner extends Model<TxnBanner> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'banner_id',
    autoIncrement: true,
  })
  bannerId: number;

  @Column({
    allowNull: false,
    field: 'title',
    type: DataType.STRING(100),
  })
  title: string;

  @Column({
    allowNull: true,
    field: 'sub_title',
    type: DataType.STRING(200),
  })
  subTitle: string;

  @Column({
    allowNull: false,
    field: 'image_path',
    type: DataType.JSONB,
  })
  imagePath: IMediaUpload[];

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  active: boolean;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_internal_url',
    type: DataType.BOOLEAN,
  })
  isInternalUrl: boolean;

  @Column({
    allowNull: true,
    field: 'url',
    type: DataType.STRING(200),
  })
  url: string;

  @Column({
    allowNull: false,
    defaultValue: BannerForEnum.HOME,
    field: 'banner_for',
    type: DataType.ENUM(...Object.values(BannerForEnum)),
  })
  bannerFor: BannerForEnum;

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
    allowNull: true,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  createdIp: string;

  @Column({
    allowNull: true,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  modifiedIp: string;
}
