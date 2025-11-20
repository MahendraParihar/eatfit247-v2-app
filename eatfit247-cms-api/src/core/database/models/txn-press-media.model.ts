import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'txn_press_media',
  schema: 'public',
})
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
  imagePath: string;

  @Column({
    allowNull: false,
    field: 'type',
    type: DataType.ENUM('youtube', 'press'),
    defaultValue: 'press',
  })
  type: string;

  @Column({
    allowNull: false,
    field: 'link',
    type: DataType.TEXT,
  })
  link: string;

  @Column({
    allowNull: true,
    field: 'active',
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  active: boolean;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'CreatedBy',
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
  createdAt: Date;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
    as: 'ModifiedBy',
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
  updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(50),
  })
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(50),
  })
  modifiedIp: string;
}

