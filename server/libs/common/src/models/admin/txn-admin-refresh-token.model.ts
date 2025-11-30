import { BelongsTo, Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  schema: 'public',
  tableName: 'txn_admin_refresh_tokens',
  timestamps: false,
})
export class TxnAdminRefreshToken extends Model<TxnAdminRefreshToken> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'admin_refresh_token_id',
    autoIncrement: true,
  })
  adminRefreshTokenId: number;
  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'adminId',
    targetKey: 'adminId',
    as: 'adminUser',
  })
  adminUser: MstAdminUser;
  @Column({
    allowNull: false,
    field: 'admin_id',
    type: DataType.INTEGER,
  })
  adminId: number;
  @Column({
    allowNull: false,
    field: 'token_hash',
    type: DataType.TEXT,
  })
  tokenHash: string;
  @Column({
    allowNull: false,
    field: 'expires_at',
    type: DataType.DATE,
  })
  expiresAt: Date;
  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'revoked',
    type: DataType.BOOLEAN,
  })
  revoked: boolean;
  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;
  @Column({
    allowNull: true,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  createdIp: string;
}

