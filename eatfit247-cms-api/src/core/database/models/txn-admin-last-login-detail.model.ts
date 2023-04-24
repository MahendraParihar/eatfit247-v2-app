import { BelongsTo, Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'txn_admin_last_login_detail',
  schema: 'public',
  createdAt: false,
  updatedAt: false,
})
export class TxnAdminLastLoginDetail extends Model<TxnAdminLastLoginDetail> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'admin_last_login_detail_id',
    autoIncrement: true,
  })
  adminLastLoginDetailId: number;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'admin_id',
    targetKey: 'adminId',
    as: 'Admin',
  })
  @Column({
    allowNull: false,
    field: 'admin_id',
    type: DataType.INTEGER,
  })
  adminId: string;

  @Column({
    allowNull: false,
    field: 'device_detail',
    type: DataType.JSONB,
  })
  deviceDetail: string;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'last_login_timestamp',
  })
  lastLoginTimestamp: Date;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'is_latest',
    type: DataType.BOOLEAN,
  })
  isLatest: boolean;

  @Column({
    allowNull: false,
    field: 'created_ip',
  })
  createdIp: string;
}
