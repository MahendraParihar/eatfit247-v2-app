import { Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  modelName: 'log_errors',
  schema: 'public',
  updatedAt: false,
  createdAt: false
})
export class LogError extends Model<LogError> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'error_id',
    autoIncrement: true,
  })
  errorId: number;

  @Column({
    allowNull: false,
    field: 'environment',
  })
  environment: string;

  @Column({
    allowNull: false,
    field: 'browser',
  })
  browser: string;

  @Column({
    allowNull: false,
    field: 'host_url',
  })
  hostUrl: string;

  @Column({
    allowNull: false,
    field: 'server_name',
  })
  serverName: string;

  @Column({
    allowNull: true,
    field: 'controller',
  })
  controller: string;

  @Column({
    allowNull: true,
    field: 'method_name',
  })
  methodName: string;

  @Column({
    allowNull: true,
    field: 'exception_message',
  })
  exceptionMessage: string;

  @Column({
    allowNull: true,
    field: 'exception_message_sql',
  })
  exceptionMessageSQL: string;

  @Column({
    allowNull: true,
    field: 'exception_type',
  })
  exceptionType: string;

  @Column({
    allowNull: true,
    field: 'exception_source',
  })
  exceptionSource: string;

  @Column({
    allowNull: true,
    field: 'exception_target',
  })
  exceptionTarget: string;

  @Column({
    allowNull: true,
    field: 'exception_stacktrace',
  })
  exceptionStacktrace: string;

  @CreatedAt
  @Column({
    allowNull: true,
    field: 'error_timestamp',
  })
  errorTimestamp: Date;
}
