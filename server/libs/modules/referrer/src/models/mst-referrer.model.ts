import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_referrers',
  schema: 'public',
  tableName: 'mst_referrers',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
}))
export class MstReferrer extends Model<MstReferrer> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'referrer_id',
    autoIncrement: true,
  })
  declare referrerId: number;

  @Column({
    allowNull: false,
    field: 'name',
    type: DataType.STRING(100),
  })
  declare name: string;

  @Column({
    allowNull: true,
    field: 'company_name',
    type: DataType.STRING(100),
  })
  declare companyName: string;

  @Column({
    allowNull: true,
    field: 'website_link',
    type: DataType.STRING(100),
  })
  declare websiteLink: string;

  @Column({
    allowNull: false,
    field: 'logo',
    type: DataType.JSONB,
  })
  declare logo: string;

  @Column({
    allowNull: false,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  declare franchiseId: number;

  @Column({
    allowNull: false,
    field: 'email_id',
    type: DataType.STRING(50),
  })
  declare emailId: string;

  @Column({
    allowNull: false,
    field: 'alternate_email_id',
    type: DataType.STRING(100),
  })
  declare alternateEmailId: string;

  @Column({
    allowNull: false,
    field: 'contact_number',
    type: DataType.STRING(16),
  })
  declare contactNumber: string;

  @Column({
    allowNull: false,
    field: 'alternate_contact_number',
    type: DataType.STRING(16),
  })
  declare alternateContactNumber: string;

  @Column({
    allowNull: false,
    field: 'postal_address',
    type: DataType.STRING(100),
  })
  declare postalAddress: string;

  @Column({
    allowNull: true,
    field: 'state_id',
    type: DataType.INTEGER,
  })
  declare stateId: number;

  @Column({
    allowNull: true,
    field: 'country_id',
    type: DataType.INTEGER,
  })
  declare countryId: number;

  @Column({
    allowNull: true,
    field: 'pin_code',
    type: DataType.STRING(10),
  })
  declare pinCode: string;

  @Column({
    allowNull: true,
    field: 'pan_number',
    type: DataType.STRING(20),
  })
  declare panNumber: string;

  @Column({
    allowNull: true,
    field: 'tan_number',
    type: DataType.STRING(20),
  })
  declare tanNumber: string;

  @Column({
    allowNull: true,
    field: 'gst_number',
    type: DataType.STRING(50),
  })
  declare gstNumber: string;

  @Column({
    allowNull: true,
    field: 'start_date',
    type: DataType.DATEONLY,
  })
  declare startDate: Date;

  @Column({
    allowNull: true,
    field: 'end_date',
    type: DataType.DATEONLY,
  })
  declare endDate: Date;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  declare createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
  declare updatedByUser: MstAdminUser;

  @Column({
    allowNull: false,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  declare createdBy: number;

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
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;
}

