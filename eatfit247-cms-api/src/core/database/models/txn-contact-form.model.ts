import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'txn_contact_form',
  schema: 'public',
})
export class TxnContactForm extends Model<TxnContactForm> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'contact_form_id',
    autoIncrement: true,
  })
  contactFormId: number;

  @Column({
    allowNull: false,
    field: 'name',
    type: DataType.STRING(100),
  })
  name: string;

  @Column({
    allowNull: false,
    field: 'email_id',
    validate: { isEmail: true },
    type: DataType.STRING(100),
  })
  emailId: string;

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
    field: 'message',
    type: DataType.STRING(1000),
  })
  message: string;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'responded_by',
    targetKey: 'adminId',
    as: 'RespondedBy',
  })
  @Column({
    allowNull: true,
    field: 'responded_by',
    type: DataType.INTEGER,
  })
  respondedBy: number;

  @Column({
    allowNull: true,
    field: 'responded_message',
    type: DataType.STRING(1000),
  })
  respondedMessage: string;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;

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
