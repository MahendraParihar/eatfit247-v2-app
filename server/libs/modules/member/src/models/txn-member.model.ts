import { BelongsTo, Column, CreatedAt, DataType, Index, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';
// Using forward references to avoid circular dependencies
import type { MstReferrer } from '../../../referrer/src/models/mst-referrer.model';
import type { MstFranchise } from '../../../../common/src/models/mst-franchise.model';
import type { MstCountry } from '../../../locations/src/models/mst-country.model';

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
        model: require('../../../referrer/src/models/mst-referrer.model').MstReferrer,
        as: 'referrer',
        required: false,
        attributes: ['referrerId', 'name'],
      },
      {
        model: require('../../../../common/src/models/mst-franchise.model').MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
      {
        model: require('../../../locations/src/models/mst-country.model').MstCountry,
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
        model: require('../../../referrer/src/models/mst-referrer.model').MstReferrer,
        as: 'referrer',
        required: false,
        attributes: ['referrerId', 'name'],
      },
      {
        model: require('../../../../common/src/models/mst-franchise.model').MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
      {
        model: require('../../../locations/src/models/mst-country.model').MstCountry,
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
    type: DataType.STRING(16),
  })
  contactNumber: string;

  @Column({
    allowNull: false,
    field: 'email_id',
    unique: true,
    type: DataType.STRING(100),
  })
  emailId: string;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'has_any_plan',
    type: DataType.BOOLEAN,
  })
  hasAnyPlan: boolean;

  @BelongsTo(() => require('../../../referrer/src/models/mst-referrer.model').MstReferrer, {
    foreignKey: 'referrerId',
    targetKey: 'referrerId',
    as: 'referrer',
  })
  referrer: any;

  @Column({
    allowNull: true,
    field: 'referrer_id',
    type: DataType.INTEGER,
  })
  referrerId: number;

  @BelongsTo(() => require('../../../../common/src/models/mst-franchise.model').MstFranchise, {
    foreignKey: 'franchiseId',
    targetKey: 'franchiseId',
    as: 'franchise',
  })
  franchise: any;

  @Column({
    allowNull: false,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  franchiseId: number;

  @BelongsTo(() => require('../../../locations/src/models/mst-country.model').MstCountry, {
    foreignKey: 'countryId',
    targetKey: 'countryId',
    as: 'country',
  })
  country: any;

  @Column({
    allowNull: false,
    field: 'country_id',
    type: DataType.INTEGER,
  })
  countryId: number;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'nutritionistId',
    targetKey: 'adminId',
    as: 'nutritionist',
  })
  nutritionist: MstAdminUser;

  @Column({
    allowNull: true,
    field: 'nutritionist_id',
    type: DataType.INTEGER,
  })
  nutritionistId: number;

  @Column({
    allowNull: false,
    defaultValue: -1,
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

  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
  updatedByUser: MstAdminUser;

  @Column({
    allowNull: true,
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
    allowNull: true,
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

