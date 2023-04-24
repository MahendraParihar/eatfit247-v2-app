import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstReferrer } from './mst-referrer.model';
import { UserStatusEnum } from '../../../enums/user-status-enum';
import { MstFranchise } from './mst-franchise.model';
import { MstCountries } from './mst-countries.model';
import { MstUserStatus } from './mst_user_status.model';

@Table({
  modelName: 'txn_member',
  schema: 'public',
})
export class TxnMember extends Model<TxnMember> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_id',
    autoIncrement: true,
  })
  memberId: number;

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
    allowNull: false,
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

  @BelongsTo(() => MstUserStatus, {
    foreignKey: 'userStatusId',
    targetKey: 'userStatusId',
    as: 'UserStatus',
  })
  @Column({
    allowNull: false,
    defaultValue: UserStatusEnum.VERIFICATION_PENDING,
    field: 'user_status_id',
    type: DataType.INTEGER,
  })
  userStatusId: number;

  @Column({
    allowNull: true,
    field: 'deactivation_reason',
    type: DataType.STRING(1000),
  })
  deactivationReason: string;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'has_any_plan',
  })
  hasAnyPlan: boolean;

  @BelongsTo(() => MstFranchise, {
    foreignKey: 'franchiseId',
    targetKey: 'franchiseId',
    as: 'MemberFranchise',
  })
  @Column({
    allowNull: false,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  franchiseId: number;

  @BelongsTo(() => MstReferrer, {
    foreignKey: 'referrerId',
    targetKey: 'referrerId',
    as: 'MemberReferrer',
  })
  @Column({
    allowNull: true,
    field: 'referrer_id',
    type: DataType.INTEGER,
  })
  referrerId: number;

  @BelongsTo(() => MstCountries, {
    foreignKey: 'countryId',
    targetKey: 'countryId',
    as: 'MemberCountry',
  })
  @Column({
    allowNull: true,
    field: 'country_id',
    type: DataType.INTEGER,
  })
  countryId: number;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'nutritionistId',
    targetKey: 'adminId',
    as: 'MemberNutritionist',
  })
  @Column({
    allowNull: true,
    field: 'nutritionist_id',
    type: DataType.INTEGER,
  })
  nutritionistId: number;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'CreatedBy',
  })
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

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
    as: 'ModifiedBy',
  })
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
