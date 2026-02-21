import { Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'notification_logs',
  schema: 'public',
  freezeTableName: true,
  timestamps: true,
})
export class NotificationLogModel extends Model<NotificationLogModel> {
  @Column({
    field: 'id',
    allowNull: false,
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    field: 'member_id',
    allowNull: true,
    type: DataType.INTEGER,
  })
  declare memberId: number | null;

  @Column({
    field: 'type',
    allowNull: true,
    type: DataType.STRING(50),
  })
  declare type: string | null;

  @Column({
    field: 'channel',
    allowNull: false,
    type: DataType.STRING(20),
  })
  declare channel: string;

  @Column({
    field: 'status',
    allowNull: false,
    type: DataType.STRING(20),
    defaultValue: 'pending',
  })
  declare status: string;

  @Column({
    field: 'provider',
    allowNull: true,
    type: DataType.STRING(50),
  })
  declare provider: string | null;

  @Column({
    field: 'provider_message_id',
    allowNull: true,
    type: DataType.STRING(255),
  })
  declare providerMessageId: string | null;

  @Column({
    field: 'attempts',
    allowNull: false,
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare attempts: number;

  @Column({
    field: 'idempotency_key',
    allowNull: true,
    type: DataType.STRING(255),
    unique: true,
  })
  declare idempotencyKey: string | null;

  @Column({
    field: 'error',
    allowNull: true,
    type: DataType.TEXT,
  })
  declare error: string | null;

  @Column({
    field: 'payload',
    allowNull: true,
    type: DataType.JSONB,
  })
  declare payload: Record<string, any> | null;

  @Column({
    field: 'response',
    allowNull: true,
    type: DataType.JSONB,
  })
  declare response: Record<string, any> | null;

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
}
