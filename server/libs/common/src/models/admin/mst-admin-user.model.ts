import { BelongsTo, Column, CreatedAt, DataType, Index, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { IMediaUpload, InputLengthEnum } from 'eatfit247-shared-lib';
import { getCreatedByUserInclude, getUpdatedByUserInclude } from '../../utils/model-scopes.utils';
import { MstFranchise } from '../mst-franchise.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_admin_users',
  schema: 'public',
  tableName: 'mst_admin_users',
  indexes: [
    {
      unique: false,
      fields: ['email_id'],
      name: 'ix_mst_admin_users_email',
    },
    {
      unique: true,
      fields: ['contact_number'],
      name: 'ix_uq_mst_admin_users_contact_number',
    },
    {
      unique: true,
      fields: ['email_id'],
      name: 'ix_uq_mst_admin_users_email',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
    ],
  },
}))
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
  declare profilePicture: IMediaUpload[];
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
    as: 'franchise',
  })
  franchise: any;
  @Column({
    allowNull: true,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  declare franchiseId: number;
  @Column({
    allowNull: false,
    field: 'active',
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare active: boolean;
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
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare updatedAt: Date;
  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  createdByUser: MstAdminUser;
  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
  updatedByUser: MstAdminUser;
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

