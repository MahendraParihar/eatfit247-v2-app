import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstFranchise } from './mst-franchise.model';

@Table({
  modelName: 'mst_referrer',
  schema: 'public',
})
export class MstReferrer extends Model<MstReferrer> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'referrer_id',
    autoIncrement: true,
  })
  referrerId: number;

  @Column({
    allowNull: false,
    field: 'name',
    type: DataType.STRING(100),
  })
  name: string;

  @Column({
    allowNull: true,
    field: 'company_name',
    type: DataType.STRING(100),
  })
  companyName: string;

  @Column({
    allowNull: true,
    field: 'website_link',
    type: DataType.STRING(100),
  })
  websiteLink: string;

  @Column({
    allowNull: true,
    field: 'logo',
    type: DataType.JSONB,
  })
  logo: string;

  @BelongsTo(() => MstFranchise, {
    foreignKey: 'franchiseId',
    targetKey: 'franchiseId',
    as: 'Franchise',
  })
  @Column({
    allowNull: false,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  franchiseId: number;

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

  @Column({
    allowNull: true,
    field: 'alternate_contact_number',
    type: DataType.STRING(16),
  })
  alternateContactNumber: string;

  @Column({
    allowNull: true,
    field: 'alternate_email_id',
    validate: { isEmail: true },
    type: DataType.STRING(100),
  })
  alternateEmailId: string;

  @Column({
    allowNull: true,
    field: 'pan_number',
    type: DataType.STRING(20),
  })
  panNumber: string;

  @Column({
    allowNull: true,
    field: 'tan_number',
    type: DataType.STRING(20),
  })
  tanNumber: string;

  @Column({
    allowNull: true,
    field: 'gst_number',
    type: DataType.STRING(50),
  })
  gstNumber: string;

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

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'CreatedBy',
  })
  @Column({
    allowNull: false,
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
    allowNull: false,
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
