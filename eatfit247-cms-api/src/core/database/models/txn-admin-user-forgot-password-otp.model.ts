import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'txn_admin_user_forgot_password_otp',
  freezeTableName: true,
  timestamps: true,
})
export class TxnAdminUserForgotPasswordOtp extends Model<TxnAdminUserForgotPasswordOtp> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'forgot_password_otp_id',
  })
  declare forgotPasswordOtpId: number;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'adminId',
    targetKey: 'adminId',
    as: 'adminUserAdmin',
  })
  @Column({
    allowNull: false,
    field: 'admin_id',
  })
  declare adminId: number;

  @Column({
    type: DataType.STRING(6),
    allowNull: false,
    field: 'otp',
  })
  declare otp: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  declare active: boolean;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;
}
