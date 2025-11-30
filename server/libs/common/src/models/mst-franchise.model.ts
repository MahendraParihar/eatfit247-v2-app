import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, CommonScopes } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_franchises',
  schema: 'public',
  tableName: 'mst_franchises',
  indexes: [
    {
      unique: true,
      fields: ['email_id'],
      name: 'ix_uq_mst_franchise_email',
    },
  ],
})
@Scopes(() => ({
  list: CommonScopes.list,
  details: CommonScopes.details,
}))
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
    allowNull: false,
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
    unique: true,
    field: 'email_id',
    type: DataType.STRING(100),
  })
  emailId: string;
  @Column({
    allowNull: false,
    field: 'alternate_email_id',
    type: DataType.STRING(100),
  })
  alternateEmailId: string;
  @Column({
    allowNull: false,
    field: 'contact_number',
    type: DataType.STRING(16),
  })
  contactNumber: string;
  @Column({
    allowNull: false,
    field: 'alternate_contact_number',
    type: DataType.STRING(16),
  })
  alternateContactNumber: string;
  @Column({
    allowNull: false,
    field: 'pan_number',
    type: DataType.STRING(20),
  })
  panNumber: string;
  @Column({
    allowNull: false,
    field: 'tan_number',
    type: DataType.STRING(20),
  })
  tanNumber: string;
  @Column({
    allowNull: false,
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
    defaultValue: false,
    field: 'is_primary',
    type: DataType.BOOLEAN,
  })
  isPrimary: boolean;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  active: boolean;
  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  createdByUser: MstAdminUser;
  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
  updatedByUser: MstAdminUser;
  @Column({
    allowNull: false,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  createdBy: number;
  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;
  @Column({
    allowNull: false,
    field: 'modified_by',
    type: DataType.INTEGER,
  })
  modifiedBy: number;
  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;
  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  createdIp: string;
  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  modifiedIp: string;
}

