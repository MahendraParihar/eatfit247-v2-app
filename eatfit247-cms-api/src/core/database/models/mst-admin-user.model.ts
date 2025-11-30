import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { UserStatusEnum } from 'shared-lib';
import { MstFranchise } from './mst-franchise.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_admin_users',
  schema: 'public',
  timestamps: true,
})
export class MstAdminUser extends Model<MstAdminUser> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'admin_id',
    autoIncrement: true,
  })
  declare adminId: number;
  @Column({
    allowNull: false,
    field: 'first_name',
    type: DataType.STRING(50),
  })
  declare firstName: string;
  @Column({
    allowNull: false,
    field: 'last_name',
    type: DataType.STRING(50),
  })
  declare lastName: string;
  @Column({
    allowNull: true,
    field: 'profile_picture',
    type: DataType.JSONB,
  })
  declare profilePicture: string;
  @Column({
    allowNull: false,
    field: 'password',
    type: DataType.TEXT,
  })
  declare password: string;
  @Column({
    allowNull: true,
    field: 'password_temp',
    type: DataType.TEXT,
  })
  declare passwordTemp: string;
  @Column({
    allowNull: false,
    field: 'country_code',
    type: DataType.STRING(5),
  })
  declare countryCode: string;
  @Column({
    allowNull: false,
    field: 'contact_number',
    unique: true,
    type: DataType.STRING(16),
  })
  declare contactNumber: string;
  @Column({
    allowNull: false,
    field: 'email_id',
    unique: true,
    validate: { isEmail: true },
    type: DataType.STRING(100),
  })
  declare emailId: string;
  @Column({
    allowNull: true,
    field: 'address_id',
    type: DataType.INTEGER,
  })
  declare addressId: number;
  @Column({
    allowNull: false,
    field: 'start_date',
    type: DataType.DATE,
  })
  declare startDate: Date;
  @Column({
    allowNull: true,
    field: 'end_date',
    type: DataType.DATE,
  })
  declare endDate: Date;
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
  declare franchiseId: number;
  @Column({
    allowNull: false,
    field: 'admin_user_status_id',
    type: DataType.INTEGER,
    defaultValue: UserStatusEnum.VERIFICATION_PENDING,
  })
  declare adminUserStatusId: number;
  @Column({
    allowNull: true,
    field: 'deactivation_reason',
    type: DataType.STRING(1000),
  })
  declare deactivationReason: string;
  @Column({
    allowNull: true,
    field: 'verification_code',
    type: DataType.TEXT,
  })
  declare verificationCode: string;
  @Column({
    allowNull: true,
    field: 'created_by',
  })
  declare createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    allowNull: true,
    field: 'modified_by',
    defaultValue: DataType.NOW,
  })
  declare modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(50),
  })
  declare createdIp: string;
  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(50),
  })
  declare modifiedIp: string;
}
