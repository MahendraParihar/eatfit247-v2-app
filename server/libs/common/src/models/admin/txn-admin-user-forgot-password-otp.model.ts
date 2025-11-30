import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_admin_user_forgot_password_otp',
  schema: 'public',
  tableName: 'txn_admin_user_forgot_password_otp',
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
    type: DataType.STRING(InputLengthEnum.OTP),
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

