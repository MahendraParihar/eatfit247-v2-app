import { Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';

@Table({
  modelName: 'txn_subscriber',
  schema: 'public',
})
export class TxnSubscriber extends Model<TxnSubscriber> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'subscriber_id',
    autoIncrement: true,
  })
  subscriberId: number;

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
    unique: true,
    type: DataType.STRING(100),
  })
  emailId: string;

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
