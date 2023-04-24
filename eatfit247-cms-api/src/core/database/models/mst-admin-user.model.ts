import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { UserStatusEnum } from '../../../enums/user-status-enum';
import { MstFranchise } from './mst-franchise.model';

@Table({
  modelName: 'mst_admin_user',
  schema: 'public',
})
export class MstAdminUser extends Model<MstAdminUser> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'admin_id',
    autoIncrement: true,
  })
  adminId: number;

  @Column({
    allowNull: false,
    field: 'first_name',
    type: DataType.STRING(50),
  })
  firstName: string;

  @Column({
    allowNull: false,
    field: 'last_name',
    type: DataType.STRING(50),
  })
  lastName: string;

  @Column({
    allowNull: true,
    field: 'profile_picture',
    type: DataType.JSONB,
  })
  profilePicture: string;

  @Column({
    allowNull: false,
    field: 'password',
    type: DataType.TEXT,
  })
  password: string;

  @Column({
    allowNull: true,
    field: 'password_temp',
    type: DataType.TEXT,
  })
  passwordTemp: string;

  @Column({
    allowNull: false,
    field: 'country_code',
    type: DataType.STRING(5),
  })
  countryCode: string;

  @Column({
    allowNull: false,
    field: 'contact_number',
    unique: true,
    type: DataType.STRING(16),
  })
  contactNumber: string;

  @Column({
    allowNull: false,
    field: 'email_id',
    unique: true,
    validate: { isEmail: true },
    type: DataType.STRING(100),
  })
  emailId: string;

  @Column({
    allowNull: true,
    field: 'address_id',
    type: DataType.INTEGER,
  })
  addressId: number;

  @Column({
    allowNull: false,
    field: 'start_date',
    type: DataType.DATEONLY,
  })
  startDate: Date;

  @Column({
    allowNull: true,
    field: 'end_date',
    type: DataType.DATEONLY,
  })
  endDate: Date;

  @BelongsTo(() => MstFranchise, {
    foreignKey: 'franchiseId',
    targetKey: 'franchiseId',
    as: 'AdminFranchise',
  })
  @Column({
    allowNull: true,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  franchiseId: number;

  @Column({
    allowNull: true,
    field: 'admin_user_status_id',
    type: DataType.INTEGER,
    defaultValue: UserStatusEnum.VERIFICATION_PENDING,
  })
  adminUserStatusId: number;

  @Column({
    allowNull: true,
    field: 'deactivation_reason',
    type: DataType.STRING(1000),
  })
  deactivationReason: string;

  @Column({
    allowNull: true,
    field: 'verification_code',
    type: DataType.TEXT,
  })
  verificationCode: string;

  @Column({
    allowNull: true,
    field: 'created_by',
  })
  createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;

  @Column({
    allowNull: true,
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
  })
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
  })
  modifiedIp: string;
}
