import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import {
  MstAdminUser,
  getCreatedByUserInclude,
  getUpdatedByUserInclude,
  MstFranchise,
  MstCountry,
} from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_members',
  schema: 'public',
  tableName: 'txn_members',
  indexes: [
    {
      unique: false,
      fields: ['email_id'],
      name: 'ix_txn_member_email',
    },
    {
      unique: false,
      fields: ['first_name'],
      name: 'ix_txn_member_first_name',
    },
    {
      unique: false,
      fields: ['last_name'],
      name: 'ix_txn_member_last_name',
    },
    {
      unique: true,
      fields: ['email_id'],
      name: 'ix_uq_txn_member_email',
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
      {
        model: MstCountry,
        as: 'country',
        required: false,
        attributes: ['countryId', 'country'],
      },
      {
        model: MstAdminUser,
        as: 'nutritionist',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName'],
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
      {
        model: MstCountry,
        as: 'country',
        required: false,
        attributes: ['countryId', 'country'],
      },
      {
        model: MstAdminUser,
        as: 'nutritionist',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName'],
      },
    ],
  },
}))
export class TxnMember extends Model<TxnMember> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_id',
    autoIncrement: true,
  })
  declare memberId: number;
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
    type: DataType.STRING(16),
  })
  declare contactNumber: string;
  @Column({
    allowNull: false,
    field: 'email_id',
    unique: true,
    type: DataType.STRING(100),
  })
  declare emailId: string;
  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'has_any_plan',
    type: DataType.BOOLEAN,
  })
  declare hasAnyPlan: boolean;
  @Column({
    allowNull: true,
    field: 'referrer_id',
    type: DataType.INTEGER,
  })
  declare referrerId: number;

  @BelongsTo(() => MstFranchise, {
    foreignKey: 'franchiseId',
    targetKey: 'franchiseId',
    as: 'franchise',
  })
  declare franchise: any;
  @Column({
    allowNull: false,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  declare franchiseId: number;
  @BelongsTo(() => MstCountry, {
    foreignKey: 'countryId',
    targetKey: 'countryId',
    as: 'country',
  })
  declare country: any;
  @Column({
    allowNull: false,
    field: 'country_id',
    type: DataType.INTEGER,
  })
  declare countryId: number;
  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'nutritionistId',
    targetKey: 'adminId',
    as: 'nutritionist',
  })
  declare nutritionist: MstAdminUser;
  @Column({
    allowNull: true,
    field: 'nutritionist_id',
    type: DataType.INTEGER,
  })
  declare nutritionistId: number;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;
  @Column({
    allowNull: true,
    field: 'deactivation_reason',
    type: DataType.STRING(1000),
  })
  declare deactivationReason: string;
  @BelongsTo(() => MstAdminUser, {
    as: 'createdByUser',
    foreignKey: 'createdBy',
    targetKey: 'adminId',
  })
  declare createdByUser: MstAdminUser;
  @BelongsTo(() => MstAdminUser, {
    as: 'updatedByUser',
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
  })
  declare updatedByUser: MstAdminUser;
  @Column({
    allowNull: true,
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
    allowNull: true,
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

