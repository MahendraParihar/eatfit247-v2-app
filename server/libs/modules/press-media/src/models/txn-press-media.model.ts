import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, CommonScopes, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';
import { IMediaUpload, InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_press_media',
  schema: 'public',
  tableName: 'txn_press_media',
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
export class TxnPressMedia extends Model<TxnPressMedia> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'press_media_id',
    autoIncrement: true,
  })
  pressMediaId: number;

  @Column({
    allowNull: true,
    field: 'title',
    type: DataType.STRING(200),
  })
  title: string;

  @Column({
    allowNull: false,
    field: 'image_path',
    type: DataType.JSONB,
  })
  imagePath: IMediaUpload[];

  @Column({
    allowNull: false,
    field: 'type',
    type: DataType.ENUM('youtube', 'press'),
    defaultValue: 'press',
  })
  type: 'youtube' | 'press';

  @Column({
    allowNull: false,
    field: 'link',
    type: DataType.TEXT,
  })
  link: string;

  @Column({
    allowNull: true,
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

