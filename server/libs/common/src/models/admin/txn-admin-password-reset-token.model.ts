import { BelongsTo, Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  schema: 'public',
  tableName: 'txn_admin_password_reset_tokens',
  timestamps: false,
})
export class TxnAdminPasswordResetToken extends Model<TxnAdminPasswordResetToken> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'admin_password_reset_token_id',
    autoIncrement: true,
  })
  declare adminPasswordResetTokenId: number;

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
  declare adminId: number;

  @Column({
    allowNull: false,
    field: 'token_hash',
    type: DataType.TEXT,
  })
  declare tokenHash: string;

  @Column({
    allowNull: false,
    field: 'expires_at',
    type: DataType.DATE,
  })
  declare expiresAt: Date;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'used',
    type: DataType.BOOLEAN,
  })
  declare used: boolean;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    allowNull: true,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;

  @Column({
    allowNull: true,
    field: 'user_agent',
    type: DataType.TEXT,
  })
  declare userAgent: string;
}

