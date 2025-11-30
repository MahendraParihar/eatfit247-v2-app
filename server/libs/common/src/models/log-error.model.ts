import { Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'log_error',
  schema: 'public',
  freezeTableName: true,
  timestamps: true,
  updatedAt: false,
})
export class LogErrorModel extends Model<LogErrorModel> {
  @Column({
    field: 'error_id',
    allowNull: false,
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  errorId: number;

  @Column({
    field: 'environment',
    allowNull: true,
    type: DataType.STRING(100),
  })
  environment: string;

  @Column({
    field: 'browser',
    allowNull: true,
    type: DataType.STRING(100),
  })
  browser: string;

  @Column({
    field: 'host_url',
    allowNull: true,
    type: DataType.STRING(100),
  })
  hostUrl: string;

  @Column({
    field: 'server_name',
    allowNull: true,
    type: DataType.STRING(100),
  })
  serverName: string;

  @Column({
    field: 'controller',
    allowNull: true,
    type: DataType.STRING(100),
  })
  controller: string;

  @Column({
    field: 'method_name',
    allowNull: true,
    type: DataType.STRING(100),
  })
  methodName: string;

  @Column({
    field: 'exception_message',
    allowNull: true,
    type: DataType.TEXT,
  })
  exceptionMessage: string;

  @Column({
    field: 'exception_message_sql',
    allowNull: true,
    type: DataType.TEXT,
  })
  exceptionMessageQql: string;

  @Column({
    field: 'exception_type',
    allowNull: true,
    type: DataType.STRING(200),
  })
  exceptionType: string;

  @Column({
    field: 'exception_source',
    allowNull: true,
    type: DataType.STRING(200),
  })
  exceptionSource: string;

  @Column({
    field: 'exception_target',
    allowNull: true,
    type: DataType.STRING(200),
  })
  exceptionTarget: string;

  @Column({
    field: 'exception_stacktrace',
    allowNull: true,
    type: DataType.STRING(200),
  })
  exceptionStacktrace: string;

  @Column({
    field: 'active',
    allowNull: false,
    defaultValue: true,
    type: DataType.BOOLEAN,
  })
  active: boolean;

  @CreatedAt
  @Column({
    field: 'error_timestamp',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  errorTimestamp: Date;
}

