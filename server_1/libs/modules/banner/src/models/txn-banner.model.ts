import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { BannerForEnum, IMediaUpload, InputLengthEnum } from '@eatfit247-shared-lib';

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
  declare bannerId: number;

  @Column({
    allowNull: false,
    field: 'title',
    type: DataType.STRING(100),
  })
  declare title: string;

  @Column({
    allowNull: true,
    field: 'sub_title',
    type: DataType.STRING(200),
  })
  declare subTitle: string;

  @Column({
    allowNull: false,
    field: 'image_path',
    type: DataType.JSONB,
  })
  declare imagePath: IMediaUpload[];

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @Column({
    allowNull: false,
    defaultValue: BannerForEnum.HOME,
    field: 'banner_for',
    type: DataType.ENUM(...Object.values(BannerForEnum)),
  })
  declare bannerFor: BannerForEnum;

  @Column({
    allowNull: true,
    defaultValue: 'center',
    field: 'image_position',
    type: DataType.STRING(10),
  })
  declare imagePosition: string;

  @Column({
    allowNull: true,
    field: 'title_icon',
    type: DataType.STRING(20),
  })
  declare titleIcon: string;

  @Column({
    allowNull: true,
    field: 'description',
    type: DataType.TEXT,
  })
  declare description: string;

  @Column({
    allowNull: true,
    field: 'primary_action_text',
    type: DataType.STRING(50),
  })
  declare primaryActionText: string;

  @Column({
    allowNull: true,
    field: 'primary_action_url',
    type: DataType.STRING(100),
  })
  declare primaryActionUrl: string;

  @Column({
    allowNull: true,
    field: 'secondary_action_text',
    type: DataType.STRING(50),
  })
  declare secondaryActionText: string;

  @Column({
    allowNull: true,
    field: 'secondary_action_url',
    type: DataType.STRING(100),
  })
  declare secondaryActionUrl: string;

  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  declare createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'updatedBy', targetKey: 'adminId' })
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
    field: 'updated_by',
    type: DataType.INTEGER,
  })
  declare updatedBy: number;

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
  declare createdIp: string;

  @Column({
    allowNull: true,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;
}
