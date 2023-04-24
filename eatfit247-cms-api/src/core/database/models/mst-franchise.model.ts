import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'mst_franchise',
  schema: 'public',
})
export class MstFranchise extends Model<MstFranchise> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'franchise_id',
    autoIncrement: true,
  })
  franchiseId: number;

  @Column({
    allowNull: false,
    field: 'company_name',
    type: DataType.STRING(100),
  })
  companyName: string;

  @Column({
    allowNull: true,
    field: 'logo',
    type: DataType.JSONB,
  })
  logo: string;

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
    field: 'is_primary',
    defaultValue: false,
    type: DataType.BOOLEAN,
  })
  isPrimary: boolean;

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
