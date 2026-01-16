import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { MstAdminUser } from './admin';

@Table({
  freezeTableName: true,
  modelName: 'txn_contact_forms',
  schema: 'public',
  tableName: 'txn_contact_forms',
  indexes: [
    {
      unique: false,
      fields: ['email_id'],
      name: 'ix_txn_contact_forms_email',
    },
    {
      unique: false,
      fields: ['created_at'],
      name: 'ix_txn_contact_forms_created_at',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      {
        model: MstAdminUser,
        as: 'respondedByUser',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName'],
      },
    ],
  },
  details: {
    include: [
      {
        model: MstAdminUser,
        as: 'respondedByUser',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName'],
      },
    ],
  },
}))
export class TxnContactForm extends Model<TxnContactForm> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'contact_form_id',
    autoIncrement: true,
  })
  declare contactFormId: number;

  @Column({
    allowNull: false,
    field: 'name',
    type: DataType.STRING(100),
  })
  declare name: string;

  @Column({
    allowNull: false,
    field: 'email_id',
    validate: { isEmail: true },
    type: DataType.STRING(100),
  })
  declare emailId: string;

  @Column({
    allowNull: false,
    field: 'country_code',
    type: DataType.STRING(5),
  })
  declare countryCode: string;

  @Column({
    allowNull: false,
    field: 'contact_number',
    type: DataType.STRING(20),
  })
  declare contactNumber: string;

  @Column({
    allowNull: false,
    field: 'message',
    type: DataType.STRING(1000),
  })
  declare message: string;

  @Column({
    allowNull: true,
    field: 'responded_by',
    type: DataType.INTEGER,
  })
  declare respondedBy: number;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'responded_by',
    targetKey: 'adminId',
    as: 'respondedByUser',
  })
  declare respondedByUser: MstAdminUser;

  @Column({
    allowNull: true,
    field: 'responded_message',
    type: DataType.STRING(1000),
  })
  declare respondedMessage: string;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;

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

