import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'txn_admin_user_forgot_password_otp',
  timestamps: true,
})
export class TxnAdminUserForgotPasswordOtp extends Model<TxnAdminUserForgotPasswordOtp> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'forgot_password_otp_id',
  })
  forgotPasswordOtpId: number;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'adminId',
    targetKey: 'adminId',
    as: 'adminUserAdmin',
  })
  @Column({
    allowNull: false,
    field: 'admin_id',
  })
  adminId: number;

  @Column({
    type: DataType.STRING(6),
    allowNull: false,
    field: 'otp',
  })
  otp: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;
}
