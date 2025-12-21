import { BelongsTo, Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_admin_last_login_details',
  schema: 'public',
  tableName: 'txn_admin_last_login_details',
  timestamps: false,
})
export class TxnAdminLastLoginDetail extends Model<TxnAdminLastLoginDetail> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'admin_last_login_detail_id',
    autoIncrement: true,
  })
  declare adminLastLoginDetailId: number;
  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'adminId',
    targetKey: 'adminId',
    as: 'adminUser',
  })
  declare adminUser: MstAdminUser;
  @Column({
    allowNull: false,
    field: 'admin_id',
    type: DataType.INTEGER,
  })
  declare adminId: number;
  @Column({
    allowNull: false,
    field: 'device_detail',
    type: DataType.JSONB,
  })
  declare deviceDetail: string;
  @CreatedAt
  @Column({
    allowNull: false,
    field: 'last_login_timestamp',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare lastLoginTimestamp: Date;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'is_latest',
    type: DataType.BOOLEAN,
  })
  declare isLatest: boolean;
  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;
}

