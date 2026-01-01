import { Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'log_errors',
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
  declare errorId: number;

  @Column({
    field: 'environment',
    allowNull: true,
    type: DataType.STRING(250),
  })
  declare environment: string;

  @Column({
    field: 'browser',
    allowNull: true,
    type: DataType.STRING(250),
  })
  declare browser: string | null;

  @Column({
    field: 'host_url',
    allowNull: true,
    type: DataType.STRING(250),
  })
  declare hostUrl: string | null;

  @Column({
    field: 'server_name',
    allowNull: true,
    type: DataType.STRING(250),
  })
  declare serverName: string | null;

  @Column({
    field: 'controller',
    allowNull: true,
    type: DataType.STRING(250),
  })
  declare controller: string | null;

  @Column({
    field: 'method_name',
    allowNull: true,
    type: DataType.STRING(250),
  })
  declare methodName: string | null;

  @Column({
    field: 'exception_message',
    allowNull: true,
    type: DataType.TEXT,
  })
  declare exceptionMessage: string;

  @Column({
    field: 'exception_message_sql',
    allowNull: true,
    type: DataType.TEXT,
  })
  declare exceptionMessageQql: string;

  @Column({
    field: 'exception_type',
    allowNull: true,
    type: DataType.STRING(200),
  })
  declare exceptionType: string;

  @Column({
    field: 'exception_source',
    allowNull: true,
    type: DataType.STRING(200),
  })
  declare exceptionSource: string;

  @Column({
    field: 'exception_target',
    allowNull: true,
    type: DataType.STRING(200),
  })
  declare exceptionTarget: string;

  @Column({
    field: 'exception_stacktrace',
    allowNull: true,
    type: DataType.TEXT,
  })
  declare exceptionStacktrace: string | null;

  @CreatedAt
  @Column({
    field: 'error_timestamp',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare errorTimestamp: Date;
}

